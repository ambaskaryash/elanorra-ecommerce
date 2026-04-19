import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { Review, User } from '@prisma/client';
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { isMedusaCatalogEnabled } from '@/lib/medusa/config';

const rateLimitConfigs = { api: { windowMs: 60 * 1000, maxRequests: 10 } };

// GET /api/reviews - Get reviews with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const userId = searchParams.get('userId');
    const rating = searchParams.get('rating');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    let sortOrder: 'asc' | 'desc' = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      sortOrder = 'desc';
    }

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (productId) where.productId = productId;
    if (userId) where.userId = userId;
    if (rating) where.rating = parseInt(rating);

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[sortBy] = sortOrder;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: { id: true, clerkId: true, firstName: true, lastName: true }
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: { take: 1, orderBy: { position: 'asc' } }
            }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    const formattedReviews = reviews.map((review: Review & { user?: User }) => ({
      ...review,
      userName: review.user
        ? `${review.user.firstName} ${review.user.lastName}`
        : review.userName,
    }));

    return NextResponse.json({
      reviews: formattedReviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/reviews - Create a new review
const createReviewSchema = z.object({
  productId: z.string(),
  userId: z.string().optional(),
  userName: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1),
  comment: z.string().min(1),
  verified: z.boolean().default(false),
});

/**
 * Resolve a product ID to a local Prisma Product record.
 * Handles three cases:
 *  1. productId is already a local Prisma UUID → return directly
 *  2. productId is a Medusa `prod_xxx` ID → look up by slug or upsert a stub
 *  3. productId is a slug string → look up by slug
 */
async function resolveLocalProduct(productId: string) {
  // 1 — try direct match by Prisma primary key
  const byId = await prisma.product.findUnique({ where: { id: productId } });
  if (byId) return byId;

  // 2 — try by slug (Medusa products are stored locally with slug = Medusa handle)
  const bySlug = await prisma.product.findUnique({ where: { slug: productId } });
  if (bySlug) return bySlug;

  // 3 — For Medusa-sourced products (prod_xxx IDs), upsert a lightweight stub record
  //     so the review can be persisted and displayed.
  if (isMedusaCatalogEnabled() && productId.startsWith('prod_')) {
    try {
      const { getMedusaProductById } = await import('@/lib/medusa/catalog');
      const medusaProduct = await getMedusaProductById(productId);
      if (!medusaProduct) return null;

      // Upsert by slug so subsequent reviews reuse the same record
      const stub = await prisma.product.upsert({
        where: { slug: medusaProduct.slug },
        update: { name: medusaProduct.name },
        create: {
          id: productId,          // store Medusa ID as Prisma ID for direct linkage
          slug: medusaProduct.slug,
          name: medusaProduct.name,
          description: medusaProduct.description || '',
          price: medusaProduct.price ?? 0,
          category: medusaProduct.category || 'general',
          inStock: medusaProduct.inStock ?? true,
          inventory: medusaProduct.inventory ?? 0,
        },
      });
      return stub;
    } catch (err) {
      console.warn('Could not upsert Medusa product stub for review:', err);
      return null;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const limiter = rateLimit(rateLimitConfigs.api);
    const rateResult = await limiter(request);
    if (!rateResult.success) {
      return createRateLimitResponse(rateResult.error!, rateResult.resetTime!);
    }

    // auth() returns Clerk user ID
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ FIX: look up by clerkId, not by prisma user id
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true, firstName: true, lastName: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);

    // ✅ FIX: Medusa-aware product resolution
    const product = await resolveLocalProduct(validatedData.productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Use the resolved local product ID for the review (important for Medusa stubs)
    const localProductId = product.id;

    // Tie review to authenticated user
    validatedData.userId = user.id;
    validatedData.userName = validatedData.userName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

    // Prevent duplicate reviews
    const existingReview = await prisma.review.findFirst({
      where: { productId: localProductId, userId: user.id },
    });
    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 });
    }

    // Mark as verified purchase
    const hasPurchased = await prisma.order.findFirst({
      where: {
        userId: user.id,
        items: { some: { productId: localProductId } },
      },
    });
    validatedData.verified = !!hasPurchased;

    // Create review using resolved local product ID
    const review = await prisma.review.create({
      data: { ...validatedData, productId: localProductId },
    });

    // Recalculate product average rating
    const productReviews = await prisma.review.findMany({
      where: { productId: localProductId },
      select: { rating: true },
    });
    const totalRating = productReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
    const newReviewCount = productReviews.length;
    const newAvgRating = newReviewCount > 0 ? totalRating / newReviewCount : 0;

    await prisma.product.update({
      where: { id: localProductId },
      data: { avgRating: newAvgRating, reviewCount: newReviewCount },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating review:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

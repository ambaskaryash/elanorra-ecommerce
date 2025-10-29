import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';

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
      sortOrder = 'desc'; // Default to 'desc' if invalid
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (productId) {
      where.productId = productId;
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (rating) {
      where.rating = parseInt(rating);
    }

    // Build orderBy clause
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[sortBy] = sortOrder;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                take: 1,
                orderBy: { position: 'asc' }
              }
            }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    // Format reviews
    const formattedReviews = reviews.map(review => ({
      ...review,
      userName: review.user 
        ? `${review.user.firstName} ${review.user.lastName}`
        : review.userName,
    }));

    return NextResponse.json({
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a new review
const createReviewSchema = z.object({
  productId: z.string(),
  userId: z.string().optional(),
  userName: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1),
  comment: z.string().min(1),
  verified: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Ensure review is tied to the authenticated user
    validatedData.userId = session.user.id;
    validatedData.userName = validatedData.userName || `${session.user.firstName ?? ''} ${session.user.lastName ?? ''}`.trim();

    // Check if user already reviewed this product
    if (validatedData.userId) {
      const existingReview = await prisma.review.findFirst({
        where: {
          productId: validatedData.productId,
          userId: validatedData.userId,
        },
      });

      if (existingReview) {
        return NextResponse.json(
          { error: 'You have already reviewed this product' },
          { status: 400 }
        );
      }
    }

    // Create review
    const review = await prisma.review.create({
      data: validatedData,
    });

    // Recalculate and update product's average rating and review count
    const productReviews = await prisma.review.findMany({
      where: { productId: validatedData.productId },
      select: { rating: true },
    });

    const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
    const newReviewCount = productReviews.length;
    const newAvgRating = newReviewCount > 0 ? totalRating / newReviewCount : 0;

    await prisma.product.update({
      where: { id: validatedData.productId },
      data: {
        avgRating: newAvgRating,
        reviewCount: newReviewCount,
      },
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
    return NextResponse.json(
      { error: errorMessage || 'Failed to create review' },
      { status: 500 }
    );
  }
}

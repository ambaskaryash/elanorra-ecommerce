import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { Product, Review } from '@prisma/client';

type ProductWithReviews = Product & {
  reviews: Review[];
  _count: { reviews: number };
};

// GET /api/products - Get all products with optional filters
export async function GET(request: NextRequest) {
  try {
    // Check if DATABASE_URL is available (for build-time compatibility)
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        products: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          pages: 0,
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const idsParam = searchParams.get('ids');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (idsParam) {
      const ids = idsParam.split(',').map((id) => id.trim()).filter(Boolean);
      if (ids.length > 0) {
        where.id = { in: ids };
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    // Build orderBy clause
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[sortBy] = sortOrder;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: {
            orderBy: { position: 'asc' }
          },
          variants: true,
          reviews: {
            select: {
              rating: true
            }
          },
          _count: {
            select: {
              reviews: true
            }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate average ratings
    const productsWithRatings = products.map((product: ProductWithReviews) => {
      const ratings = product.reviews.map((r: Review) => r.rating);
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
        : 0;
      
      return {
        ...product,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: product._count.reviews,
        reviews: undefined, // Remove reviews from response
        _count: undefined, // Remove _count from response
      };
    });

    return NextResponse.json({
      products: productsWithRatings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product (Admin only)
const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
  inStock: z.boolean().optional(),
  inventory: z.number().int().min(0).optional(),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional(),
  images: z.array(z.object({
    src: z.string().url(),
    alt: z.string(),
    position: z.number().int().min(0).optional(),
  })).optional(),
  variants: z.array(z.object({
    name: z.string(),
    value: z.string(),
    priceAdjustment: z.number().optional(),
    inStock: z.boolean().optional(),
    inventory: z.number().int().min(0).optional(),
  })).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check if DATABASE_URL is available (for build-time compatibility)
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database and check admin privileges
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, isAdmin: true }
    });

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        price: validatedData.price,
        compareAtPrice: validatedData.compareAtPrice,
        category: validatedData.category,
        tags: validatedData.tags || [],
        inStock: validatedData.inStock ?? true,
        inventory: validatedData.inventory ?? 0,
        weight: validatedData.weight,
        dimensions: validatedData.dimensions,
        images: validatedData.images ? {
          create: validatedData.images.map((image, index) => ({
            src: image.src,
            alt: image.alt,
            position: image.position ?? index,
          }))
        } : undefined,
        variants: validatedData.variants ? {
          create: validatedData.variants.map(variant => ({
            name: variant.name,
            value: variant.value,
            priceAdjustment: variant.priceAdjustment || 0,
            inStock: variant.inStock ?? true,
            inventory: variant.inventory ?? 0,
          }))
        } : undefined,
      },
      include: {
        images: true,
        variants: true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
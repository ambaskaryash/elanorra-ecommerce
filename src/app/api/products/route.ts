import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// GET /api/products - Get all products with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // Check if DATABASE_URL is available (for build-time compatibility)
    if (!process.env.DATABASE_URL) {
      logger.warn('⚠️ DATABASE_URL not available, returning empty response for build');
      return NextResponse.json({ 
        products: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          pages: 0
        }
      });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      inStock: true, // Only show in-stock products by default
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        (where.price as any).gte = minPrice;
      }
      if (maxPrice !== undefined) {
        (where.price as any).lte = maxPrice;
      }
    }

    // Rating filter
    if (minRating !== undefined) {
      where.avgRating = {
        gte: minRating,
      };
    }

    // Get products and total count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          images: {
            orderBy: {
              position: 'asc',
            },
            take: 1, // Only need the main image for listing
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Format products
    const formattedProducts = products.map((product: any) => ({
      ...product,
      reviewCount: product._count.reviews,
      _count: undefined,
    }));

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
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
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type RouteParamsPromise = Promise<{ slug: string }>;

// GET /api/products/[slug] - Get a single product by slug
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParamsPromise }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: {
          orderBy: { position: 'asc' }
        },
        variants: true,
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            reviews: true
          }
        }
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Calculate average rating
    const ratings = product.reviews.map(r => r.rating);
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;

    // Format product with additional data
    const productWithRating = {
      ...product,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: product._count.reviews,
      _count: undefined, // Remove _count from response
    };

    return NextResponse.json({ product: productWithRating });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[slug] - Update a product (Admin only)
const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  compareAtPrice: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  inStock: z.boolean().optional(),
  inventory: z.number().int().min(0).optional(),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParamsPromise }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Update product
    const product = await prisma.product.update({
      where: { slug },
      data: validatedData,
      include: {
        images: true,
        variants: true,
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[slug] - Delete a product (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParamsPromise }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete product (cascading deletes will handle related records)
    await prisma.product.delete({
      where: { slug },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
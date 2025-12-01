import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Product, Review } from '@prisma/client';

type RouteParamsPromise = Promise<{ slug: string }>;

type ProductWithReviews = Product & {
  reviews: Review[];
  _count: { reviews: number };
};

// GET /api/collections/[slug] - Get a single collection and its products
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParamsPromise }
) {
  try {
    // Check if DATABASE_URL is available (for build-time compatibility)
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const { slug } = await params;

    const collection = await prisma.collection.findUnique({
      where: { slug },
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const products = await prisma.product.findMany({
      where: {
        collections: {
          some: {
            collection: { slug },
          },
        },
      },
      include: {
        images: {
          orderBy: { position: 'asc' },
        },
        variants: true,
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const productsWithRatings = products.map((product: ProductWithReviews) => {
      const ratings = product.reviews.map((r: Review) => r.rating);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length
        : 0;

      return {
        ...product,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: product._count.reviews,
        reviews: undefined,
        _count: undefined,
      };
    });

    return NextResponse.json({
      collection,
      products: productsWithRatings,
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}
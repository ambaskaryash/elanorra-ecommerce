import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Product, Review } from '@prisma/client';
import { isMedusaCatalogEnabled } from '@/lib/medusa/config';
import { listMedusaProducts } from '@/lib/medusa/catalog';
import { logger } from '@/lib/logger';

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
    const { slug } = await params;

    if (isMedusaCatalogEnabled()) {
      try {
        const result = await listMedusaProducts({
          handle: slug,
        });

        // For Medusa, we might need to fetch the collection separately if listMedusaProducts 
        // doesn't return the collection metadata. 
        // For now, we'll assume the products are returned and we can mock the collection.
        return NextResponse.json({
          collection: { name: slug, slug },
          products: result.products,
          source: 'medusa',
        });
      } catch (error) {
        logger.error('Medusa collection error:', { slug, error });
        return NextResponse.json(
          { error: 'Failed to fetch collection from Medusa' },
          { status: 500 }
        );
      }
    }

    // Check if DATABASE_URL is available (for build-time compatibility)

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
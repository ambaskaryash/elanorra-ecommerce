import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { isMedusaCatalogEnabled } from '@/lib/medusa/config';

// GET /api/wishlist - Get current user's wishlist products
export async function GET(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ products: [] });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const items = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      select: { productId: true },
      orderBy: { createdAt: 'desc' },
    });

    if (items.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const productIds = items.map((it: { productId: string }) => it.productId);

    // Medusa Integration: Fetch live product data
    if (isMedusaCatalogEnabled()) {
      try {
        const { getMedusaProductsByIds } = await import('@/lib/medusa/catalog');
        const medusaProducts = await getMedusaProductsByIds(productIds);
        
        if (medusaProducts.length > 0) {
          // Sort products to match the wishlist's "createdAt" order
          const sortedProducts = productIds
            .map((id: string) => medusaProducts.find(p => p.id === id))
            .filter(Boolean);
            
          return NextResponse.json({ products: sortedProducts });
        }
      } catch (error) {
        console.warn('Failed to fetch live Medusa products for wishlist', { error });
      }
    }

    // Fallback: Fetch from local database if Medusa fails or is disabled
    const localItems = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            images: { orderBy: { position: 'asc' } },
            variants: true,
            reviews: { select: { rating: true } },
            _count: { select: { reviews: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const products = localItems.map((it) => {
      const product = it.product as any;
      const ratings = product.reviews.map((r: any) => r.rating);
      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((s: number, r: number) => s + r, 0) / ratings.length) * 10) / 10
        : 0;
      return {
        ...product,
        avgRating,
        reviewCount: product._count.reviews,
        reviews: undefined,
        _count: undefined,
      };
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

// POST /api/wishlist - Add a product to wishlist
export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const productId = body?.productId as string | undefined;
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: { userId: user.id, productId },
      update: {},
    });

    return NextResponse.json({ message: 'Added to wishlist' });
  } catch (error) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 });
  }
}

// DELETE /api/wishlist - Remove a product from wishlist
export async function DELETE(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const productId = body?.productId as string | undefined;
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    await prisma.wishlistItem.delete({
      where: { userId_productId: { userId: user.id, productId } },
    });

    return NextResponse.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Wishlist DELETE error:', error);
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 });
  }
}
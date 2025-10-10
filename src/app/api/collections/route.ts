import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/collections - Get all collections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    
    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (featured === 'true') {
      // For now, we'll consider all collections as featured
      // In a real scenario, you might add a 'featured' field to the Collection model
    }

    const collections = await prisma.collection.findMany({
      where,
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: {
                  orderBy: { position: 'asc' },
                  take: 1,
                },
              },
            },
          },
          take: 4, // Limit to 4 products per collection for preview
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the expected format
    const transformedCollections = collections.map(collection => ({
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      image: collection.image,
      featured: true, // For now, all are featured
      productCount: collection._count.products,
      sampleProducts: collection.products.map(p => ({
        id: p.product.id,
        name: p.product.name,
        slug: p.product.slug,
        price: p.product.price,
        image: p.product.images[0]?.src || null,
      })),
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    }));

    return NextResponse.json({
      collections: transformedCollections,
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}
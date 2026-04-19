import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin-security';
import { isMedusaCatalogEnabled } from '@/lib/medusa/config';
import { listMedusaProducts } from '@/lib/medusa/catalog';

/**
 * POST /api/admin/sync/products
 * Triggers a sync of Medusa products into the local Prisma Product table.
 * Useful for seeding the local DB with Medusa product IDs so the review
 * system can match reviews to Medusa products.
 */
export async function POST(request: NextRequest) {
  const admin = await verifyAdminAccess();
  if (!admin.success) {
    return NextResponse.json(
      { error: admin.error || 'Unauthorized' },
      { status: admin.error === 'Authentication required' ? 401 : 403 }
    );
  }

  if (!isMedusaCatalogEnabled()) {
    return NextResponse.json(
      { error: 'Medusa catalog is not enabled' },
      { status: 400 }
    );
  }

  try {
    const { prisma } = await import('@/lib/prisma');

    // Fetch all Medusa products (up to 500 at a time)
    const { products } = await listMedusaProducts({ limit: 500, offset: 0 });

    let synced = 0;
    let skipped = 0;

    for (const product of products) {
      if (!product.slug) { skipped++; continue; }

      // Upsert by slug — create a stub record that lets reviews link by ID
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {
          name: product.name,
          description: product.description || '',
          price: product.price ?? 0,
        },
        create: {
          slug: product.slug,
          name: product.name,
          description: product.description || '',
          price: product.price ?? 0,
          category: product.category || 'general',
          inStock: product.inStock ?? true,
          inventory: product.inventory ?? 0,
        },
      });
      synced++;
    }

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      message: `Synced ${synced} products from Medusa (${skipped} skipped)`,
    });
  } catch (error) {
    console.error('Product sync error:', error);
    return NextResponse.json(
      { error: 'Product sync failed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to trigger a Medusa → Prisma product sync',
    endpoint: 'POST /api/admin/sync/products',
  });
}

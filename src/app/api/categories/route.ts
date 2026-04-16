import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isMedusaCatalogEnabled } from '@/lib/medusa/config';
import { listMedusaCategories } from '@/lib/medusa/catalog';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    if (isMedusaCatalogEnabled()) {
      try {
        const categories = await listMedusaCategories();
        return NextResponse.json({
          categories,
          source: 'medusa',
        });
      } catch (error) {
        logger.error('Medusa categories error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch categories from Medusa' },
          { status: 500 }
        );
      }
    }

    // Local fallback
    const products = await prisma.product.findMany({
      select: { category: true },
    });

    const categoryMap = new Map<string, number>();
    products.forEach((product: { category: string }) => {
      categoryMap.set(product.category, (categoryMap.get(product.category) || 0) + 1);
    });

    const categories = Array.from(categoryMap, ([name, count]) => ({
      id: name,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
    }));

    return NextResponse.json({
      categories,
      source: 'local',
    });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { syncProductsFromOdoo } from '@/lib/odoo/sync';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // In a real app, add admin authentication check here
    // const session = await getSession();
    // if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await syncProductsFromOdoo();
    
    return NextResponse.json({ 
      message: 'Sync completed', 
      details: result 
    });
  } catch (error) {
    logger.error('Sync API Error', error);
    return NextResponse.json(
      { error: 'Failed to sync products from Odoo' },
      { status: 500 }
    );
  }
}

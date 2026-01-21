import { NextRequest, NextResponse } from 'next/server';
import { syncProductsFromOdoo } from '@/lib/odoo/sync';
import { logger } from '@/lib/logger';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Admin authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if current user is admin
    const currentUserRecord = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { isAdmin: true }
    });

    if (!currentUserRecord?.isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

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

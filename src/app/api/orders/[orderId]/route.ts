import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { isMedusaCatalogEnabled } from '@/lib/medusa/config';
import * as medusaOrder from '@/lib/medusa/order';
import { mapMedusaOrderToOrder } from '@/lib/medusa/mappers';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { userId: clerkUserId } = await auth();

    // Medusa Integration: Fetch single order
    if (isMedusaCatalogEnabled() && orderId.startsWith('order_')) {
      try {
        const medusaOrderData = await medusaOrder.getOrder(orderId);
        const order = mapMedusaOrderToOrder(medusaOrderData);
        return NextResponse.json({
          ...order,
          source: 'medusa',
        });
      } catch (error) {
        logger.error('Failed to fetch Medusa order', { orderId, error });
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
    }

    // Fetch local order with all necessary details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: {
                    take: 1,
                    orderBy: { position: 'asc' }
                }
              }
            }
          }
        },
        shippingAddress: true,
        billingAddress: true,
        user: {
            select: {
                clerkId: true
            }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Security Check
    if (clerkUserId) {
        if (order.user?.clerkId && order.user.clerkId !== clerkUserId) {
             return NextResponse.json(
                { error: 'Unauthorized access to this order' },
                { status: 403 }
              );
        }
    } else {
        if (order.userId) {
             return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
              );
        }
    }

    return NextResponse.json(order);
  } catch (error) {
    logger.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}


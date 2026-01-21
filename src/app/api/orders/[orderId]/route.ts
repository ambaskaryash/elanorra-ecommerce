import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { userId: clerkUserId } = await auth();

    // Fetch order with all necessary details
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

    // Security Check:
    // 1. If user is logged in, they must own the order (match clerkId)
    // 2. If user is not logged in, they cannot access orders belonging to registered users
    
    if (clerkUserId) {
        // If order has a user associated, verify it matches
        if (order.user?.clerkId && order.user.clerkId !== clerkUserId) {
             return NextResponse.json(
                { error: 'Unauthorized access to this order' },
                { status: 403 }
              );
        }
    } else {
        // Guest accessing an order
        // If the order belongs to a user, deny access (require login)
        if (order.userId) {
             return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
              );
        }
        // If order has no user (guest order), allow access via ID (implicit "magic link" via URL)
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

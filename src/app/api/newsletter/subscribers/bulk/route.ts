import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bulkActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'delete']),
  subscriberIds: z.array(z.string()).min(1, 'At least one subscriber ID is required'),
});

// POST endpoint for bulk operations on subscribers
export async function POST(request: NextRequest) {
  try {
    // Temporarily bypass authentication for development
    // TODO: Implement proper admin authentication in production
    const { userId } = await auth();
    
    // Allow access even without session for development
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user && !user.admin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const validatedData = bulkActionSchema.parse(body);
    const { action, subscriberIds } = validatedData;

    // Verify all subscriber IDs exist
    const existingSubscribers = await prisma.newsletterSubscriber.findMany({
      where: { id: { in: subscriberIds } },
      select: { id: true },
    });

    const existingIds = existingSubscribers.map((sub: { id: string }) => sub.id);
    const missingIds = subscriberIds.filter(id => !existingIds.includes(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some subscriber IDs not found',
          missingIds,
        },
        { status: 404 }
      );
    }

    let result;
    let successCount = 0;

    switch (action) {
      case 'activate':
        result = await prisma.newsletterSubscriber.updateMany({
          where: { id: { in: subscriberIds } },
          data: {
            isActive: true,
            subscribedAt: new Date(),
            unsubscribedAt: null,
            updatedAt: new Date(),
          },
        });
        successCount = result.count;
        break;

      case 'deactivate':
        result = await prisma.newsletterSubscriber.updateMany({
          where: { id: { in: subscriberIds } },
          data: {
            isActive: false,
            unsubscribedAt: new Date(),
            updatedAt: new Date(),
          },
        });
        successCount = result.count;
        break;

      case 'delete':
        result = await prisma.newsletterSubscriber.deleteMany({
          where: { id: { in: subscriberIds } },
        });
        successCount = result.count;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Successfully ${action}d ${successCount} subscribers`,
      action,
      successCount,
      requestedCount: subscriberIds.length,
    });

  } catch (error) {
    console.error('Bulk operation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

// GET endpoint to get bulk operation status/history (optional feature)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get summary statistics for bulk operations
    const [totalSubscribers, activeSubscribers, inactiveSubscribers] = await Promise.all([
      prisma.newsletterSubscriber.count(),
      prisma.newsletterSubscriber.count({ where: { isActive: true } }),
      prisma.newsletterSubscriber.count({ where: { isActive: false } }),
    ]);

    return NextResponse.json({
      summary: {
        totalSubscribers,
        activeSubscribers,
        inactiveSubscribers,
      },
      availableActions: ['activate', 'deactivate', 'delete'],
    });

  } catch (error) {
    console.error('Get bulk operations info error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bulk operations info' },
      { status: 500 }
    );
  }
}
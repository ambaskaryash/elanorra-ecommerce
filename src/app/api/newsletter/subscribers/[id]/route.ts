import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSubscriberSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isActive: z.boolean().optional(),
  preferences: z.object({
    categories: z.array(z.string()).optional(),
    frequency: z.string().optional(),
  }).optional(),
});

// GET endpoint to fetch a specific subscriber
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { id: params.id },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      subscriber: {
        ...subscriber,
        createdAt: subscriber.createdAt.toISOString(),
        subscribedAt: subscriber.subscribedAt?.toISOString(),
        unsubscribedAt: subscriber.unsubscribedAt?.toISOString(),
        updatedAt: subscriber.updatedAt.toISOString(),
      },
    });

  } catch (error) {
    console.error('Get subscriber error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriber' },
      { status: 500 }
    );
  }
}

// PUT endpoint to update a specific subscriber
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validatedData = updateSubscriberSchema.parse(body);

    // Check if subscriber exists
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { id: params.id },
    });

    if (!existingSubscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      );
    }

    // If email is being updated, check for conflicts
    if (validatedData.email && validatedData.email !== existingSubscriber.email) {
      const emailConflict = await prisma.newsletterSubscriber.findUnique({
        where: { email: validatedData.email },
      });

      if (emailConflict) {
        return NextResponse.json(
          { error: 'Email is already in use by another subscriber' },
          { status: 409 }
        );
      }
    }

    // Update subscriber
    const updatedSubscriber = await prisma.newsletterSubscriber.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Subscriber updated successfully',
      subscriber: {
        ...updatedSubscriber,
        createdAt: updatedSubscriber.createdAt.toISOString(),
        subscribedAt: updatedSubscriber.subscribedAt?.toISOString(),
        unsubscribedAt: updatedSubscriber.unsubscribedAt?.toISOString(),
        updatedAt: updatedSubscriber.updatedAt.toISOString(),
      },
    });

  } catch (error) {
    console.error('Update subscriber error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update subscriber' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a specific subscriber
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if subscriber exists
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { id: params.id },
    });

    if (!existingSubscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      );
    }

    // Delete subscriber
    await prisma.newsletterSubscriber.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Subscriber deleted successfully',
    });

  } catch (error) {
    console.error('Delete subscriber error:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscriber' },
      { status: 500 }
    );
  }
}
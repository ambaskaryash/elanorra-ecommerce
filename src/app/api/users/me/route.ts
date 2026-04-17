import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { syncUserFromClerk } from '@/lib/rbac';
import { z } from 'zod';
import { isMedusaCatalogEnabled } from '@/lib/medusa/config';
import * as medusaCustomer from '@/lib/medusa/customer';
import { logger } from '@/lib/logger';

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  image: z.string().url().optional(),
  email: z.string().email().optional(),
});

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        image: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    if (!user) {
      // If user doesn't exist in our database, sync them properly with role assignment
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const syncResult = await syncUserFromClerk(clerkUser);
      if (!syncResult.success) {
        return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
      }

      const newUser = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          image: true,
          isAdmin: true,
          createdAt: true,
        },
      });

      // Medusa Integration: Sync Customer
      if (isMedusaCatalogEnabled() && newUser?.email) {
        try {
          await medusaCustomer.createCustomer({
            email: newUser.email,
            first_name: newUser.firstName || '',
            last_name: newUser.lastName || '',
            phone: newUser.phone || '',
          });
        } catch (error) {
          logger.warn('Failed to sync user with Medusa Customer', { error, email: newUser.email });
        }
      }

      return NextResponse.json({ user: newUser });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    // Find user by clerkId
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If changing email, ensure uniqueness
    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing && existing.id !== existingUser.id) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
    }

    const updated = await prisma.user.update({
      where: { clerkId: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        image: true,
        isAdmin: true,
      },
    });

    // Medusa Integration: Sync Customer Profile
    if (isMedusaCatalogEnabled() && updated.email) {
      try {
        const customer = await medusaCustomer.getCustomer(updated.email);
        if (customer) {
          await medusaCustomer.updateCustomer(customer.id, {
            first_name: updated.firstName || undefined,
            last_name: updated.lastName || undefined,
            phone: updated.phone || undefined,
          });
        }
      } catch (error) {
        logger.warn('Failed to sync updated profile with Medusa Customer', { error, email: updated.email });
      }
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Profile PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
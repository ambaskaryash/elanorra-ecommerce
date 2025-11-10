import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { createCSRFProtectedHandler } from '@/lib/csrf';

// Ensure this API route is always dynamic and not statically pre-rendered
export const dynamic = 'force-dynamic';
// Ensure Node.js runtime to guarantee access to process.env and Prisma
export const runtime = 'nodejs';

// Schema for address validation
const addressSchema = z.object({
  userId: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  company: z.string().optional(),
  address1: z.string().min(1, 'Address line 1 is required'),
  address2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  country: z.string().min(1, 'Country is required').default('India'),
  phone: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
});

// GET /api/addresses - Get user addresses
async function handleGET(request: NextRequest) {
  try {
    // Check if DATABASE_URL is available (for build-time compatibility)
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL not available, returning empty response for build');
      return NextResponse.json({ addresses: [] });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: userId },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

// POST /api/addresses - Create a new address
async function handlePOST(request: NextRequest) {
  try {
    // Check if DATABASE_URL is available (for build-time compatibility)
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL not available, returning error for build');
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = addressSchema.parse(body);

    // Create address data with authenticated user ID
    const addressData = {
      ...validatedData,
      userId: userId,
    };

    // If setting as default, unset previous defaults for this user
    if (addressData.isDefault) {
      await prisma.address.updateMany({
        where: { userId: addressData.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: addressData,
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    );
  }
}

// PUT /api/addresses - Update an existing address
async function handlePUT(request: NextRequest) {
  try {
    // Check if DATABASE_URL is available (for build-time compatibility)
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL not available, returning error for build');
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = addressSchema.partial().parse(body); // Allow partial updates

    // If setting as default, unset previous defaults for this authenticated user
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id, userId },
      data: validatedData,
    });

    return NextResponse.json({ address });
  } catch (error) {
    console.error('Error updating address:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

// DELETE /api/addresses - Delete an address
async function handleDELETE(request: NextRequest) {
  try {
    // Check if DATABASE_URL is available (for build-time compatibility)
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL not available, returning error for build');
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
    }

    await prisma.address.delete({
      where: { id, userId: userId },
    });

    return NextResponse.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}

// Export CSRF-protected handlers
export const { GET, POST, PUT, DELETE } = createCSRFProtectedHandler({
  GET: handleGET,
  POST: handlePOST,
  PUT: handlePUT,
  DELETE: handleDELETE,
});

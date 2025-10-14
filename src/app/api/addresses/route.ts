import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
  isDefaultShipping: z.boolean().optional().default(false),
  isDefaultBilling: z.boolean().optional().default(false),
});

// GET /api/addresses - Get all addresses for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
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
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = addressSchema.parse(body);

    // Force ownership to authenticated user
    validatedData.userId = session.user.id;

    // If setting as default, unset previous defaults for this user
    if (validatedData.isDefaultShipping && validatedData.userId) {
      await prisma.address.updateMany({
        where: { userId: validatedData.userId, isDefaultShipping: true },
        data: { isDefaultShipping: false },
      });
    }
    if (validatedData.isDefaultBilling && validatedData.userId) {
      await prisma.address.updateMany({
        where: { userId: validatedData.userId, isDefaultBilling: true },
        data: { isDefaultBilling: false },
      });
    }

    const address = await prisma.address.create({
      data: validatedData,
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

// PUT /api/addresses/[id] - Update an existing address
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = addressSchema.partial().parse(body); // Allow partial updates

    // If setting as default, unset previous defaults for this user
    if (validatedData.isDefaultShipping && validatedData.userId) {
      await prisma.address.updateMany({
        where: { userId: validatedData.userId, isDefaultShipping: true, id: { not: id } },
        data: { isDefaultShipping: false },
      });
    }
    if (validatedData.isDefaultBilling && validatedData.userId) {
      await prisma.address.updateMany({
        where: { userId: validatedData.userId, isDefaultBilling: true, id: { not: id } },
        data: { isDefaultBilling: false },
      });
    }

    const address = await prisma.address.update({
      where: { id, userId: session.user.id },
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

// DELETE /api/addresses/[id] - Delete an address
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
    }

    await prisma.address.delete({
      where: { id, userId: session.user.id },
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

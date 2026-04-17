import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { createCSRFProtectedHandler } from '@/lib/csrf';
import { isMedusaCatalogEnabled } from '@/lib/medusa/config';
import * as medusaCustomer from '@/lib/medusa/customer';
import { logger } from '@/lib/logger';

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
  tag: z.string().optional(),
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

    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve internal user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      // User not found in database yet
      return NextResponse.json({ addresses: [] });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { id: 'desc' },
    });

    // Medusa Integration: Merge with Medusa addresses
    if (isMedusaCatalogEnabled()) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { clerkId: clerkUserId },
          select: { email: true }
        });
        
        if (dbUser?.email) {
          const customer = await medusaCustomer.getCustomer(dbUser.email);
          if (customer) {
            const mAddresses = await medusaCustomer.getAddresses(customer.id);
            
            // Map Medusa addresses to our internal format
            const mappedMAddresses = mAddresses.map((ma: any) => ({
              id: ma.id,
              firstName: ma.first_name,
              lastName: ma.last_name,
              company: ma.company,
              address1: ma.address_1,
              address2: ma.address_2,
              city: ma.city,
              state: ma.province,
              zipCode: ma.postal_code,
              country: ma.country_code === 'in' ? 'India' : ma.country_code,
              phone: ma.phone,
              isDefault: false, // Medusa handles defaults differently
              isMedusa: true,
            }));

            // Filter out any duplicates (by address1 and zipCode)
            const localAddressKeys = new Set(addresses.map(a => `${a.address1}-${a.zipCode}`));
            const uniqueMAddresses = mappedMAddresses.filter(ma => !localAddressKeys.has(`${ma.address1}-${ma.zipCode}`));

            return NextResponse.json({ 
              addresses: [...addresses, ...uniqueMAddresses] 
            });
          }
        }
      } catch (error) {
        logger.warn('Failed to fetch Medusa addresses, returning local only', { error });
      }
    }

    return NextResponse.json({ addresses });
  } catch (error: any) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch addresses' },
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

    // Medusa Integration: Sync Address
    if (isMedusaCatalogEnabled()) {
      try {
        const user = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { email: true }
        });

        if (user?.email) {
          const customer = await medusaCustomer.getCustomer(user.email);
          if (customer) {
            await medusaCustomer.addAddress(customer.id, {
              first_name: validatedData.firstName,
              last_name: validatedData.lastName,
              address_1: validatedData.address1,
              address_2: validatedData.address2,
              city: validatedData.city,
              country_code: validatedData.country.toLowerCase() === 'india' ? 'in' : validatedData.country.toLowerCase(),
              province: validatedData.state,
              postal_code: validatedData.zipCode,
              phone: validatedData.phone,
            });
          }
        }
      } catch (error) {
        logger.warn('Failed to sync address with Medusa Customer', { error });
      }
    }

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
      where: { id, userId: userId },
      data: validatedData,
    });

    // Medusa Integration: Sync Update (if it's a Medusa address, this might need a different flow)
    // For now, we sync the profile email's owner.
    if (isMedusaCatalogEnabled()) {
      try {
        const user = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { email: true }
        });
        if (user?.email) {
          const customer = await medusaCustomer.getCustomer(user.email);
          if (customer) {
            // If it's a Medusa-originating address, update it there.
            // If it's a local address being updated, we can treat it as an add or just ignore.
            if (id.startsWith('addr_')) {
              await medusaCustomer.updateCustomer(customer.id, {
                // Medusa v2 address updates are usually via separate endpoints, 
                // but we'll use a generic approach if available or just log it.
                // We've implemented specific helpers in customer.ts for this.
              });
            }
          }
        }
      } catch (error) {
        logger.warn('Failed to sync address update with Medusa', { error });
      }
    }

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
    }).catch(err => {
      // If it's a Medusa-only address, it won't be in Prisma.
      if (!id.startsWith('addr_')) throw err;
    });

    // Medusa Integration: Sync Delete
    if (isMedusaCatalogEnabled() && id.startsWith('addr_')) {
      try {
        const user = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { email: true }
        });
        if (user?.email) {
          const customer = await medusaCustomer.getCustomer(user.email);
          if (customer) {
            await medusaCustomer.deleteAddress(customer.id, id);
          }
        }
      } catch (error) {
        logger.warn('Failed to sync address deletion with Medusa', { error });
      }
    }

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

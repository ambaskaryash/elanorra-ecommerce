import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// Create a new coupon (Admin only)
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Add admin role check for Clerk users

  try {
    const body = await req.json();
    const {
      code,
      type,
      value,
      minAmount,
      maxDiscount,
      usageLimit,
      validFrom,
      validTo,
    } = body;

    const newCoupon = await prisma.coupon.create({
      data: {
        code,
        type,
        value,
        minAmount,
        maxDiscount,
        usageLimit,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
      },
    });

    return NextResponse.json(newCoupon, { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

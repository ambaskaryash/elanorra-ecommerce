import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Create a new coupon (Admin only)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

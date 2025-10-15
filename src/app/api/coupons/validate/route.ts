import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
    }

    const now = new Date();
    if (!coupon.isActive || now < coupon.validFrom || now > coupon.validTo) {
      return NextResponse.json({ error: 'Coupon is not active or has expired' }, { status: 400 });
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ error: 'Coupon has reached its usage limit' }, { status: 400 });
    }

    return NextResponse.json(coupon);
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

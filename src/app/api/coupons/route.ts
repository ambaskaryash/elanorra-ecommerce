import { NextResponse } from 'next/server';
import { verifyAdminAccess, logAdminAction } from '@/lib/admin-security';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// List coupons (Admin only)
export async function GET(req: Request) {
  const admin = await verifyAdminAccess();
  if (!admin.success) {
    return NextResponse.json(
      { error: admin.error || 'Unauthorized' },
      { status: admin.error === 'Authentication required' ? 401 : 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '20');
    const activeParam = searchParams.get('active');
    const codeQuery = searchParams.get('code');

    const where: any = {};
    if (activeParam === 'true') where.isActive = true;
    if (activeParam === 'false') where.isActive = false;
    if (codeQuery) where.code = { contains: codeQuery, mode: 'insensitive' };

    const [total, coupons] = await Promise.all([
      prisma.coupon.count({ where }),
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const result = {
      coupons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    await logAdminAction({
      adminId: admin.user!.id,
      adminEmail: admin.user!.email,
      action: 'LIST_COUPONS',
      resource: 'coupon',
      details: { page, limit, activeParam, codeQuery, total },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing coupons:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// Create a new coupon (Admin only)
export async function POST(req: Request) {
  const admin = await verifyAdminAccess();
  if (!admin.success) {
    return NextResponse.json(
      { error: admin.error || 'Unauthorized' },
      { status: admin.error === 'Authentication required' ? 401 : 403 }
    );
  }

  try {
    const body = await req.json();
    const createSchema = z.object({
      code: z.string().min(2),
      type: z.enum(['percentage', 'fixed', 'free_shipping']),
      value: z.number().nonnegative().optional(),
      minAmount: z.number().nonnegative().optional(),
      maxDiscount: z.number().nonnegative().optional(),
      usageLimit: z.number().int().positive().optional(),
      validFrom: z.union([z.string(), z.date()]),
      validTo: z.union([z.string(), z.date()]),
      isActive: z.boolean().optional(),
    }).refine((data) => {
      if (data.type === 'free_shipping') return true;
      return typeof data.value === 'number';
    }, { message: 'value is required for percentage and fixed types', path: ['value'] });

    const parsed = createSchema.parse(body);

    const newCoupon = await prisma.coupon.create({
      data: {
        code: parsed.code,
        type: parsed.type,
        value: parsed.type === 'free_shipping' ? 0 : (parsed.value as number),
        minAmount: parsed.minAmount,
        maxDiscount: parsed.maxDiscount,
        usageLimit: parsed.usageLimit,
        isActive: parsed.isActive ?? true,
        validFrom: new Date(parsed.validFrom),
        validTo: new Date(parsed.validTo),
      },
    });

    await logAdminAction({
      adminId: admin.user!.id,
      adminEmail: admin.user!.email,
      action: 'CREATE_COUPON',
      resource: 'coupon',
      resourceId: newCoupon.id,
      details: { code: newCoupon.code, type: newCoupon.type },
    });

    return NextResponse.json(newCoupon, { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { verifyAdminAccess, logAdminAction } from '@/lib/admin-security';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Get coupon by id (Admin only)
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await verifyAdminAccess();
  if (!admin.success) {
    return NextResponse.json(
      { error: admin.error || 'Unauthorized' },
      { status: admin.error === 'Authentication required' ? 401 : 403 }
    );
  }

  try {
    const coupon = await prisma.coupon.findUnique({ where: { id: params.id } });
    if (!coupon) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await logAdminAction({
      adminId: admin.user!.id,
      adminEmail: admin.user!.email,
      action: 'READ_COUPON',
      resource: 'coupon',
      resourceId: params.id,
    });
    return NextResponse.json({ coupon });
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// Update coupon (Admin only)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await verifyAdminAccess();
  if (!admin.success) {
    return NextResponse.json(
      { error: admin.error || 'Unauthorized' },
      { status: admin.error === 'Authentication required' ? 401 : 403 }
    );
  }

  try {
    const body = await req.json();
    const updateSchema = z.object({
      code: z.string().min(2).optional(),
      type: z.enum(['percentage', 'fixed', 'free_shipping']).optional(),
      value: z.number().nonnegative().optional(),
      minAmount: z.number().nonnegative().optional(),
      maxDiscount: z.number().nonnegative().optional(),
      usageLimit: z.number().int().positive().optional(),
      isActive: z.boolean().optional(),
      validFrom: z.union([z.string(), z.date()]).optional(),
      validTo: z.union([z.string(), z.date()]).optional(),
    }).refine((data) => {
      if (data.type && data.type !== 'free_shipping') {
        return typeof data.value === 'number' || data.value === undefined;
      }
      return true;
    }, { message: 'value is required for percentage and fixed types', path: ['value'] });

    const parsed = updateSchema.parse(body);

    const updated = await prisma.coupon.update({
      where: { id: params.id },
      data: {
        ...(parsed.code ? { code: parsed.code } : {}),
        ...(parsed.type ? { type: parsed.type } : {}),
        ...(parsed.type === 'free_shipping'
          ? { value: 0 }
          : parsed.value !== undefined
          ? { value: parsed.value }
          : {}),
        minAmount: parsed.minAmount,
        maxDiscount: parsed.maxDiscount,
        usageLimit: parsed.usageLimit,
        isActive: parsed.isActive,
        ...(parsed.validFrom ? { validFrom: new Date(parsed.validFrom) } : {}),
        ...(parsed.validTo ? { validTo: new Date(parsed.validTo) } : {}),
      },
    });

    await logAdminAction({
      adminId: admin.user!.id,
      adminEmail: admin.user!.email,
      action: 'UPDATE_COUPON',
      resource: 'coupon',
      resourceId: params.id,
      details: { code: updated.code, type: updated.type, isActive: updated.isActive },
    });

    return NextResponse.json({ coupon: updated });
  } catch (error) {
    console.error('Error updating coupon:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// Deactivate/Delete coupon (Admin only)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await verifyAdminAccess();
  if (!admin.success) {
    return NextResponse.json(
      { error: admin.error || 'Unauthorized' },
      { status: admin.error === 'Authentication required' ? 401 : 403 }
    );
  }

  try {
    // Soft delete: set isActive=false
    const updated = await prisma.coupon.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await logAdminAction({
      adminId: admin.user!.id,
      adminEmail: admin.user!.email,
      action: 'DEACTIVATE_COUPON',
      resource: 'coupon',
      resourceId: params.id,
      details: { code: updated.code },
    });
    return NextResponse.json({ coupon: updated });
  } catch (error) {
    console.error('Error deactivating coupon:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getShippingProvider } from '@/lib/services/shipping';
import type { Carrier, OrderItemPayload } from '@/lib/services/shipping/types';

const labelSchema = z.object({
  provider: z.enum(['shiprocket', 'delhivery', 'bluedart']),
  orderId: z.string().optional(),
  orderNumber: z.string().optional(),
  // Optional override payload when DB is unavailable
  shippingAddress: z
    .object({
      firstName: z.string(),
      lastName: z.string(),
      address1: z.string(),
      address2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      country: z.string(),
      phone: z.string().optional(),
    })
    .optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        sku: z.string().optional(),
        quantity: z.number().min(1),
        price: z.number().nonnegative(),
      })
    )
    .optional(),
  weightKg: z.number().positive().optional(),
  dimensionsCm: z
    .object({ length: z.number().positive(), width: z.number().positive(), height: z.number().positive() })
    .optional(),
  collectAmount: z.number().nonnegative().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = labelSchema.parse(body);
    const provider = getShippingProvider(validated.provider as Carrier);

    let shippingAddress = validated.shippingAddress;
    let items = validated.items as OrderItemPayload[] | undefined;
    let resolvedOrderId = validated.orderId || '';

    if (!shippingAddress || !items) {
      if (!process.env.DATABASE_URL) {
        return NextResponse.json(
          { error: 'DATABASE_URL not configured; provide shippingAddress and items in request.' },
          { status: 400 }
        );
      }

      // Resolve order by ID or orderNumber from DB
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            validated.orderId ? { id: validated.orderId } : undefined,
            validated.orderNumber ? { orderNumber: validated.orderNumber } : undefined,
          ].filter(Boolean) as any,
        },
        include: {
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
          shippingAddress: true,
        },
      });

      if (!order || !order.shippingAddress) {
        return NextResponse.json({ error: 'Order not found or missing shipping address' }, { status: 404 });
      }

      resolvedOrderId = order.id;
      shippingAddress = {
        firstName: order.shippingAddress.firstName,
        lastName: order.shippingAddress.lastName,
        address1: order.shippingAddress.address1,
        address2: order.shippingAddress.address2 || undefined,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        zipCode: order.shippingAddress.zipCode,
        country: order.shippingAddress.country,
        phone: order.shippingAddress.phone || undefined,
      };

      items = order.items.map((it: any) => ({
        name: it.product?.name || 'Item',
        sku: undefined,
        quantity: it.quantity,
        price: it.price,
      }));
    }

    const label = await provider.generateLabel({
      orderId: resolvedOrderId || validated.orderId || validated.orderNumber || 'unknown',
      orderNumber: validated.orderNumber,
      items: items!,
      shippingAddress: shippingAddress!,
      weightKg: validated.weightKg,
      dimensionsCm: validated.dimensionsCm,
      collectAmount: validated.collectAmount,
    });

    // Persist shipping details on the Order if we have a resolved order id and a database
    try {
      if (process.env.DATABASE_URL && resolvedOrderId) {
        await prisma.order.update({
          where: { id: resolvedOrderId },
          data: {
            shippingCarrier: label.carrier,
            awb: label.awb || label.trackingNumber,
            labelUrl: label.labelUrl,
          },
        });
      }
    } catch (e) {
      console.error('Failed to persist shipping details to Order:', e);
      // Non-fatal: we still return the label result
    }

    return NextResponse.json({ label });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Shipping label error:', error);
    return NextResponse.json({ error: 'Failed to generate label' }, { status: 500 });
  }
}
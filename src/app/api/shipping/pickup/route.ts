import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getShippingProvider } from '@/lib/services/shipping';
import type { Carrier } from '@/lib/services/shipping/types';

const pickupSchema = z.object({
  provider: z.enum(['shiprocket', 'delhivery', 'bluedart']),
  shipmentId: z.string().optional(),
  awb: z.string().optional(),
  pickupDate: z.string().optional(), // YYYY-MM-DD
  address: z
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
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = pickupSchema.parse(body);
    const provider = getShippingProvider(validated.provider as Carrier);

    const pickup = await provider.schedulePickup({
      shipmentId: validated.shipmentId,
      awb: validated.awb,
      pickupDate: validated.pickupDate,
      address: validated.address,
    });

    return NextResponse.json({ pickup });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Shipping pickup error:', error);
    return NextResponse.json({ error: 'Failed to schedule pickup' }, { status: 500 });
  }
}
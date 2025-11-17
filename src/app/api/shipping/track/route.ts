import { NextRequest, NextResponse } from 'next/server';
import { getShippingProvider } from '@/lib/services/shipping';
import type { Carrier } from '@/lib/services/shipping/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = (searchParams.get('provider') || 'shiprocket') as Carrier;
    const trackingNumber = searchParams.get('trackingNumber');

    if (!trackingNumber) {
      return NextResponse.json({ error: 'trackingNumber is required' }, { status: 400 });
    }

    const carrier = getShippingProvider(provider);
    const trackingUrl = carrier.getTrackingUrl(trackingNumber);
    const details = await carrier.track(trackingNumber);

    return NextResponse.json({ trackingUrl, details });
  } catch (error) {
    console.error('Shipping track error:', error);
    return NextResponse.json({ error: 'Failed to get tracking info' }, { status: 500 });
  }
}
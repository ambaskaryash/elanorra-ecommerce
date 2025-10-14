import { NextResponse } from 'next/server';

// Simple region-based shipping quote mock
// Metro pincodes (example prefixes): 400xxx (Mumbai), 560xxx (Bengaluru), 110xxx (Delhi), 600xxx (Chennai)
const METRO_PREFIXES = ['400', '560', '110', '600'];

function getZone(pincode: string) {
  const prefix = pincode.slice(0, 3);
  if (METRO_PREFIXES.includes(prefix)) return 'metro';
  if (/^[1-9][0-9]{2}$/.test(prefix)) return 'urban';
  return 'remote';
}

function baseAmountForZone(zone: string) {
  switch (zone) {
    case 'metro':
      return 99;
    case 'urban':
      return 149;
    case 'remote':
    default:
      return 249;
  }
}

function deliverySurcharge(deliveryId: string) {
  switch (deliveryId) {
    case 'standard':
      return 0;
    case 'express':
      return 200;
    case 'premium':
      return 900; // white glove
    default:
      return 0;
  }
}

function etaFor(deliveryId: string, zone: string) {
  const base = zone === 'remote' ? 7 : zone === 'urban' ? 5 : 4;
  switch (deliveryId) {
    case 'standard':
      return base;
    case 'express':
      return Math.max(2, base - 2);
    case 'premium':
      return Math.max(2, base - 1);
    default:
      return base;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pincode, deliveryId } = body || {};

    if (!pincode || typeof pincode !== 'string' || !/^[0-9]{6}$/.test(pincode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pincode. Provide a 6-digit code.' },
        { status: 400 }
      );
    }

    const zone = getZone(pincode);
    const base = baseAmountForZone(zone);
    const surcharge = deliverySurcharge(deliveryId || 'standard');
    const amount = base + surcharge;
    const etaDays = etaFor(deliveryId || 'standard', zone);

    return NextResponse.json({ success: true, amount, etaDays, zone });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Quote calculation failed' }, { status: 500 });
  }
}
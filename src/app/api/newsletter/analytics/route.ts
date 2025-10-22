import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Track email opens
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const newsletterId = searchParams.get('newsletter');
    const subscriberId = searchParams.get('subscriber');

    if (!newsletterId || !subscriberId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Update open count for the newsletter
    await prisma.newsletter.update({
      where: { id: newsletterId },
      data: {
        openCount: {
          increment: 1,
        },
      },
    });

    // Return a 1x1 transparent pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error tracking email open:', error);
    
    // Still return the pixel even if tracking fails
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}

// Track email clicks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newsletterId, subscriberId, url } = body;

    if (!newsletterId || !subscriberId || !url) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Update click count for the newsletter
    await prisma.newsletter.update({
      where: { id: newsletterId },
      data: {
        clickCount: {
          increment: 1,
        },
      },
    });

    // Return the redirect URL
    return NextResponse.json({ redirectUrl: url });
  } catch (error) {
    console.error('Error tracking email click:', error);
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { subscribeToNewsletter } from '@/lib/services/mailchimp';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
    }

    await subscribeToNewsletter(email);

    return NextResponse.json({ message: 'Successfully subscribed to newsletter!' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Newsletter subscription API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: errorMessage || 'Failed to subscribe to newsletter.' }, { status: 500 });
  }
}

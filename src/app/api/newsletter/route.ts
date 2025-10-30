import { NextRequest, NextResponse } from 'next/server';
import { subscribeToNewsletter } from '@/lib/services/mailchimp';
import { emailService } from '@/lib/email';
import { rateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit';
import { z } from 'zod';

const newsletterSchema = z.object({
  email: z.string().email(),
});

const limiter = rateLimit(rateLimitConfigs.newsletter);

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await limiter(request);
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult.error!, rateLimitResult.resetTime!);
  }

  try {
    const body = await request.json();
    const { email } = newsletterSchema.parse(body);

    // Subscribe to Mailchimp
    await subscribeToNewsletter(email);

    // Send confirmation email
    await emailService.sendWelcomeEmail({ email });

    return NextResponse.json({ message: 'Successfully subscribed to newsletter!' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Newsletter subscription API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email format', details: error.issues },
        { status: 400 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: errorMessage || 'Failed to subscribe to newsletter.' }, { status: 500 });
  }
}

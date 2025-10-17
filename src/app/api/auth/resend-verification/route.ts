import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit';
import { handleError } from '@/lib/error-handler';
import { sendVerificationEmail } from '@/lib/email';
import { z } from 'zod';
import crypto from 'crypto';

const resendVerificationSchema = z.object({
  email: z.string().email(),
});

const limiter = rateLimit(rateLimitConfigs.auth);

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await limiter(request);
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult.error!, rateLimitResult.resetTime!);
  }

  try {
    const body = await request.json();
    const { email } = resendVerificationSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        emailVerified: true,
      },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: 'If an account with that email exists, we\'ve sent a verification email.',
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        message: 'This email address is already verified.',
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Update user with new verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken, user.firstName || undefined);
      console.log(`Verification email resent to: ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the request if email sending fails
    }

    return NextResponse.json({
      message: 'If an account with that email exists, we\'ve sent a verification email.',
    });

  } catch (error) {
    return handleError(error, {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
    });
  }
}
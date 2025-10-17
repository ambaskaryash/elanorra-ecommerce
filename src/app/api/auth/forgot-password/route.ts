import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit';
import { handleError } from '@/lib/error-handler';
import { z } from 'zod';
import crypto from 'crypto';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const limiter = rateLimit(rateLimitConfigs.passwordReset);

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await limiter(request);
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult.error!, rateLimitResult.resetTime!);
  }

  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, firstName: true },
    });

    // Always return success to prevent email enumeration
    const response = {
      message: 'If an account with that email exists, we have sent a password reset link.',
    };

    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Store reset token in database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      // Log the reset token for development (remove in production)
      console.log('Password reset token for', email, ':', resetToken);
      console.log('Reset URL:', `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`);

      // Send password reset email
      try {
        const { sendPasswordResetEmail } = await import('@/lib/email');
        await sendPasswordResetEmail(user.email, resetToken, user.firstName || undefined);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the request if email sending fails
      }
      
      // In production, you would:
      // 1. Send an email with the reset link containing the token
      // 2. The reset link would point to /auth/reset-password?token=${resetToken}
      // 3. Remove the console.log statements above
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    return handleError(error, {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
    });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit';
import { handleError } from '@/lib/error-handler';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
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
    const { token, password } = resetPasswordSchema.parse(body);

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Token must not be expired
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Log successful password reset
    console.log(`Password reset successful for user: ${user.email}`);

    return NextResponse.json({
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });

  } catch (error) {
    return handleError(error, {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
    });
  }
}

// GET endpoint to validate reset token
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      );
    }

    // Check if token exists and is not expired
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: user.email,
    });

  } catch (error) {
    return handleError(error, {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
    });
  }
}
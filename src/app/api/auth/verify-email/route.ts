import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit';
import { handleError } from '@/lib/error-handler';
import { z } from 'zod';

const verifyEmailSchema = z.object({
  token: z.string().min(1),
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
    const { token } = verifyEmailSchema.parse(body);

    // Find user with the verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Email is already verified' },
        { status: 200 }
      );
    }

    // Mark email as verified and clear verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
      },
    });

    // Log successful email verification
    console.log(`Email verified successfully for user: ${user.email}`);

    return NextResponse.json({
      message: 'Email verified successfully! You can now access all features.',
    });

  } catch (error) {
    return handleError(error, {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
    });
  }
}

// GET endpoint to validate verification token
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Check if token exists
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { valid: false, error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { valid: false, error: 'Email is already verified' },
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
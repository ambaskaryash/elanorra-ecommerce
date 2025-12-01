import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { handleError } from '@/lib/error-handler';
import { createCSRFProtectedHandler } from '@/lib/csrf';
import { prisma } from '@/lib/prisma';

const limiter = rateLimit(rateLimitConfigs.api);

async function handlePOST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await limiter(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Check authentication
    const { userId } = await auth();
    console.log('Upload API - User ID:', userId);
    
    // Enhanced security - require admin access in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user data for admin check
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isAdmin: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!isDevelopment && !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // File validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 10MB allowed.' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }

    console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Log admin action
    console.log(`Admin action: ${user.id} uploaded file ${file.name} at ${new Date().toISOString()}`);

    const result = await uploadToCloudinary(file, 'ecommerce/products');

    console.log('Cloudinary result:', result);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      public_id: result.public_id,
    });
  } catch (error) {
    return handleError(error, {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
    });
  }
}

// Export CSRF-protected handler
export const { POST } = createCSRFProtectedHandler({
  POST: handlePOST,
});
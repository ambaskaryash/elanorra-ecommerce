import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit';
import { verifyAdminAccess, logAdminAction, requireAdminConfirmation } from '@/lib/admin-security';
import { handleError, asyncHandler, ValidationError } from '@/lib/error-handler';

const updateReturnSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'processed']),
  adminNotes: z.string().optional(),
});

const limiter = rateLimit(rateLimitConfigs.api);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Enhanced admin verification
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting
     const rateLimitResult = await limiter(request);
     if (!rateLimitResult.success) {
       return NextResponse.json(
         { error: 'Too many requests' },
         { status: 429 }
       );
     }

    // Log admin action
    console.log(`Admin action: ${session.user.id} viewed return requests at ${new Date().toISOString()}`);

    const returnRequests = await (prisma as any).ReturnRequest.findMany({
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        items: {
          include: {
            orderItem: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ returnRequests });
  } catch (error) {
    return handleError(error, {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResult = await limiter(req);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { returnId, ...updateData } = body;
    
    if (!returnId) {
      return NextResponse.json({ error: 'Return ID is required' }, { status: 400 });
    }

    const validation = updateReturnSchema.safeParse(updateData);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }

    // Log admin action for sensitive operations
    console.log(`Admin action: ${session.user.id} updated return request ${returnId} with status ${validation.data.status} at ${new Date().toISOString()}`);

    const updatedReturn = await (prisma as any).ReturnRequest.update({
      where: { id: returnId },
      data: {
        ...validation.data,
        updatedAt: new Date(),
      },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        items: {
          include: {
            orderItem: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: true,
                  }
                }
              }
            }
          }
        }
      },
    });

    return NextResponse.json(updatedReturn);
  } catch (error) {
    return handleError(error, {
      url: req.url,
      method: req.method,
      userAgent: req.headers.get('user-agent') || undefined,
    });
  }
}
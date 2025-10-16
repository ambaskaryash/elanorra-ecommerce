import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateReturnSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'processed']),
  adminNotes: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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
    console.error('Error fetching return requests:', error);
    return NextResponse.json({ error: 'Failed to fetch return requests' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { returnId, ...updateData } = body;
    
    if (!returnId) {
      return NextResponse.json({ error: 'Return ID is required' }, { status: 400 });
    }

    const validation = updateReturnSchema.safeParse(updateData);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }

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
    console.error('Error updating return request:', error);
    return NextResponse.json({ error: 'Failed to update return request' }, { status: 500 });
  }
}
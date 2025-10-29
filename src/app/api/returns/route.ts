import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const returnRequestSchema = z.object({
  orderId: z.string(),
  reason: z.string(),
  items: z.array(z.object({
    orderItemId: z.string(),
    quantity: z.number().min(1),
  })),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const returnRequests = await (prisma as any).ReturnRequest.findMany({
    where: { order: { userId: user.id } },
    include: { order: true, items: { include: { orderItem: { include: { product: true } } } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(returnRequests);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = await req.json();
  const validation = returnRequestSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues }, { status: 400 });
  }

  const { orderId, reason, items } = validation.data;

  const newReturnRequest = await (prisma as any).ReturnRequest.create({
    data: {
      orderId,
      reason,
      items: {
        create: items.map(item => ({
          orderItemId: item.orderItemId,
          quantity: item.quantity,
        })),
      },
    },
  });

  return NextResponse.json(newReturnRequest);
}
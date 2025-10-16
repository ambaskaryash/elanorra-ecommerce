import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const returnRequests = await (prisma as any).ReturnRequest.findMany({
    where: { order: { userId: session.user.id } },
    include: { order: true, items: { include: { orderItem: { include: { product: true } } } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(returnRequests);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
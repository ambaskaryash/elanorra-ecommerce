import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ returnId: string }> }) {
  const { returnId } = await params;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const returnRequest = await (prisma as any).ReturnRequest.findUnique({
    where: { id: returnId },
    include: { order: true, items: { include: { orderItem: { include: { product: true } } } } },
  });

  if (!returnRequest || returnRequest.order.userId !== userId) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  return NextResponse.json(returnRequest);
}
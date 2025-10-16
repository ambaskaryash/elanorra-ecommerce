import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { returnId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const returnRequest = await (prisma as any).ReturnRequest.findUnique({
    where: { id: params.returnId },
    include: { order: true, items: { include: { orderItem: { include: { product: true } } } } },
  });

  if (!returnRequest || returnRequest.order.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  return NextResponse.json(returnRequest);
}
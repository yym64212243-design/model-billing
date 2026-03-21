import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

export async function getAuthorizedOrderResponse(orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });
  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (order.userId !== session.user.id && !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    id: order.id,
    planId: order.planId,
    amount: order.amount / 100,
    currency: order.currency,
    credits: order.credits,
    status: order.status,
    paymentMethod: order.paymentMethod,
    memo: order.reference ?? '',
    createdAt: order.createdAt,
    confirmedAt: order.paidAt,
  });
}

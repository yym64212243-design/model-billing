import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const orders = await prisma.order.findMany({
    where: { status: 'PENDING', paymentMethod: 'MANUAL' },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { email: true } } },
    take: 200,
  });
  return NextResponse.json(
    orders.map((o) => ({
      id: o.id,
      memo: o.reference ?? '',
      userEmail: o.user.email,
      planId: o.planId,
      amountAUD: o.currency.toLowerCase() === 'aud' ? o.amount / 100 : o.amount / 100,
      credits: o.credits,
      status: o.status,
      createdAt: o.createdAt,
    }))
  );
}


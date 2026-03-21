import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const takeRaw = searchParams.get('take');
  const take = Math.min(20, Math.max(1, parseInt(takeRaw ?? '10', 10) || 10));

  const items = await prisma.creditLedger.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      type: true,
      changeAmount: true,
      balanceAfter: true,
      note: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ items });
}


import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  _request: Request,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = context.params.id;
  const key = await prisma.userApiKey.findUnique({ where: { id }, select: { id: true, userId: true, isActive: true } });
  if (!key || key.userId !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!key.isActive) return NextResponse.json({ ok: true, already: true });

  await prisma.userApiKey.update({
    where: { id },
    data: { isActive: false, revokedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

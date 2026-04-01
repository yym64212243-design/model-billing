import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createUserApiKey } from '@/lib/user-api-key';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const keys = await prisma.userApiKey.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      last4: true,
      isActive: true,
      createdAt: true,
      lastUsedAt: true,
      revokedAt: true,
    },
  });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } });
  return NextResponse.json({ credits: user?.credits ?? 0, keys });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let name = 'default';
  try {
    const body = (await request.json()) as { name?: string };
    name = (body.name ?? 'default').trim() || 'default';
  } catch {
    // keep default when body is empty / not json
  }

  const { rawKey, record } = await createUserApiKey(userId, name.slice(0, 40));
  return NextResponse.json({
    key: rawKey,
    record,
    warning: 'This key is shown once. Save it now.',
  });
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function unauthorized(msg = 'Unauthorized') {
  return NextResponse.json({ error: msg }, { status: 401 });
}

function getApiKey(req: Request): string | null {
  const h = req.headers.get('authorization');
  if (h?.toLowerCase().startsWith('bearer ')) return h.slice(7).trim();
  return req.headers.get('x-api-key');
}

export async function GET(req: Request) {
  const expected = process.env.BILLING_API_KEY ?? '';
  if (!expected) return unauthorized('BILLING_API_KEY is not configured');
  const provided = getApiKey(req);
  if (!provided || provided !== expected) return unauthorized();

  const { searchParams } = new URL(req.url);
  const userId = (searchParams.get('userId') ?? '').trim();
  const takeRaw = searchParams.get('take');
  const take = Math.min(200, Math.max(1, parseInt(takeRaw ?? '50', 10) || 50));

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const items = await prisma.creditLedger.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      orderId: true,
      changeAmount: true,
      type: true,
      balanceAfter: true,
      note: true,
      idempotencyKey: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ items });
}


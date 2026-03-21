import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deductCredits } from '@/lib/credits';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      amount?: number;
      idempotencyKey?: string;
      reason?: string;
      metadata?: unknown;
    };

    const result = await deductCredits({
      userId: session.user.id,
      amount: Number(body.amount),
      idempotencyKey: String(body.idempotencyKey ?? ''),
      reason: body.reason ?? null,
      metadata: body.metadata,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error, balance: result.balance ?? null }, { status: result.status });
    }

    return NextResponse.json({ ok: true, already: result.already, balance: result.balance });
  } catch (e) {
    console.error('User deduct error:', e);
    return NextResponse.json({ error: 'Failed to deduct' }, { status: 500 });
  }
}


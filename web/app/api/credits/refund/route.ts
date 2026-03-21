import { NextResponse } from 'next/server';
import { refundCredits } from '@/lib/credits';

function unauthorized(msg = 'Unauthorized') {
  return NextResponse.json({ error: msg }, { status: 401 });
}

function getApiKey(req: Request): string | null {
  const h = req.headers.get('authorization');
  if (h?.toLowerCase().startsWith('bearer ')) return h.slice(7).trim();
  return req.headers.get('x-api-key');
}

export async function POST(req: Request) {
  const expected = process.env.BILLING_API_KEY ?? '';
  if (!expected) return unauthorized('BILLING_API_KEY is not configured');
  const provided = getApiKey(req);
  if (!provided || provided !== expected) return unauthorized();

  try {
    const body = (await req.json()) as {
      userId?: string;
      amount?: number;
      idempotencyKey?: string;
      reason?: string;
      originalLedgerId?: string;
      metadata?: unknown;
    };

    const result = await refundCredits({
      userId: String(body.userId ?? ''),
      amount: Number(body.amount),
      idempotencyKey: String(body.idempotencyKey ?? ''),
      reason: body.reason ?? null,
      originalLedgerId: body.originalLedgerId ?? null,
      metadata: body.metadata,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error, balance: result.balance ?? null }, { status: result.status });
    }
    return NextResponse.json({ ok: true, already: result.already, balance: result.balance });
  } catch (e) {
    console.error('Refund credits error:', e);
    return NextResponse.json({ error: 'Failed to refund' }, { status: 500 });
  }
}


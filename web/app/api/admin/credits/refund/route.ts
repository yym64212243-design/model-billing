import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { refundCredits } from '@/lib/credits';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const form = await req.formData();
    const userId = String(form.get('userId') ?? '').trim();
    const amount = parseInt(String(form.get('amount') ?? '').trim(), 10);
    const idempotencyKey = String(form.get('idempotencyKey') ?? '').trim();
    const reason = String(form.get('reason') ?? '').trim() || 'ADMIN_REFUND';
    const originalLedgerId = String(form.get('originalLedgerId') ?? '').trim() || null;

    const result = await refundCredits({
      userId,
      amount,
      idempotencyKey,
      reason,
      originalLedgerId,
      metadata: { source: 'admin', adminEmail: session?.user?.email ?? null },
    });

    const accept = req.headers.get('accept') ?? '';
    if (accept.includes('text/html')) {
      return NextResponse.redirect(new URL('/admin/ledger', req.url), 303);
    }

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true, already: result.already, balance: result.balance });
  } catch (e) {
    console.error('Admin refund error:', e);
    return NextResponse.json({ error: 'Failed to refund' }, { status: 500 });
  }
}


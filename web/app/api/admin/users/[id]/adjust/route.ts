import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const form = await req.formData();
    const amountRaw = String(form.get('amount') ?? '').trim();
    const note = String(form.get('note') ?? '').trim() || null;
    const amount = parseInt(amountRaw, 10);
    if (!Number.isFinite(amount) || amount === 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: params.id }, select: { credits: true } });
      if (!user) return { error: 'User not found' as const, status: 404 };
      const newBalance = user.credits + amount;
      if (newBalance < 0) return { error: 'Insufficient balance' as const, status: 409 };

      await tx.user.update({ where: { id: params.id }, data: { credits: newBalance } });
      await tx.creditLedger.create({
        data: {
          userId: params.id,
          changeAmount: amount,
          type: 'ADMIN_ADJUST',
          balanceAfter: newBalance,
          note: note ?? (session?.user?.email ? `admin ${session.user.email}` : 'admin'),
        },
      });
      return { ok: true as const };
    });

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    const accept = req.headers.get('accept') ?? '';
    if (accept.includes('text/html')) {
      return NextResponse.redirect(new URL('/admin/users', req.url), 303);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Admin adjust credits error:', e);
    return NextResponse.json({ error: 'Failed to adjust' }, { status: 500 });
  }
}


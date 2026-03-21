import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import { purchaseCredits } from '@/lib/credits';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: params.id } });
      if (!order) return { error: 'Not found' as const, status: 404 };
      if (order.status === 'PAID') return { ok: true as const, already: true as const };
      if (order.status !== 'PENDING') return { error: 'Not pending' as const, status: 409 };

      await tx.order.update({
        where: { id: order.id },
        data: { status: 'PAID', paidAt: new Date() },
      });

      // Record a payment row for audit. (Provider-specific details can be filled later.)
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: order.paymentMethod,
          status: 'SUCCEEDED',
          providerPayload: JSON.stringify({
            source: 'admin',
            adminEmail: session?.user?.email ?? null,
          }),
        },
      });

      // Credit inside the same DB transaction for atomicity.
      const user = await tx.user.findUnique({ where: { id: order.userId }, select: { credits: true } });
      if (!user) return { error: 'User not found' as const, status: 404 };

      const newBalance = user.credits + order.credits;
      await tx.user.update({ where: { id: order.userId }, data: { credits: newBalance } });
      try {
        await tx.creditLedger.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            changeAmount: order.credits,
            type: 'PURCHASE',
            balanceAfter: newBalance,
            note: 'ORDER_PAID',
            metadata: JSON.stringify({ source: 'admin', adminEmail: session?.user?.email ?? null }),
          },
        });
      } catch {
        // Unique (orderId,type) already exists => idempotent.
        return { ok: true as const, already: true as const };
      }

      return { ok: true as const, already: false as const };
    });

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });

    const accept = _req.headers.get('accept') ?? '';
    if (accept.includes('text/html')) {
      return NextResponse.redirect(new URL('/admin/orders', _req.url), 303);
    }
    return NextResponse.json({ ok: true, already: result.already });
  } catch (e) {
    console.error('Admin mark paid error:', e);
    return NextResponse.json({ error: 'Failed to mark paid' }, { status: 500 });
  }
}


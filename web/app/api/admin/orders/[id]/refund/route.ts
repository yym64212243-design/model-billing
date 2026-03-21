import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import { Prisma } from '@prisma/client';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: params.id } });
      if (!order) return { error: 'Not found' as const, status: 404 };
      if (order.status !== 'PAID') return { error: 'Not paid' as const, status: 409 };

      // Full revoke is allowed only once per order.
      const revokable = Math.max(0, order.credits - (order.refundedCredits ?? 0));
      if (revokable <= 0) return { error: 'Already refunded' as const, status: 409 };

      const user = await tx.user.findUnique({ where: { id: order.userId }, select: { credits: true } });
      if (!user) return { error: 'User not found' as const, status: 404 };

      // Order refund = revoke previously granted credits.
      const newBalance = user.credits - revokable;
      if (newBalance < 0) {
        return { error: 'Insufficient credits to revoke purchase' as const, status: 409 };
      }

      await tx.user.update({ where: { id: order.userId }, data: { credits: newBalance } });

      // Ledger entry: negative delta.
      await tx.creditLedger.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          changeAmount: -revokable,
          type: 'PURCHASE_REFUND',
          balanceAfter: newBalance,
          note: session?.user?.email ? `order refund by ${session.user.email}` : 'order refund by admin',
          idempotencyKey: `order-refund:${order.id}`,
          metadata: JSON.stringify({ source: 'admin', orderId: order.id, credits: revokable }),
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          refundedCredits: order.refundedCredits + revokable,
          refundedAt: new Date(),
          status: 'REFUNDED',
        },
      });

      // Payment audit entry (provider-specific fields can be filled later).
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: order.paymentMethod,
          status: 'SUCCEEDED',
          providerPayload: JSON.stringify({
            action: 'refund',
            source: 'admin',
            adminEmail: session?.user?.email ?? null,
            credits: revokable,
          }),
        },
      });

      return { ok: true as const, already: false as const };
    });

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    const accept = req.headers.get('accept') ?? '';
    if (accept.includes('text/html')) {
      return NextResponse.redirect(new URL('/admin/orders', req.url), 303);
    }
    return NextResponse.json({ ok: true, already: result.already });
  } catch (e) {
    // In case of a race, keep it safe / idempotent if unique constraint triggers somewhere else later.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ ok: true, already: true });
    }
    console.error('Admin refund error:', e);
    return NextResponse.json({ error: 'Failed to refund' }, { status: 500 });
  }
}


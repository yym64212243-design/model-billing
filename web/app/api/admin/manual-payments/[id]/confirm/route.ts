import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import { Prisma } from '@prisma/client';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: params.id },
      });
      if (!order) return { error: 'Not found' as const, status: 404 };
      if (order.paymentMethod !== 'MANUAL') {
        return { error: 'Not a manual order' as const, status: 409 };
      }
      if (order.status === 'PAID') return { ok: true as const, already: true as const };
      if (order.status !== 'PENDING') return { error: 'Not pending' as const, status: 409 };

      // Mark paid first so status reflects the decision even if ledger already exists.
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // Idempotent crediting via unique (orderId, type).
      try {
        const user = await tx.user.findUnique({
          where: { id: order.userId },
          select: { credits: true },
        });
        if (!user) return { error: 'User not found' as const, status: 404 };

        const newBalance = user.credits + order.credits;
        await tx.user.update({
          where: { id: order.userId },
          data: { credits: newBalance },
        });
        await tx.creditLedger.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            changeAmount: order.credits,
            type: 'PURCHASE',
            balanceAfter: newBalance,
          },
        });
        return { ok: true as const, already: false as const };
      } catch (e) {
        // If ledger already exists, assume credits already applied.
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          return { ok: true as const, already: true as const };
        }
        throw e;
      }
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    const accept = _req.headers.get('accept') ?? '';
    if (accept.includes('text/html')) {
      return NextResponse.redirect(new URL('/admin/payments', _req.url), 303);
    }
    return NextResponse.json({ ok: true, already: result.already });
  } catch (e) {
    console.error('Confirm manual payment error:', e);
    return NextResponse.json({ error: 'Failed to confirm' }, { status: 500 });
  }
}


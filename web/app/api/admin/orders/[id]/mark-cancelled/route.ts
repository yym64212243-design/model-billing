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
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: params.id } });
      if (!order) return { error: 'Not found' as const, status: 404 };
      if (order.status !== 'PENDING') return { error: 'Not pending' as const, status: 409 };

      await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: order.paymentMethod,
          status: 'CANCELLED',
          providerPayload: JSON.stringify({
            source: 'admin',
            adminEmail: session?.user?.email ?? null,
          }),
        },
      });
      return { ok: true as const };
    });

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    const accept = req.headers.get('accept') ?? '';
    if (accept.includes('text/html')) {
      return NextResponse.redirect(new URL('/admin/orders', req.url), 303);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Admin mark cancelled error:', e);
    return NextResponse.json({ error: 'Failed to mark cancelled' }, { status: 500 });
  }
}


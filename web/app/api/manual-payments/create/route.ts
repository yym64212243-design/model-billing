import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/constants';
import type { PlanId } from '@/lib/constants';

function makeMemo() {
  // short, human-friendly memo for transfer note
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `OC-${rand}`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { planId, returnUrl } = body as { planId?: string; returnUrl?: string };
    const pid = (planId as PlanId) ?? 'plan_10';
    const fallbackPlan = PLANS.find((p) => p.id === pid) ?? PLANS[1];
    const plan =
      (await prisma.plan.findUnique({ where: { id: pid } })) ??
      (await prisma.plan.upsert({
        where: { id: fallbackPlan.id },
        create: {
          id: fallbackPlan.id,
          name: fallbackPlan.name,
          description: fallbackPlan.description,
          price: Math.round(fallbackPlan.price * 100),
          currency: fallbackPlan.currency,
          credits: fallbackPlan.credits,
          isActive: true,
          popular: Boolean(fallbackPlan.popular),
        },
        update: {},
      }));

    const memo = makeMemo();
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        planId: plan.id,
        amount: plan.price,
        currency: plan.currency,
        credits: plan.credits,
        paymentMethod: 'MANUAL',
        status: 'PENDING',
        reference: memo,
      },
      select: { id: true, reference: true, amount: true, currency: true, credits: true, status: true },
    });

    return NextResponse.json({
      orderId: order.id,
      memo: order.reference,
      amount: order.amount / 100,
      currency: order.currency,
      credits: order.credits,
      status: order.status,
      returnUrl: returnUrl ?? null,
    });
  } catch (e) {
    console.error('Create manual payment order error:', e);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}


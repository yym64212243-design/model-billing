import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/constants';
import type { PlanId } from '@/lib/constants';
import { buildAlipayPagePayUrl } from '@/lib/alipay';

function formatAmountCny(cents: number): string {
  return (cents / 100).toFixed(2);
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
    const appId = process.env.ALIPAY_APP_ID;
    const privateKey = process.env.ALIPAY_PRIVATE_KEY;
    const gateway = process.env.ALIPAY_GATEWAY ?? 'https://openapi.alipay.com/gateway.do';
    const baseUrl = process.env.BILLING_BASE_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const notifyUrl = process.env.ALIPAY_NOTIFY_URL ?? `${baseUrl}/api/webhooks/alipay`;

    if (!appId || !privateKey) {
      return NextResponse.json(
        { error: 'Alipay not configured. Set ALIPAY_APP_ID and ALIPAY_PRIVATE_KEY.' },
        { status: 503 }
      );
    }

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

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        planId: plan.id,
        amount: plan.price,
        currency: plan.currency,
        credits: plan.credits,
        paymentMethod: 'ALIPAY',
        status: 'PENDING',
      },
      select: { id: true, amount: true, credits: true },
    });

    const successUrl = new URL('/success', baseUrl);
    successUrl.searchParams.set('order', order.id);
    if (returnUrl) successUrl.searchParams.set('return_url', returnUrl);
    const finalReturnUrl = process.env.ALIPAY_RETURN_URL ?? successUrl.toString();

    const payUrl = buildAlipayPagePayUrl({
      appId,
      privateKey,
      gateway,
      notifyUrl,
      returnUrl: finalReturnUrl,
      outTradeNo: order.id,
      totalAmount: formatAmountCny(order.amount),
      subject: `Model Billing · ${plan.name}`,
    });

    return NextResponse.json({
      orderId: order.id,
      credits: order.credits,
      payUrl,
    });
  } catch (e) {
    console.error('Create Alipay order error:', e);
    return NextResponse.json({ error: 'Failed to create Alipay order' }, { status: 500 });
  }
}

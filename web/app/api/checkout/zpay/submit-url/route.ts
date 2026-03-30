import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/constants';
import type { PlanId } from '@/lib/constants';
import { zpayGatewayBase, zpaySign } from '@/lib/zpay';

function formatMoneyYuan(cents: number): string {
  return (cents / 100).toFixed(2);
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pid = process.env.ZPAY_PID?.trim();
    const key = process.env.ZPAY_KEY?.trim();
    if (!pid || !key) {
      return NextResponse.json({ error: 'ZPAY not configured.' }, { status: 503 });
    }

    const body = await request.json();
    const { planId, type } = body as { planId?: string; type?: 'alipay' | 'wxpay' };
    const payType = type === 'wxpay' ? 'wxpay' : 'alipay';
    const pidPlan = (planId as PlanId) ?? 'plan_10';

    const baseUrl = (process.env.BILLING_BASE_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(
      /\/+$/,
      ''
    );
    const notifyUrl = (process.env.ZPAY_NOTIFY_URL ?? `${baseUrl}/api/webhooks/zpay`).replace(/\/+$/, '');
    const returnUrl = (process.env.ZPAY_RETURN_URL ?? `${baseUrl}/pay/zpay-return`).replace(/\/+$/, '');
    if (notifyUrl.includes('?') || returnUrl.includes('?')) {
      return NextResponse.json({ error: 'ZPAY URLs must not contain query strings.' }, { status: 400 });
    }

    const gateway = zpayGatewayBase(process.env.ZPAY_GATEWAY ?? 'https://zpayz.cn/');
    const submitUrl = `${gateway}/submit.php`;

    const fallbackPlan = PLANS.find((p) => p.id === pidPlan) ?? PLANS[1];
    const plan =
      (await prisma.plan.findUnique({ where: { id: pidPlan } })) ??
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
        paymentMethod: 'ZPAY',
        status: 'PENDING',
      },
      select: { id: true },
    });

    const params: Record<string, string> = {
      name: `Model Billing · ${plan.name}`,
      money: formatMoneyYuan(plan.price),
      type: payType,
      out_trade_no: order.id,
      notify_url: notifyUrl,
      pid,
      return_url: returnUrl,
      sign_type: 'MD5',
    };
    const cid = process.env.ZPAY_CID?.trim();
    if (cid) params.cid = cid;
    params.sign = zpaySign(params, key);

    const q = new URLSearchParams(params);
    return NextResponse.json({
      orderId: order.id,
      method: 'GET' as const,
      action: `${submitUrl}?${q.toString()}`,
    });
  } catch (e) {
    console.error('ZPAY submit-url error:', e);
    return NextResponse.json({ error: 'Failed to build ZPAY submit URL' }, { status: 500 });
  }
}

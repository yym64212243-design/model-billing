import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/constants';
import type { PlanId } from '@/lib/constants';
import { zpayGatewayBase, zpaySign } from '@/lib/zpay';

function formatMoneyYuan(cents: number): string {
  return (cents / 100).toFixed(2);
}

function clientIpFromRequest(req: Request): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]?.trim() || '127.0.0.1';
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return '127.0.0.1';
}

type MapiOk = {
  code: number;
  msg?: string;
  O_id?: string;
  trade_no?: string;
  payurl?: string;
  payurl2?: string;
  qrcode?: string;
  img?: string;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pid = process.env.ZPAY_PID?.trim();
    const key = process.env.ZPAY_KEY?.trim();
    if (!pid || !key) {
      return NextResponse.json(
        { error: 'ZPAY not configured. Set ZPAY_PID and ZPAY_KEY.' },
        { status: 503 }
      );
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
      return NextResponse.json(
        { error: 'ZPAY notify_url and return_url must not contain query strings (ZPAY requirement).' },
        { status: 400 }
      );
    }

    const gateway = zpayGatewayBase(process.env.ZPAY_GATEWAY ?? 'https://zpayz.cn/');
    const mapiUrl = `${gateway}/mapi.php`;

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
      select: { id: true, amount: true, credits: true },
    });

    const money = formatMoneyYuan(order.amount);
    const params: Record<string, string> = {
      pid,
      type: payType,
      out_trade_no: order.id,
      notify_url: notifyUrl,
      name: `Model Billing · ${plan.name}`,
      money,
      clientip: clientIpFromRequest(request),
      device: 'pc',
      sign_type: 'MD5',
    };
    const cid = process.env.ZPAY_CID?.trim();
    if (cid) params.cid = cid;
    params.sign = zpaySign(params, key);

    const form = new URLSearchParams(params);
    const res = await fetch(mapiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: form.toString(),
    });

    const text = await res.text();
    let data: MapiOk;
    try {
      data = JSON.parse(text) as MapiOk;
    } catch {
      return NextResponse.json(
        { error: `ZPAY invalid response: ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    if (data.code !== 1) {
      await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
      return NextResponse.json({ error: data.msg ?? 'ZPAY order failed' }, { status: 502 });
    }

    let qrImageUrl: string | null = null;
    let qrDataUrl: string | null = null;
    const imgRaw = data.img?.trim();
    if (imgRaw) {
      qrImageUrl = /^https?:\/\//i.test(imgRaw) ? imgRaw : `${gateway}/${imgRaw.replace(/^\//, '')}`;
    }
    const qrContent = data.qrcode?.trim();
    const payJump = data.payurl?.trim() || data.payurl2?.trim();
    if (!qrImageUrl) {
      const payload = qrContent || payJump;
      if (payload) {
        qrDataUrl = await QRCode.toDataURL(payload, { width: 256, margin: 2, errorCorrectionLevel: 'M' });
      }
    }

    return NextResponse.json({
      orderId: order.id,
      credits: order.credits,
      payurl: data.payurl ?? data.payurl2 ?? null,
      qrImageUrl,
      qrDataUrl,
      zpayTradeNo: data.trade_no ?? null,
      zpayOid: data.O_id ?? null,
    });
  } catch (e) {
    console.error('ZPAY create error:', e);
    return NextResponse.json({ error: 'Failed to create ZPAY order' }, { status: 500 });
  }
}

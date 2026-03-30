import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { zpayVerify } from '@/lib/zpay';

function text(body: string, status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

function audit(level: 'info' | 'warn' | 'error', event: string, payload: Record<string, unknown>) {
  const logger = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
  logger(`[zpay-webhook] ${event}`, payload);
}

async function parsePostBody(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const raw = await request.text();
    return Object.fromEntries(new URLSearchParams(raw).entries());
  }
  const fd = await request.formData();
  return Object.fromEntries(Array.from(fd.entries(), ([k, v]) => [k, String(v)]));
}

function moneyMatchesOrderYuan(orderCents: number, moneyParam: string | undefined): boolean {
  if (moneyParam == null || moneyParam === '') return false;
  const expected = (orderCents / 100).toFixed(2);
  return moneyParam.trim() === expected;
}

async function handleNotify(params: Record<string, string>) {
  const key = process.env.ZPAY_KEY?.trim();
  if (!key) {
    audit('error', 'missing_key', {});
    return text('failure', 500);
  }

  const context = {
    outTradeNo: params.out_trade_no ?? null,
    tradeNo: params.trade_no ?? null,
    tradeStatus: params.trade_status ?? null,
  };

  if (!zpayVerify(params, key)) {
    audit('warn', 'signature_verification_failed', context);
    return text('failure', 400);
  }

  const outTradeNo = params.out_trade_no;
  const tradeNo = params.trade_no;
  const tradeStatus = params.trade_status;
  if (!outTradeNo || !tradeNo) {
    audit('warn', 'missing_trade_identifiers', context);
    return text('failure', 400);
  }

  if (tradeStatus !== 'TRADE_SUCCESS') {
    audit('info', 'ignored_non_success_status', context);
    return text('success');
  }

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: outTradeNo } });
      if (!order) {
        audit('error', 'order_not_found', context);
        throw new Error('ORDER_NOT_FOUND');
      }
      if (!moneyMatchesOrderYuan(order.amount, params.money)) {
        audit('warn', 'amount_mismatch', { ...context, money: params.money, orderAmount: order.amount });
        throw new Error('AMOUNT_MISMATCH');
      }
      if (order.status === 'PAID') {
        audit('info', 'already_paid_idempotent', { ...context, orderStatus: order.status });
        return;
      }
      if (order.status !== 'PENDING') {
        audit('warn', 'ignored_non_pending_order', { ...context, orderStatus: order.status });
        return;
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          paymentMethod: 'ZPAY',
          externalOrderId: tradeNo,
        },
      });

      try {
        const user = await tx.user.findUnique({
          where: { id: order.userId },
          select: { credits: true },
        });
        if (!user) throw new Error('USER_NOT_FOUND');
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
            note: 'ZPAY payment confirmed',
          },
        });
        audit('info', 'credited_successfully', {
          ...context,
          userId: order.userId,
          credits: order.credits,
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          audit('info', 'ledger_idempotent_duplicate', context);
          return;
        }
        throw e;
      }
    });
  } catch (e) {
    audit('error', 'notify_handling_failed', {
      ...context,
      error: e instanceof Error ? e.message : String(e),
    });
    return text('failure', 500);
  }

  return text('success');
}

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  return handleNotify(params);
}

export async function POST(request: Request) {
  const params = await parsePostBody(request);
  return handleNotify(params);
}

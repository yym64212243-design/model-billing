import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAlipaySignature } from '@/lib/alipay';

function text(body: string, status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

function audit(level: 'info' | 'warn' | 'error', event: string, payload: Record<string, unknown>) {
  const logger = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
  logger(`[alipay-webhook] ${event}`, payload);
}

export async function POST(request: Request) {
  const publicKey = process.env.ALIPAY_PUBLIC_KEY;
  if (!publicKey) {
    audit('error', 'missing_public_key', {});
    return text('failure', 500);
  }

  const raw = await request.text();
  const params = Object.fromEntries(new URLSearchParams(raw).entries());
  const context = {
    outTradeNo: params.out_trade_no ?? null,
    tradeNo: params.trade_no ?? null,
    tradeStatus: params.trade_status ?? null,
  };

  const verified = verifyAlipaySignature(params, publicKey);
  if (!verified) {
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
  if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
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
          paymentMethod: 'ALIPAY',
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
            note: 'Alipay payment confirmed',
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

import { prisma } from '@/lib/prisma';
import { vi } from 'vitest';

vi.mock('@/lib/alipay', () => ({
  verifyAlipaySignature: vi.fn(() => true),
}));

import { POST } from '@/app/api/webhooks/alipay/route';

async function createUser(email = 'alipay@example.com', credits = 0) {
  return prisma.user.create({
    data: { email, credits, passwordHash: '$2a$10$testtesttesttesttesttesttesttesttesttesttesttest' },
    select: { id: true, credits: true },
  });
}

describe('alipay webhook (integration)', () => {
  it('marks order paid, credits balance, and stays idempotent on duplicate notify', async () => {
    process.env.ALIPAY_PUBLIC_KEY = 'test-public-key';

    const user = await createUser('notify@example.com', 10);
    await prisma.plan.create({
      data: {
        id: 'plan_notify',
        name: 'Notify',
        description: 'Notify plan',
        price: 1200,
        currency: 'CNY',
        credits: 120,
        isActive: true,
        popular: false,
      },
    });

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        planId: 'plan_notify',
        amount: 1200,
        currency: 'CNY',
        credits: 120,
        status: 'PENDING',
        paymentMethod: 'ALIPAY',
      },
      select: { id: true },
    });

    const body = new URLSearchParams({
      out_trade_no: order.id,
      trade_no: '202603190001',
      trade_status: 'TRADE_SUCCESS',
      sign: 'mock-signature',
    }).toString();

    const request = new Request('http://localhost/api/webhooks/alipay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const response1 = await POST(request);
    expect(response1.status).toBe(200);
    expect(await response1.text()).toBe('success');

    const afterFirst = await prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    });
    expect(afterFirst?.credits).toBe(130);

    const paidOrder = await prisma.order.findUnique({
      where: { id: order.id },
      select: { status: true, externalOrderId: true },
    });
    expect(paidOrder?.status).toBe('PAID');
    expect(paidOrder?.externalOrderId).toBe('202603190001');

    const response2 = await POST(
      new Request('http://localhost/api/webhooks/alipay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
    );
    expect(response2.status).toBe(200);
    expect(await response2.text()).toBe('success');

    const afterSecond = await prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    });
    expect(afterSecond?.credits).toBe(130);

    const ledgers = await prisma.creditLedger.findMany({
      where: { orderId: order.id, type: 'PURCHASE' },
    });
    expect(ledgers).toHaveLength(1);
    expect(ledgers[0].changeAmount).toBe(120);
  });
});

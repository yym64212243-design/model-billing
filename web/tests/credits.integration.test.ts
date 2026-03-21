import { prisma } from '@/lib/prisma';
import { deductCredits, purchaseCredits, refundCredits } from '@/lib/credits';

async function createUser(email = 'u@example.com', credits = 0) {
  return prisma.user.create({
    data: { email, credits, passwordHash: '$2a$10$testtesttesttesttesttesttesttesttesttesttesttest' },
    select: { id: true, credits: true },
  });
}

describe('credits system (integration)', () => {
  it('purchase increases balance and is idempotent by orderId', async () => {
    const u = await createUser('p@example.com', 0);
    await prisma.plan.create({
      data: {
        id: 'plan_test',
        name: 'Test',
        description: 'Test',
        price: 100,
        currency: 'AUD',
        credits: 100,
        isActive: true,
        popular: false,
      },
    });
    const order = await prisma.order.create({
      data: {
        userId: u.id,
        planId: 'plan_test',
        amount: 100,
        currency: 'AUD',
        credits: 100,
        status: 'PAID',
        paymentMethod: 'MANUAL',
      },
      select: { id: true },
    });

    const r1 = await purchaseCredits({ userId: u.id, amount: 100, orderId: order.id, reason: 'TEST_PURCHASE' });
    expect(r1.ok).toBe(true);
    if (!r1.ok) throw new Error('unexpected');
    expect(r1.already).toBe(false);
    expect(r1.balance).toBe(100);

    const r2 = await purchaseCredits({ userId: u.id, amount: 100, orderId: order.id, reason: 'TEST_PURCHASE' });
    expect(r2.ok).toBe(true);
    if (!r2.ok) throw new Error('unexpected');
    expect(r2.already).toBe(true);
    expect(r2.balance).toBe(100);

    const user = await prisma.user.findUnique({ where: { id: u.id }, select: { credits: true } });
    expect(user?.credits).toBe(100);
  });

  it('deduct decreases balance and is idempotent by idempotencyKey', async () => {
    const u = await createUser('d@example.com', 50);

    const r1 = await deductCredits({
      userId: u.id,
      amount: 10,
      idempotencyKey: 'req-001',
      reason: 'SIMULATED_USAGE',
    });
    expect(r1.ok).toBe(true);
    if (!r1.ok) throw new Error('unexpected');
    expect(r1.already).toBe(false);
    expect(r1.balance).toBe(40);

    const r2 = await deductCredits({
      userId: u.id,
      amount: 10,
      idempotencyKey: 'req-001',
      reason: 'SIMULATED_USAGE',
    });
    expect(r2.ok).toBe(true);
    if (!r2.ok) throw new Error('unexpected');
    expect(r2.already).toBe(true);
    expect(r2.balance).toBe(40);

    const ledgers = await prisma.creditLedger.findMany({ where: { userId: u.id, type: 'DEDUCTION' } });
    expect(ledgers).toHaveLength(1);
  });

  it('deduct fails when balance is insufficient', async () => {
    const u = await createUser('low@example.com', 5);
    const r = await deductCredits({
      userId: u.id,
      amount: 10,
      idempotencyKey: 'req-low',
      reason: 'TEST',
    });
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('unexpected');
    expect(r.status).toBe(409);
    expect(r.error).toMatch(/Insufficient/);

    const user = await prisma.user.findUnique({ where: { id: u.id }, select: { credits: true } });
    expect(user?.credits).toBe(5);
    const ledgers = await prisma.creditLedger.findMany({ where: { userId: u.id } });
    expect(ledgers).toHaveLength(0);
  });

  it('refund increases balance, is idempotent by idempotencyKey, and can bind to originalLedgerId', async () => {
    const u = await createUser('r@example.com', 100);

    const d = await deductCredits({
      userId: u.id,
      amount: 10,
      idempotencyKey: 'deduct-001',
      reason: 'SIMULATED_USAGE',
    });
    expect(d.ok).toBe(true);
    if (!d.ok) throw new Error('unexpected');
    expect(d.balance).toBe(90);

    const original = await prisma.creditLedger.findFirst({
      where: { userId: u.id, idempotencyKey: 'deduct-001', type: 'DEDUCTION' },
      select: { id: true, changeAmount: true },
    });
    expect(original?.id).toBeTruthy();
    expect(original?.changeAmount).toBe(-10);

    const r1 = await refundCredits({
      userId: u.id,
      amount: 10,
      idempotencyKey: 'refund-001',
      reason: 'TEST_REFUND',
      originalLedgerId: original!.id,
    });
    expect(r1.ok).toBe(true);
    if (!r1.ok) throw new Error('unexpected');
    expect(r1.already).toBe(false);
    expect(r1.balance).toBe(100);

    const r2 = await refundCredits({
      userId: u.id,
      amount: 10,
      idempotencyKey: 'refund-001',
      reason: 'TEST_REFUND',
      originalLedgerId: original!.id,
    });
    expect(r2.ok).toBe(true);
    if (!r2.ok) throw new Error('unexpected');
    expect(r2.already).toBe(true);
    expect(r2.balance).toBe(100);

    const refunds = await prisma.creditLedger.findMany({ where: { userId: u.id, type: 'DEDUCTION_REVERSAL' } });
    expect(refunds).toHaveLength(1);
    expect(refunds[0].originalLedgerId).toBe(original!.id);
  });

  it('refund cannot exceed original deduction amount', async () => {
    const u = await createUser('rx@example.com', 100);

    await deductCredits({ userId: u.id, amount: 10, idempotencyKey: 'deduct-x', reason: 'X' });
    const original = await prisma.creditLedger.findFirst({
      where: { userId: u.id, idempotencyKey: 'deduct-x', type: 'DEDUCTION' },
      select: { id: true },
    });
    expect(original?.id).toBeTruthy();

    const r = await refundCredits({
      userId: u.id,
      amount: 11,
      idempotencyKey: 'refund-x',
      reason: 'X',
      originalLedgerId: original!.id,
    });
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('unexpected');
    expect(r.status).toBe(409);
    expect(r.error).toMatch(/exceeds/i);
  });

  it('concurrent deducts do not drive balance negative', async () => {
    const u = await createUser('c@example.com', 10);
    const [a, b] = await Promise.all([
      deductCredits({ userId: u.id, amount: 10, idempotencyKey: 'c-1', reason: 'C' }),
      deductCredits({ userId: u.id, amount: 10, idempotencyKey: 'c-2', reason: 'C' }),
    ]);
    const oks = [a, b].filter((x) => x.ok) as Array<{ ok: true; already: boolean; balance: number }>;
    const fails = [a, b].filter((x) => !x.ok) as Array<{ ok: false; status: number; error: string; balance?: number | null }>;
    expect(oks.length).toBe(1);
    expect(fails.length).toBe(1);
    expect(fails[0].status).toBe(409);

    const user = await prisma.user.findUnique({ where: { id: u.id }, select: { credits: true } });
    expect(user?.credits).toBeGreaterThanOrEqual(0);
    expect(user?.credits).toBe(0);
  });
});


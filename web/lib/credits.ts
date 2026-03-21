import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type DeductCreditsInput = {
  userId: string;
  amount: number; // positive integer credits
  idempotencyKey: string;
  reason?: string | null;
  metadata?: unknown;
};

export type DeductCreditsResult =
  | { ok: true; already: boolean; balance: number }
  | { ok: false; status: number; error: string; balance?: number | null };

export type PurchaseCreditsInput = {
  userId: string;
  amount: number; // positive integer credits
  orderId?: string | null;
  idempotencyKey?: string | null; // optional for external triggers
  reason?: string | null;
  metadata?: unknown;
};

export type PurchaseCreditsResult = DeductCreditsResult;

export async function purchaseCredits(input: PurchaseCreditsInput): Promise<PurchaseCreditsResult> {
  const userId = input.userId.trim();
  const amount = Math.trunc(Number(input.amount));
  const orderId = (input.orderId ?? '').trim() || null;
  const idempotencyKey = (input.idempotencyKey ?? '').trim() || null;
  const reason = (input.reason ?? '').trim() || null;

  if (!userId) return { ok: false, status: 400, error: 'userId required' };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, status: 400, error: 'amount must be positive' };
  if (idempotencyKey && idempotencyKey.length > 128) return { ok: false, status: 400, error: 'idempotencyKey too long' };

  const metaJson =
    input.metadata === undefined
      ? null
      : (() => {
          try {
            return JSON.stringify(input.metadata);
          } catch {
            return null;
          }
        })();

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (orderId) {
        const existingByOrder = await tx.creditLedger.findFirst({
          where: { userId, orderId, type: 'PURCHASE' },
          select: { balanceAfter: true },
        });
        if (existingByOrder) return { ok: true as const, already: true as const, balance: existingByOrder.balanceAfter };
      }

      if (idempotencyKey) {
        const existingByKey = await tx.creditLedger.findFirst({
          where: { userId, idempotencyKey },
          select: { balanceAfter: true },
        });
        if (existingByKey) return { ok: true as const, already: true as const, balance: existingByKey.balanceAfter };
      }

      const user = await tx.user.findUnique({ where: { id: userId }, select: { credits: true } });
      if (!user) return { ok: false as const, status: 404 as const, error: 'User not found' };

      const newBalance = user.credits + amount;
      await tx.user.update({ where: { id: userId }, data: { credits: newBalance } });

      await tx.creditLedger.create({
        data: {
          userId,
          orderId,
          changeAmount: amount,
          type: 'PURCHASE',
          balanceAfter: newBalance,
          note: reason,
          idempotencyKey,
          metadata: metaJson,
        },
      });

      return { ok: true as const, already: false as const, balance: newBalance };
    });

    return result;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      // Unique constraint (orderId,type) or (userId,idempotencyKey)
      const existing = await prisma.creditLedger.findFirst({
        where: {
          userId,
          ...(orderId ? { orderId, type: 'PURCHASE' } : {}),
          ...(idempotencyKey ? { idempotencyKey } : {}),
        } as any,
        select: { balanceAfter: true },
      });
      if (existing) return { ok: true, already: true, balance: existing.balanceAfter };
    }
    console.error('purchaseCredits failed:', e);
    return { ok: false, status: 500, error: 'Failed to purchase' };
  }
}

export async function deductCredits(input: DeductCreditsInput): Promise<DeductCreditsResult> {
  const userId = input.userId.trim();
  const amount = Math.trunc(Number(input.amount));
  const idempotencyKey = String(input.idempotencyKey ?? '').trim();
  const reason = (input.reason ?? '').trim() || null;

  if (!userId) return { ok: false, status: 400, error: 'userId required' };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, status: 400, error: 'amount must be positive' };
  if (!idempotencyKey) return { ok: false, status: 400, error: 'idempotencyKey required' };
  if (idempotencyKey.length > 128) return { ok: false, status: 400, error: 'idempotencyKey too long' };

  const metaJson =
    input.metadata === undefined
      ? null
      : (() => {
          try {
            return JSON.stringify(input.metadata);
          } catch {
            return null;
          }
        })();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.creditLedger.findFirst({
        where: { userId, idempotencyKey },
        select: { balanceAfter: true },
      });
      if (existing) return { ok: true as const, already: true as const, balance: existing.balanceAfter };

      const user = await tx.user.findUnique({ where: { id: userId }, select: { credits: true } });
      if (!user) return { ok: false as const, status: 404 as const, error: 'User not found' };

      const newBalance = user.credits - amount;
      if (newBalance < 0) {
        return { ok: false as const, status: 409 as const, error: 'Insufficient credits', balance: user.credits };
      }

      await tx.user.update({ where: { id: userId }, data: { credits: newBalance } });

      try {
        await tx.creditLedger.create({
          data: {
            userId,
            changeAmount: -amount,
            type: 'DEDUCTION',
            balanceAfter: newBalance,
            note: reason,
            idempotencyKey,
            metadata: metaJson,
          },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          const again = await tx.creditLedger.findFirst({
            where: { userId, idempotencyKey },
            select: { balanceAfter: true },
          });
          return { ok: true as const, already: true as const, balance: again?.balanceAfter ?? newBalance };
        }
        throw e;
      }

      return { ok: true as const, already: false as const, balance: newBalance };
    });

    return result;
  } catch (e) {
    console.error('deductCredits failed:', e);
    return { ok: false, status: 500, error: 'Failed to deduct' };
  }
}

export type RefundCreditsInput = {
  userId: string;
  amount: number; // positive integer credits
  idempotencyKey: string;
  reason?: string | null;
  originalLedgerId?: string | null;
  metadata?: unknown;
};

export type RefundCreditsResult = DeductCreditsResult;

export async function refundCredits(input: RefundCreditsInput): Promise<RefundCreditsResult> {
  const userId = input.userId.trim();
  const amount = Math.trunc(Number(input.amount));
  const idempotencyKey = String(input.idempotencyKey ?? '').trim();
  const reason = (input.reason ?? '').trim() || null;
  const originalLedgerId = (input.originalLedgerId ?? '').trim() || null;

  if (!userId) return { ok: false, status: 400, error: 'userId required' };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, status: 400, error: 'amount must be positive' };
  if (!idempotencyKey) return { ok: false, status: 400, error: 'idempotencyKey required' };
  if (idempotencyKey.length > 128) return { ok: false, status: 400, error: 'idempotencyKey too long' };

  const metaJson =
    input.metadata === undefined
      ? null
      : (() => {
          try {
            return JSON.stringify(input.metadata);
          } catch {
            return null;
          }
        })();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Idempotency: same key => no double refund.
      const existing = await tx.creditLedger.findFirst({
        where: { userId, idempotencyKey },
        select: { balanceAfter: true },
      });
      if (existing) return { ok: true as const, already: true as const, balance: existing.balanceAfter };

      // Optional: prevent refunding the same deduction twice.
      let original: { id: string; userId: string; type: string; changeAmount: number } | null = null;
      if (originalLedgerId) {
        original = await tx.creditLedger.findUnique({
          where: { id: originalLedgerId },
          select: { id: true, userId: true, type: true, changeAmount: true },
        });
        if (!original) return { ok: false as const, status: 404 as const, error: 'Original ledger not found' };
        if (original.userId !== userId) {
          return { ok: false as const, status: 409 as const, error: 'Original ledger belongs to another user' };
        }
        if (original.type !== 'DEDUCTION' || original.changeAmount >= 0) {
          return { ok: false as const, status: 409 as const, error: 'Original ledger is not a deduction' };
        }
        const maxRefund = Math.abs(original.changeAmount);
        if (amount > maxRefund) {
          return { ok: false as const, status: 409 as const, error: 'Refund exceeds original deduction' };
        }
        const alreadyRefunded = await tx.creditLedger.findFirst({
          where: { originalLedgerId: original.id, type: 'DEDUCTION_REVERSAL' },
          select: { id: true },
        });
        if (alreadyRefunded) {
          return { ok: true as const, already: true as const, balance: (await tx.user.findUnique({
            where: { id: userId },
            select: { credits: true },
          }))?.credits ?? 0 };
        }
      }

      const user = await tx.user.findUnique({ where: { id: userId }, select: { credits: true } });
      if (!user) return { ok: false as const, status: 404 as const, error: 'User not found' };

      const newBalance = user.credits + amount;
      await tx.user.update({ where: { id: userId }, data: { credits: newBalance } });

      try {
        await tx.creditLedger.create({
          data: {
            userId,
            originalLedgerId,
            changeAmount: amount,
            type: 'DEDUCTION_REVERSAL',
            balanceAfter: newBalance,
            note: reason,
            idempotencyKey,
            metadata: metaJson,
          },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          const again = await tx.creditLedger.findFirst({
            where: { userId, idempotencyKey },
            select: { balanceAfter: true },
          });
          return { ok: true as const, already: true as const, balance: again?.balanceAfter ?? newBalance };
        }
        throw e;
      }

      return { ok: true as const, already: false as const, balance: newBalance };
    });

    return result;
  } catch (e) {
    console.error('refundCredits failed:', e);
    return { ok: false, status: 500, error: 'Failed to refund' };
  }
}


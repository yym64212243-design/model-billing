import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export default async function AdminLedgerPage() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Ledger</h1>
        <p className="mt-2 text-sm text-red-600">Forbidden</p>
      </div>
    );
  }

  const items = await prisma.creditLedger.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { email: true } } },
    take: 200,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Credit ledger</h1>
        <p className="mt-1 text-sm text-gray-600">Latest 200 balance changes.</p>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Manual usage reversal (test)</h2>
        <p className="mt-1 text-xs text-gray-500">
          Creates a <span className="font-mono">DEDUCTION_REVERSAL</span> ledger entry and increases balance. Uses
          idempotencyKey to avoid duplicates.
        </p>
        <form action="/api/admin/credits/refund" method="post" className="mt-4 flex flex-wrap gap-2">
          <input
            name="userId"
            placeholder="userId (cmm...)"
            className="w-72 rounded-xl border border-gray-200 px-3 py-2 text-sm"
            required
          />
          <input
            name="amount"
            type="number"
            step="1"
            placeholder="amount (e.g. 10)"
            className="w-40 rounded-xl border border-gray-200 px-3 py-2 text-sm"
            required
          />
          <input
            name="idempotencyKey"
            placeholder="idempotencyKey (e.g. refund-001)"
            className="w-56 rounded-xl border border-gray-200 px-3 py-2 text-sm"
            required
          />
          <input
            name="reason"
            placeholder="reason (optional)"
            className="w-56 rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            name="originalLedgerId"
            placeholder="originalLedgerId (optional)"
            className="w-72 rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            Refund
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="divide-y divide-gray-100">
          {items.length === 0 && <div className="p-6 text-sm text-gray-500">No ledger entries.</div>}
          {items.map((x) => (
            <div key={x.id} className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                    {x.type}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {x.changeAmount >= 0 ? '+' : ''}
                    {x.changeAmount.toLocaleString()} → {x.balanceAfter.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {x.user.email} · user <span className="font-mono">{x.userId}</span>
                  {x.orderId ? (
                    <>
                      {' '}
                      · order <span className="font-mono">{x.orderId}</span>
                    </>
                  ) : null}{' '}
                  · {x.createdAt.toLocaleString()}
                </div>
              </div>
              <div className="text-xs text-gray-500 font-mono">{x.id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


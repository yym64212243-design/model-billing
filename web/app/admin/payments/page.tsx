import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export default async function AdminPaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <h1 className="text-xl font-semibold text-gray-900">Admin</h1>
          <p className="mt-2 text-sm text-red-600">Forbidden</p>
        </div>
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { status: 'PENDING', paymentMethod: 'MANUAL' },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { email: true } } },
    take: 200,
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manual payments</h1>
          <p className="mt-1 text-sm text-gray-600">
            Pending orders. Confirming will add credits to the user.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="divide-y divide-gray-100">
            {orders.length === 0 && (
              <div className="p-6 text-sm text-gray-500">No pending orders.</div>
            )}
            {orders.map((o) => (
              <form
                key={o.id}
                action={`/api/admin/manual-payments/${o.id}/confirm`}
                method="post"
                className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-xs text-gray-600">{o.reference ?? '-'}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${(o.currency.toLowerCase() === 'aud' ? o.amount / 100 : o.amount / 100).toFixed(2)}{' '}
                      {o.currency} → {o.credits.toLocaleString()} credits
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Order: <span className="font-mono">{o.id}</span> · User: {o.user.email} · Plan:{' '}
                    {o.planId} · {o.createdAt.toLocaleString()}
                  </div>
                </div>
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  Confirm received
                </button>
              </form>
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Admin access is controlled by <span className="font-mono">ADMIN_EMAILS</span>.
        </p>
      </div>
    </div>
  );
}


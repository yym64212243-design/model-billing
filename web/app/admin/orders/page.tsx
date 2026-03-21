import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: { status?: string; method?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
        <p className="mt-2 text-sm text-red-600">Forbidden</p>
      </div>
    );
  }

  const status = searchParams?.status?.toUpperCase();
  const method = searchParams?.method?.toUpperCase();

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(method ? { paymentMethod: method as any } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { email: true } }, plan: { select: { name: true } } },
    take: 200,
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-600">Latest 200 orders. Filter by status/method.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/orders" className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50">
            All
          </Link>
          <Link
            href="/admin/orders?status=pending"
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50"
          >
            Pending
          </Link>
          <Link
            href="/admin/orders?status=paid"
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50"
          >
            Paid
          </Link>
          <Link
            href="/admin/orders?method=manual"
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50"
          >
            Manual
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="divide-y divide-gray-100">
          {orders.length === 0 && <div className="p-6 text-sm text-gray-500">No orders.</div>}
          {orders.map((o) => (
            <div key={o.id} className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                    {o.status}
                    {o.refundedCredits > 0 ? ' · REFUNDED' : ''}
                  </span>
                  <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                    {o.paymentMethod}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {(o.amount / 100).toFixed(2)} {o.currency} → {o.credits.toLocaleString()} credits
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  <span className="font-mono">{o.id}</span> · {o.user.email} · {o.planId} ({o.plan.name}) ·{' '}
                  {o.createdAt.toLocaleString()}
                  {o.reference ? ` · ref ${o.reference}` : ''}
                </div>
              </div>

              {o.status === 'PENDING' ? (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <form action={`/api/admin/orders/${o.id}/mark-paid`} method="post">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                    >
                      Mark paid + credit
                    </button>
                  </form>
                  <form action={`/api/admin/orders/${o.id}/mark-failed`} method="post">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                    >
                      Mark failed
                    </button>
                  </form>
                  <form action={`/api/admin/orders/${o.id}/mark-cancelled`} method="post">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <div className="text-xs text-gray-500">{o.paidAt ? `Paid at ${o.paidAt.toLocaleString()}` : ''}</div>
                  {o.status === 'PAID' && Math.max(0, o.credits - (o.refundedCredits ?? 0)) > 0 ? (
                    <form action={`/api/admin/orders/${o.id}/refund`} method="post">
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        Refund order
                      </button>
                    </form>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


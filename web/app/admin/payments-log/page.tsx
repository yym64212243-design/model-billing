import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

function safePreview(s: string | null, max = 180) {
  if (!s) return '';
  const oneLine = s.replace(/\s+/g, ' ').trim();
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine;
}

export default async function AdminPaymentsLogPage({
  searchParams,
}: {
  searchParams?: { provider?: string; status?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Payments</h1>
        <p className="mt-2 text-sm text-red-600">Forbidden</p>
      </div>
    );
  }

  const provider = searchParams?.provider?.toUpperCase();
  const status = searchParams?.status?.toUpperCase();

  const payments = await prisma.payment.findMany({
    where: {
      ...(provider ? { provider } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          paymentMethod: true,
          amount: true,
          currency: true,
          credits: true,
          createdAt: true,
          user: { select: { email: true } },
        },
      },
    },
    take: 300,
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-600">Latest 300 payment events (audit log).</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/admin/payments-log"
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50"
          >
            All
          </Link>
          <Link
            href="/admin/payments-log?status=pending"
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50"
          >
            Pending
          </Link>
          <Link
            href="/admin/payments-log?status=succeeded"
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50"
          >
            Succeeded
          </Link>
          <Link
            href="/admin/payments-log?status=failed"
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50"
          >
            Failed
          </Link>
          <Link
            href="/admin/payments-log?provider=manual"
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50"
          >
            Manual
          </Link>
          <Link
            href="/admin/payments-log?provider=stripe"
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50"
          >
            Stripe
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="divide-y divide-gray-100">
          {payments.length === 0 && <div className="p-6 text-sm text-gray-500">No payment records.</div>}
          {payments.map((p) => (
            <div key={p.id} className="flex flex-col gap-2 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                  {p.status}
                </span>
                <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                  {p.provider}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {(p.order.amount / 100).toFixed(2)} {p.order.currency} · {p.order.credits.toLocaleString()} credits
                </span>
                <span className="text-xs text-gray-500">· {p.createdAt.toLocaleString()}</span>
              </div>

              <div className="text-xs text-gray-500">
                User: {p.order.user.email} · Order:{' '}
                <span className="font-mono">{p.order.id}</span> · orderStatus {p.order.status} · method{' '}
                {p.order.paymentMethod}
              </div>

              {p.providerTradeNo ? (
                <div className="text-xs text-gray-500">
                  providerTradeNo: <span className="font-mono">{p.providerTradeNo}</span>
                </div>
              ) : null}

              {p.providerPayload ? (
                <div className="text-xs text-gray-500">
                  payload: <span className="font-mono">{safePreview(p.providerPayload)}</span>
                </div>
              ) : null}

              <div className="text-[11px] text-gray-400 font-mono">{p.id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


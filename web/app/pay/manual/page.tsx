'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type OrderInfo = {
  id: string;
  planId: string;
  amountAUD: number;
  credits: number;
  status: 'PENDING' | 'PAID' | 'REJECTED' | string;
  memo: string;
  createdAt: string;
  confirmedAt: string | null;
};

function ManualPayContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const orderId = sp.get('order');
  const returnUrl = sp.get('return_url');

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const alipayQr = process.env.NEXT_PUBLIC_ALIPAY_QR_URL ?? '';
  const wechatQr = process.env.NEXT_PUBLIC_WECHAT_QR_URL ?? '';

  const pollUrl = useMemo(() => {
    if (!orderId) return null;
    return `/api/manual-payments/${encodeURIComponent(orderId)}`;
  }, [orderId]);

  useEffect(() => {
    if (!pollUrl) return;
    let stopped = false;
    const tick = async () => {
      try {
        const res = await fetch(pollUrl, { cache: 'no-store' });
        const data = (await res.json()) as any;
        if (!res.ok) throw new Error(data.error ?? 'Failed to load order');
        if (stopped) return;
        setOrder(data);
        setError(null);
        if (data.status === 'PAID') {
          const qs = new URLSearchParams({ order: data.id });
          if (returnUrl) qs.set('return_url', returnUrl);
          router.replace(`/success?${qs.toString()}`);
          return;
        }
      } catch (e) {
        if (stopped) return;
        setError(e instanceof Error ? e.message : 'Failed to load order');
      }
      if (!stopped) window.setTimeout(tick, 2000);
    };
    tick();
    return () => {
      stopped = true;
    };
  }, [pollUrl, returnUrl, router]);

  if (!orderId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <h1 className="text-xl font-semibold text-gray-900">Manual payment</h1>
          <p className="mt-2 text-sm text-gray-600">Missing order id.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900">Pay with QR code</h1>
        <p className="mt-2 text-sm text-gray-600">
          Transfer the exact amount using Alipay or WeChat. Put the <span className="font-semibold">memo</span> in the payment note.
          After you pay, we will confirm manually and your credits will be added.
        </p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {order && (
          <div className="mt-6 grid gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-gray-500">Order</p>
              <p className="font-mono text-sm text-gray-900">{order.id}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Status</p>
              <p className="text-sm font-semibold text-gray-900">{order.status}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Amount</p>
              <p className="text-sm font-semibold text-gray-900">${order.amountAUD} AUD</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Credits</p>
              <p className="text-sm font-semibold text-gray-900">{order.credits.toLocaleString()} Credits</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-gray-500">Memo (must include)</p>
              <p className="mt-1 inline-flex rounded-lg bg-white px-3 py-2 font-mono text-sm font-semibold text-gray-900 ring-1 ring-gray-200">
                {order.memo}
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900">Alipay</h2>
            {alipayQr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={alipayQr} alt="Alipay QR" className="mt-4 w-full rounded-xl" />
            ) : (
              <div className="mt-4 flex aspect-square w-full items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">
                Set <span className="mx-1 font-mono">NEXT_PUBLIC_ALIPAY_QR_URL</span> to show QR
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900">WeChat Pay</h2>
            {wechatQr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={wechatQr} alt="WeChat QR" className="mt-4 w-full rounded-xl" />
            ) : (
              <div className="mt-4 flex aspect-square w-full items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">
                Set <span className="mx-1 font-mono">NEXT_PUBLIC_WECHAT_QR_URL</span> to show QR
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          This page auto-refreshes your order status. Once confirmed, you will be redirected to the success page.
        </div>
      </div>
    </div>
  );
}

export default function ManualPayPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
        <ManualPayContent />
      </Suspense>
    </div>
  );
}


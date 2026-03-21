'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, Suspense, useEffect, useState } from 'react';

type SessionInfo = {
  planName: string;
  credits: number;
  paymentStatus: string;
};

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order');
  const returnUrl = searchParams.get('return_url');
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(!!sessionId || !!orderId);

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data: SessionInfo) => setSessionInfo(data))
        .catch(() => setSessionInfo(null))
        .finally(() => setLoading(false));
      return;
    }
    if (orderId) {
      fetch(`/api/orders/${encodeURIComponent(orderId)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data: { credits: number; status?: string; paymentMethod?: string }) =>
          setSessionInfo({
            planName: data.paymentMethod ? `${data.paymentMethod} payment` : 'Order payment',
            credits: data.credits ?? 0,
            paymentStatus: (data.status ?? 'pending').toLowerCase(),
          })
        )
        .catch(() => setSessionInfo(null))
        .finally(() => setLoading(false));
    }
  }, [sessionId, orderId]);

  const handleBackToApp = useCallback(() => {
    if (returnUrl && returnUrl.startsWith('http')) {
      window.location.href = returnUrl;
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/billing';
    }
  }, [returnUrl]);

  const isPaid = sessionInfo?.paymentStatus === 'paid' || sessionInfo?.paymentStatus === 'succeeded';
  const isPending = sessionInfo?.paymentStatus === 'pending';

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg text-center">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
            isPaid ? 'bg-green-100' : isPending ? 'bg-amber-100' : 'bg-gray-200'
          }`}
        >
          <svg
            className={`h-8 w-8 ${isPaid ? 'text-green-600' : isPending ? 'text-amber-600' : 'text-gray-600'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          {isPaid ? 'Payment successful' : isPending ? 'Payment pending confirmation' : 'Payment status updated'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isPaid
            ? 'Your credits have been added. You can now return to your app to continue.'
            : isPending
            ? 'Your payment is being processed. Credits will appear after confirmation.'
            : 'Please check your balance. If needed, contact support.'}
        </p>
        {loading && (
          <div className="mt-6 text-sm text-gray-500">Loading order details...</div>
        )}
        {!loading && sessionInfo && (
          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left">
            <p className="text-sm font-medium text-gray-500">Purchased</p>
            <p className="font-semibold text-gray-900">
              {sessionInfo.planName} — {sessionInfo.credits.toLocaleString()} Credits
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={handleBackToApp}
          className="mt-8 w-full rounded-xl bg-primary-600 py-3 font-semibold text-white transition hover:bg-primary-700"
        >
          Return to app
        </button>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}

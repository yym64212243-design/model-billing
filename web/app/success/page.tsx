'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, Suspense, useEffect, useState } from 'react';
import ErrorNotice from '@/components/ErrorNotice';
import { fetchJsonOrThrow, getErrorMessage } from '@/lib/client-api';

type SessionInfo = {
  planName: string;
  credits: number;
  paymentStatus: string;
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order');
  const returnUrl = searchParams.get('return_url');
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(!!sessionId || !!orderId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId && !orderId) {
      setLoading(false);
      return;
    }

    if (sessionId) {
      fetchJsonOrThrow<SessionInfo>(
        `/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`,
        undefined,
        'Failed to load checkout details.'
      )
        .then((data) => {
          setSessionInfo(data);
          setError(null);
        })
        .catch((err) => {
          setSessionInfo(null);
          setError(getErrorMessage(err, 'Failed to load checkout details.'));
        })
        .finally(() => setLoading(false));
      return;
    }
    if (orderId) {
      fetchJsonOrThrow<{ credits: number }>(
        `/api/manual-payments/${encodeURIComponent(orderId)}`,
        undefined,
        'Failed to load manual payment details.'
      )
        .then((data) => {
          setSessionInfo({ planName: 'Manual payment', credits: data.credits ?? 0, paymentStatus: 'paid' });
          setError(null);
        })
        .catch((err) => {
          setSessionInfo(null);
          setError(getErrorMessage(err, 'Failed to load manual payment details.'));
        })
        .finally(() => setLoading(false));
    }
  }, [sessionId, orderId]);

  const handleBackToModelBilling = useCallback(() => {
    if (returnUrl && returnUrl.startsWith('http')) {
      window.location.href = returnUrl;
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/openclaw';
    }
  }, [returnUrl]);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
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
        <h1 className="mt-6 text-2xl font-bold text-gray-900">Payment successful</h1>
        <p className="mt-2 text-gray-600">
          Your credits have been added. You can now return to ModelBilling to continue.
        </p>
        {loading && (
          <div className="mt-6 text-sm text-gray-500">Loading order details...</div>
        )}
        {!loading && error && (
          <div className="mt-6 text-left">
            <ErrorNotice
              title="Order details unavailable"
              message={error}
            />
          </div>
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
          onClick={handleBackToModelBilling}
          className="mt-8 w-full rounded-xl bg-primary-600 py-3 font-semibold text-white transition hover:bg-primary-700"
        >
          Return to ModelBilling
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

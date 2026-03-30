'use client';

import { useState, useEffect, useCallback } from 'react';
import PricingCard, { type PaymentToggles } from '@/components/PricingCard';
import type { PlanId, PlanItem } from '@/lib/constants';

interface PricingSectionProps {
  returnUrl?: string | null;
}

type QrModalState = {
  orderId: string;
  qrSrc: string;
  credits: number;
  title: string;
} | null;

const defaultPayments: PaymentToggles = { zpay: false, alipayPage: false, alipayScan: false };

export default function PricingSection({ returnUrl }: PricingSectionProps) {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [qrModal, setQrModal] = useState<QrModalState>(null);
  const [payments, setPayments] = useState<PaymentToggles>(defaultPayments);

  useEffect(() => {
    fetch('/api/plans')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load plans'))))
      .then((data: PlanItem[]) => {
        setPlans(data);
        setError(null);
      })
      .catch(() => setError('Could not load plans'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/payment-options', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('options'))))
      .then((data: PaymentToggles) => {
        setPayments({
          zpay: Boolean(data.zpay),
          alipayPage: Boolean(data.alipayPage),
          alipayScan: Boolean(data.alipayScan),
        });
      })
      .catch(() => setPayments(defaultPayments));
  }, []);

  const handleAlipayPage = async (planId: PlanId) => {
    try {
      setBusy(true);
      const res = await fetch('/api/checkout/alipay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          returnUrl: returnUrl ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create Alipay order');
      if (typeof data.payUrl === 'string' && data.payUrl.length > 0) {
        window.location.href = data.payUrl;
        return;
      }
      throw new Error('No Alipay pay url');
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to create Alipay order');
    } finally {
      setBusy(false);
    }
  };

  const handleAlipayScan = async (planId: PlanId) => {
    try {
      setBusy(true);
      const res = await fetch('/api/checkout/alipay/precreate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create QR code');
      setQrModal({
        orderId: data.orderId,
        qrSrc: data.qrDataUrl,
        credits: data.credits,
        title: '请使用支付宝扫码支付',
      });
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to create Alipay QR');
    } finally {
      setBusy(false);
    }
  };

  const handleZpayRedirect = async (planId: PlanId) => {
    try {
      setBusy(true);
      const res = await fetch('/api/checkout/zpay/submit-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, type: 'alipay' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to start ZPAY');
      if (typeof data.action === 'string' && data.action.length > 0) {
        window.location.href = data.action;
        return;
      }
      throw new Error('No ZPAY URL');
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'ZPAY failed');
    } finally {
      setBusy(false);
    }
  };

  const handleZpayQr = async (planId: PlanId) => {
    try {
      setBusy(true);
      const res = await fetch('/api/checkout/zpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, type: 'alipay' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'ZPAY 下单失败');
      const payurl = typeof data.payurl === 'string' ? data.payurl.trim() : '';
      const qrSrc = (data.qrImageUrl || data.qrDataUrl) as string | null;
      if (!qrSrc && payurl) {
        window.location.href = payurl;
        return;
      }
      if (!qrSrc) throw new Error('ZPAY 未返回二维码或跳转链接');
      setQrModal({
        orderId: data.orderId,
        qrSrc,
        credits: data.credits,
        title: '请使用支付宝扫码（ZPAY）',
      });
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'ZPAY failed');
    } finally {
      setBusy(false);
    }
  };

  const closeModal = () => setQrModal(null);

  const pollPaid = useCallback(async () => {
    if (!qrModal) return false;
    const res = await fetch(`/api/orders/${encodeURIComponent(qrModal.orderId)}`, { cache: 'no-store' });
    if (!res.ok) return false;
    const data = (await res.json()) as { status?: string };
    return data.status === 'PAID';
  }, [qrModal]);

  useEffect(() => {
    if (!qrModal) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      try {
        const paid = await pollPaid();
        if (paid && !cancelled) {
          const u = new URL('/success', window.location.origin);
          u.searchParams.set('order', qrModal.orderId);
          if (returnUrl) u.searchParams.set('return_url', returnUrl);
          window.location.href = u.toString();
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) window.setTimeout(tick, 2500);
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [qrModal, returnUrl, pollPaid]);

  if (loading) {
    return <div className="mt-6 text-center text-gray-500">Loading plans...</div>;
  }
  if (error || plans.length === 0) {
    return (
      <div className="mt-6 text-center text-red-600">
        {error ?? 'No plans available'}
      </div>
    );
  }

  const noPayments = !payments.zpay && !payments.alipayPage && !payments.alipayScan;

  return (
    <>
      {noPayments && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          未配置支付：请在环境变量中设置 ZPAY（ZPAY_PID / ZPAY_KEY）或支付宝（ALIPAY_APP_ID 等）。
        </p>
      )}
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            payments={payments}
            busy={busy}
            onZpayRedirect={handleZpayRedirect}
            onZpayQr={handleZpayQr}
            onAlipayPage={handleAlipayPage}
            onAlipayScan={handleAlipayScan}
          />
        ))}
      </div>

      {qrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-qr-title"
        >
          <div className="max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="pay-qr-title" className="text-lg font-semibold text-gray-900">
              {qrModal.title}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              支付成功后页面会自动跳转；积分以服务端异步通知为准（请确保 notify 公网可达）。
            </p>
            <p className="mt-2 text-xs text-gray-500">
              订单：{qrModal.orderId} · {qrModal.credits.toLocaleString()} credits
            </p>
            <div className="mt-4 flex justify-center rounded-xl bg-gray-50 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrModal.qrSrc} alt="Payment QR" className="h-56 w-56" />
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="mt-4 w-full rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  );
}

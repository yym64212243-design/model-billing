import { Suspense } from 'react';
import BillingBanner from '@/components/BillingBanner';
import SourceBadge from '@/components/SourceBadge';
import UserHeader from '@/components/UserHeader';
import PricingSection from './PricingSection';
import UsageDemoPanel from './UsageDemoPanel';

type SearchParams = {
  source?: string;
  host?: string;
  path?: string;
  return_url?: string;
};

export default function BillingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const source = searchParams.source ?? null;
  const host = searchParams.host ?? null;
  const path = searchParams.path ?? null;
  const returnUrl =
    searchParams.return_url ??
    (host && path ? `https://${host}${path}` : null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <BillingBanner />
          <UserHeader />
        </div>
        <SourceBadge source={source} host={host} path={path} />

        <header className="mt-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Model credits
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            Top up credits for ChatGPT, Claude, Gemini, and other AI tools. Choose a plan below and
            complete payment to get your credits.
          </p>
        </header>

        <div className="mt-10">
          <UsageDemoPanel />
        </div>

        <section className="mt-12">
          <h2 className="text-center text-lg font-semibold text-gray-800">Choose a plan</h2>
          <Suspense fallback={<div className="mt-6 text-center text-gray-500">Loading...</div>}>
            <PricingSection returnUrl={returnUrl} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

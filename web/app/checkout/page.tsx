'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/billing');
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-gray-500">Redirecting to plan selection...</p>
    </div>
  );
}

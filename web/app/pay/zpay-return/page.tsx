import Link from 'next/link';

export default function ZpayReturnPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold text-gray-900">支付结果</h1>
      <p className="mt-3 text-sm text-gray-600">
        若您已完成付款，积分将在平台异步通知确认后到账；请勿重复支付。您可返回账单页查看余额。
      </p>
      <Link
        href="/billing"
        className="mt-6 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
      >
        返回账单
      </Link>
    </div>
  );
}

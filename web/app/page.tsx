import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Model Billing Bridge — 多模型 AI 积分充值',
  description:
    '面向 ChatGPT、Claude、Gemini 等场景的第三方积分充值与余额管理网页应用，支持支付宝安全支付。',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary-600 px-2 py-1 text-sm font-bold text-white">
              MBB
            </span>
            <span className="font-semibold text-slate-800">Model Billing Bridge</span>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm sm:gap-3">
            <Link href="/login" className="text-slate-600 hover:text-primary-700">
              登录
            </Link>
            <Link href="/register" className="text-slate-600 hover:text-primary-700">
              注册
            </Link>
            <Link
              href="/billing"
              className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-primary-700"
            >
              进入充值
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
            Multi-model · Secure payment
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            多模型 AI 积分充值与余额管理
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            在浏览器中完成安全支付，积分到账后可返回原网页继续使用。支持通过扩展从常用 AI
            页面一键打开本站，无需修改各产品官方客户端。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/billing"
              className="inline-flex rounded-xl bg-primary-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700"
            >
              立即充值
            </Link>
            <Link
              href="/register"
              className="inline-flex rounded-xl border border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-800 hover:bg-slate-50"
            >
              创建账号
            </Link>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-14">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-center text-xl font-bold text-slate-900 sm:text-2xl">核心能力</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 text-left shadow-sm">
                <div className="text-2xl">💳</div>
                <h3 className="mt-3 font-semibold text-slate-900">支付宝支付</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  使用支付宝完成付款，支付结果以服务端通知为准，到账后更新账户积分余额。
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 text-left shadow-sm">
                <div className="text-2xl">🔗</div>
                <h3 className="mt-3 font-semibold text-slate-900">返回来源页</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  支持携带来源地址，支付流程结束后可回到您发起充值的网页，减少切换成本。
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 text-left shadow-sm">
                <div className="text-2xl">🧩</div>
                <h3 className="mt-3 font-semibold text-slate-900">多场景接入</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  面向多种大模型与网页工具的使用场景，以统一账户管理积分，具体可用范围以站内说明为准。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <h2 className="text-center text-xl font-bold text-slate-900 sm:text-2xl">使用方式</h2>
          <ol className="mx-auto mt-8 max-w-2xl list-decimal space-y-4 pl-5 text-slate-700">
            <li>注册并登录本站账户。</li>
            <li>进入充值页选择套餐，跳转支付宝完成支付。</li>
            <li>支付成功后积分入账，可在本站查看余额与流水；若从扩展进入，可返回原页面。</li>
          </ol>
        </section>

        <section className="border-t border-slate-200 bg-white py-12">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-lg font-semibold text-slate-900">安全与说明</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              支付环节由支付宝处理，本站不收集您的支付宝支付密码。本产品为第三方网页应用，不提供各 AI
              厂商官方代扣或官方订阅代理服务；积分与套餐规则以本站公示为准。
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-100/80 py-8">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-slate-500 sm:px-6">
          <p className="font-medium text-slate-600">Model Billing Bridge</p>
          <p className="mt-2">
            应用官网用于产品说明与入口展示。部署后请将本站根地址（https://您的域名/）填入开放平台「应用官网」字段。
          </p>
        </div>
      </footer>
    </div>
  );
}

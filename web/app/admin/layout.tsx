import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const allowed = isAdmin(session);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/orders" className="text-sm font-semibold text-gray-900">
              Admin
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/admin/orders" className="text-gray-700 hover:text-gray-900">
                Orders
              </Link>
              <Link href="/admin/users" className="text-gray-700 hover:text-gray-900">
                Users
              </Link>
              <Link href="/admin/ledger" className="text-gray-700 hover:text-gray-900">
                Ledger
              </Link>
              <Link href="/admin/payments-log" className="text-gray-700 hover:text-gray-900">
                Payments
              </Link>
              <Link href="/admin/payments" className="text-gray-700 hover:text-gray-900">
                Manual confirm
              </Link>
            </nav>
          </div>
          <div className="text-xs text-gray-500">
            {allowed ? session?.user?.email : 'Forbidden'}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}


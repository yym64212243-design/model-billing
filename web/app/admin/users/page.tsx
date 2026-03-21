import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Users</h1>
        <p className="mt-2 text-sm text-red-600">Forbidden</p>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, credits: true, createdAt: true },
    take: 200,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-gray-600">Latest 200 users. Adjust credits manually.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="divide-y divide-gray-100">
          {users.length === 0 && <div className="p-6 text-sm text-gray-500">No users.</div>}
          {users.map((u) => (
            <div key={u.id} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">{u.email}</div>
                <div className="mt-1 text-xs text-gray-500">
                  <span className="font-mono">{u.id}</span> · created {u.createdAt.toLocaleString()}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                <div className="text-sm font-semibold text-gray-900">{u.credits.toLocaleString()} credits</div>
                <form
                  action={`/api/admin/users/${u.id}/adjust`}
                  method="post"
                  className="flex flex-wrap items-center gap-2"
                >
                  <input
                    name="amount"
                    type="number"
                    step="1"
                    placeholder="+100 / -50"
                    className="w-32 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    required
                  />
                  <input
                    name="note"
                    type="text"
                    placeholder="note (optional)"
                    className="w-56 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                  >
                    Adjust
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


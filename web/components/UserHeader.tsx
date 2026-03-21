'use client';

import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';

export default function UserHeader() {
  const { data: session, status } = useSession();

  if (status !== 'authenticated' || !session?.user) return null;

  return (
    <div className="flex items-center justify-end gap-3 text-sm">
      <span className="text-gray-600">
        Signed in as <span className="font-medium text-gray-900">{session.user.email}</span>
      </span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/' })}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 transition hover:bg-gray-50"
      >
        Sign out
      </button>
    </div>
  );
}

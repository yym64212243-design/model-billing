import type { Session } from 'next-auth';

export function isAdmin(session: Session | null | undefined): boolean {
  const email = session?.user?.email ?? null;
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}


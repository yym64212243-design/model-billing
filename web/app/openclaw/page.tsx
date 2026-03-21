import { redirect } from 'next/navigation';

/** Legacy path; canonical route is `/billing`. */
export default function LegacyOpenClawRedirect() {
  redirect('/billing');
}

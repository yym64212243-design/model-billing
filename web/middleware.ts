import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
  pages: { signIn: '/login' },
});

export const config = {
  matcher: [
    '/billing',
    '/billing/:path*',
    '/openclaw',
    '/openclaw/:path*',
    '/checkout',
    '/checkout/:path*',
    '/admin',
    '/admin/:path*',
  ],
};

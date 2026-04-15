import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { gatewayErrorResponse, gatewayRequestJson } from '@/lib/gateway';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await gatewayRequestJson<unknown[]>(
      `/internal/usage/logs?user_id=${encodeURIComponent(session.user.id)}`,
      { errorMessage: 'Failed to load usage history.' }
    );
    return NextResponse.json({ logs: Array.isArray(data) ? data : [] });
  } catch (error) {
    return gatewayErrorResponse(error, 'Failed to load usage history.');
  }
}

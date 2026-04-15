import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { gatewayErrorResponse, gatewayRequestJson } from '@/lib/gateway';

type GatewayKeyRecord = {
  id: string;
  label?: string;
  created_at: string;
  expires_at?: string;
  revoked_at?: string;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await gatewayRequestJson<GatewayKeyRecord[]>(
      `/internal/keys/list?user_id=${encodeURIComponent(session.user.id)}`,
      { errorMessage: 'Failed to load API keys.' }
    );
    const keys = Array.isArray(data) ? data : [];
    const masked = keys.map((k) => ({
      id: k.id,
      label: k.label || '',
      created_at: k.created_at,
      expires_at: k.expires_at || null,
      revoked_at: k.revoked_at || null,
      prefix: k.id.slice(0, 8),
    }));
    return NextResponse.json({ keys: masked });
  } catch (error) {
    return gatewayErrorResponse(error, 'Failed to load API keys.');
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { label?: string };
    const data = await gatewayRequestJson<{ id: string; token: string }>('/internal/keys/create', {
      method: 'POST',
      body: JSON.stringify({
        user_id: session.user.id,
        label: body.label ?? '',
      }),
      errorMessage: 'Failed to create API key.',
    });
    return NextResponse.json({ id: data.id, token: data.token });
  } catch (error) {
    return gatewayErrorResponse(error, 'Failed to create API key.');
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }
    await gatewayRequestJson<{ ok: boolean }>('/internal/keys/revoke', {
      method: 'POST',
      body: JSON.stringify({ id: body.id }),
      errorMessage: 'Failed to revoke API key.',
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return gatewayErrorResponse(error, 'Failed to revoke API key.');
  }
}

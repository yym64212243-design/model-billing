import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { deductCredits, refundCredits } from '@/lib/credits';
import { getApiKeyFromRequest, verifyUserApiKey } from '@/lib/user-api-key';

function jsonError(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}

export async function POST(request: Request) {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (!openaiKey) return jsonError(503, 'OPENAI_API_KEY is not configured');

  const provided = getApiKeyFromRequest(request);
  if (!provided) return jsonError(401, 'Missing API key');

  const apiKey = await verifyUserApiKey(provided);
  if (!apiKey) return jsonError(401, 'Invalid API key');

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError(400, 'Invalid JSON body');
  }

  const model = typeof body.model === 'string' && body.model ? body.model : process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const messages = Array.isArray(body.messages) ? body.messages : null;
  if (!messages || messages.length === 0) return jsonError(400, 'messages is required');

  const creditsPerRequest = Math.max(1, Math.trunc(Number(process.env.OPENAI_CREDITS_PER_REQUEST ?? 10)));
  const reqId = request.headers.get('x-request-id')?.trim() || crypto.randomUUID();
  const idem = `openai:${apiKey.userId}:${reqId}`;

  const deduct = await deductCredits({
    userId: apiKey.userId,
    amount: creditsPerRequest,
    idempotencyKey: idem,
    reason: `OpenAI ${model}`,
    metadata: { model, requestId: reqId },
  });
  if (!deduct.ok) {
    const status = deduct.status === 409 ? 402 : deduct.status;
    return jsonError(status, deduct.error, { balance: deduct.balance ?? null });
  }

  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const upstreamPayload: Record<string, unknown> = { ...body, model };

  try {
    const upstream = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(upstreamPayload),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      if (!deduct.already) {
        await refundCredits({
          userId: apiKey.userId,
          amount: creditsPerRequest,
          idempotencyKey: `refund:${idem}`,
          reason: `OpenAI failed ${model}`,
          metadata: { model, requestId: reqId, upstreamStatus: upstream.status },
        });
      }
      return new Response(text, {
        status: upstream.status,
        headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json; charset=utf-8' },
      });
    }

    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json; charset=utf-8',
        'x-credits-balance': String(deduct.balance),
      },
    });
  } catch (e) {
    if (!deduct.already) {
      await refundCredits({
        userId: apiKey.userId,
        amount: creditsPerRequest,
        idempotencyKey: `refund:${idem}`,
        reason: `OpenAI network error ${model}`,
        metadata: { model, requestId: reqId },
      });
    }
    console.error('OpenAI proxy error:', e);
    return jsonError(502, 'Failed to call upstream model');
  }
}

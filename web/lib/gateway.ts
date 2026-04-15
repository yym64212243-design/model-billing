import { NextResponse } from 'next/server';
import { readErrorMessage } from '@/lib/http';

const DEFAULT_GATEWAY_INTERNAL_URL = 'http://localhost:8080';

type GatewayErrorCode =
  | 'gateway_config_error'
  | 'gateway_unreachable'
  | 'gateway_auth_error'
  | 'gateway_request_failed';

class GatewayRequestError extends Error {
  readonly status: number;
  readonly code: GatewayErrorCode;
  readonly originalCause?: unknown;

  constructor(message: string, status: number, code: GatewayErrorCode, originalCause?: unknown) {
    super(message);
    this.name = 'GatewayRequestError';
    this.status = status;
    this.code = code;
    this.originalCause = originalCause;
  }
}

type GatewayRequestOptions = RequestInit & {
  errorMessage?: string;
};

function getGatewayConfig() {
  const baseURL = (process.env.GATEWAY_INTERNAL_URL ?? DEFAULT_GATEWAY_INTERNAL_URL).trim();
  const internalAPIKey = (
    process.env.GATEWAY_INTERNAL_API_KEY ??
    process.env.BILLING_API_KEY ??
    ''
  ).trim();

  if (!baseURL) {
    throw new GatewayRequestError(
      'GATEWAY_INTERNAL_URL is not configured. Set it in web/.env and restart the web app.',
      500,
      'gateway_config_error'
    );
  }

  if (!internalAPIKey) {
    throw new GatewayRequestError(
      'GATEWAY_INTERNAL_API_KEY is not configured. Set it in web/.env and restart the web app.',
      500,
      'gateway_config_error'
    );
  }

  return {
    baseURL: baseURL.replace(/\/$/, ''),
    internalAPIKey,
  };
}

export async function gatewayRequest(
  path: string,
  { errorMessage = 'The OpenClaw gateway request failed.', ...init }: GatewayRequestOptions = {}
) {
  const { baseURL, internalAPIKey } = getGatewayConfig();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const headers = new Headers(init.headers);

  headers.set('Authorization', `Bearer ${internalAPIKey}`);
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${baseURL}${normalizedPath}`, {
      ...init,
      cache: 'no-store',
      headers,
    });
  } catch (error) {
    throw new GatewayRequestError(
      `OpenClaw gateway is unreachable at ${baseURL}. Start the gateway or update GATEWAY_INTERNAL_URL.`,
      502,
      'gateway_unreachable',
      error
    );
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new GatewayRequestError(
        'Portal could not authenticate with the OpenClaw gateway. Check that GATEWAY_INTERNAL_API_KEY matches the gateway configuration.',
        response.status,
        'gateway_auth_error'
      );
    }

    throw new GatewayRequestError(
      await readErrorMessage(response, errorMessage),
      response.status,
      'gateway_request_failed'
    );
  }

  return response;
}

export async function gatewayRequestJson<T>(
  path: string,
  options: GatewayRequestOptions = {}
): Promise<T> {
  const response = await gatewayRequest(path, options);
  return (await response.json()) as T;
}

export function gatewayErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof GatewayRequestError) {
    console.error(`[gateway] ${error.code}:`, error.originalCause ?? error);
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.status }
    );
  }

  console.error('[gateway] unexpected error:', error);
  return NextResponse.json(
    {
      error: fallbackMessage,
      code: 'gateway_request_failed',
    },
    { status: 500 }
  );
}

import { readErrorMessage } from '@/lib/http';

export async function fetchJsonOrThrow<T>(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  fallbackMessage: string
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(input, {
      cache: 'no-store',
      ...init,
    });
  } catch {
    throw new Error(fallbackMessage);
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallbackMessage));
  }

  return (await response.json()) as T;
}

export function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallbackMessage;
}

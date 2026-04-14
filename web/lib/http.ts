export async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const jsonResponse = response.clone();

  try {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = (await jsonResponse.json()) as { error?: unknown; message?: unknown };
      if (typeof data.error === 'string' && data.error.trim()) {
        return data.error.trim();
      }
      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message.trim();
      }
    }
  } catch {
    // Ignore parsing failures and fall back to text or the provided fallback.
  }

  try {
    const text = await response.text();
    if (text.trim()) {
      return text.trim();
    }
  } catch {
    // Ignore text parsing failures and return the fallback below.
  }

  return fallback;
}

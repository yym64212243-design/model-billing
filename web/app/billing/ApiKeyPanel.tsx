'use client';

import { useEffect, useState } from 'react';

type ApiKeyRecord = {
  id: string;
  name: string;
  keyPrefix: string;
  last4: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

type KeysResponse = {
  credits: number;
  keys: ApiKeyRecord[];
};

export default function ApiKeyPanel() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [credits, setCredits] = useState<number>(0);
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const endpointPath = '/api/v1/openai/chat/completions';

  const refresh = async () => {
    const res = await fetch('/api/user/api-keys', { cache: 'no-store' });
    const data = (await res.json()) as KeysResponse | { error?: string };
    if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to load api keys');
    const parsed = data as KeysResponse;
    setCredits(parsed.credits);
    setKeys(parsed.keys);
  };

  useEffect(() => {
    refresh()
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load api keys'))
      .finally(() => setLoading(false));
  }, []);

  const onCreate = async () => {
    setBusy(true);
    setError(null);
    setNewKey(null);
    try {
      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'default' }),
      });
      const data = (await res.json()) as { key?: string; error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to create API key');
      if (!data.key) throw new Error('No key returned');
      setNewKey(data.key);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create API key');
    } finally {
      setBusy(false);
    }
  };

  const onRevoke = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/api-keys/${encodeURIComponent(id)}/revoke`, { method: 'POST' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to revoke key');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to revoke key');
    } finally {
      setBusy(false);
    }
  };

  const onCopy = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied('token');
    } catch {
      setError('Copy failed. Please copy manually.');
    }
  };

  const onCopyCurl = async () => {
    if (!newKey) return;
    const origin = typeof window === 'undefined' ? 'https://your-domain.com' : window.location.origin;
    const curl = [
      `curl -X POST "${origin}${endpointPath}" \\`,
      `  -H "Authorization: Bearer ${newKey}" \\`,
      '  -H "Content-Type: application/json" \\',
      "  -d '{\"model\":\"gpt-4o-mini\",\"messages\":[{\"role\":\"user\",\"content\":\"你好\"}]}'",
    ].join('\n');
    try {
      await navigator.clipboard.writeText(curl);
      setCopied('curl');
    } catch {
      setError('Copy failed. Please copy manually.');
    }
  };

  return (
    <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">API Token</h2>
          <p className="mt-1 text-sm text-gray-600">
            Create your token to call `/api/v1/openai/chat/completions`. Requests still require enough credits.
          </p>
        </div>
        <button
          type="button"
          disabled={busy || loading}
          onClick={onCreate}
          className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
        >
          {busy ? 'Processing…' : 'Create token'}
        </button>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Current balance: {credits.toLocaleString()} credits
      </p>

      {newKey ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-semibold text-emerald-800">New token (shown once)</p>
          <p className="mt-1 break-all font-mono text-xs text-emerald-900">{newKey}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCopy}
              className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800"
            >
              Copy token
            </button>
            <button
              type="button"
              onClick={onCopyCurl}
              className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800"
            >
              Copy curl example
            </button>
            {copied ? <span className="self-center text-xs text-emerald-700">Copied {copied}.</span> : null}
          </div>
          <p className="mt-2 text-xs text-emerald-800">
            Endpoint: <span className="font-mono">{endpointPath}</span>
          </p>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100">
        {loading ? (
          <p className="p-3 text-sm text-gray-500">Loading tokens...</p>
        ) : keys.length === 0 ? (
          <p className="p-3 text-sm text-gray-500">No token yet.</p>
        ) : (
          keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {k.name} · {k.keyPrefix}...{k.last4}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {k.isActive ? 'Active' : 'Revoked'} · created {new Date(k.createdAt).toLocaleString()}
                </p>
              </div>
              {k.isActive ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRevoke(k.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                >
                  Revoke
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

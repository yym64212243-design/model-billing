const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '2mb' }));

const billingBase = String(process.env.BILLING_PROXY_BASE_URL || '').replace(/\/+$/, '');
if (!billingBase) {
  throw new Error('BILLING_PROXY_BASE_URL is required');
}

const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

app.use(
  cors(
    corsOrigins.length
      ? {
          origin: (origin, cb) => {
            if (!origin || corsOrigins.includes(origin)) return cb(null, true);
            return cb(new Error('CORS blocked'));
          },
        }
      : undefined
  )
);

function pickAuth(req) {
  const auth = req.header('authorization');
  if (auth && auth.toLowerCase().startsWith('bearer ')) return auth;
  const xApiKey = req.header('x-api-key');
  if (xApiKey) return `Bearer ${xApiKey.trim()}`;
  return '';
}

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, billingBase });
});

app.post('/v1/chat/completions', async (req, res) => {
  const auth = pickAuth(req);
  if (!auth) return res.status(401).json({ error: 'Missing user API key' });

  try {
    const upstream = await fetch(`${billingBase}/api/v1/openai/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
        'x-request-id': req.header('x-request-id') || crypto.randomUUID(),
      },
      body: JSON.stringify(req.body || {}),
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get('content-type');
    const balance = upstream.headers.get('x-credits-balance');

    res.status(upstream.status);
    if (contentType) res.setHeader('content-type', contentType);
    if (balance) res.setHeader('x-credits-balance', balance);
    return res.send(text);
  } catch (e) {
    console.error('Gateway forward failed:', e);
    return res.status(502).json({ error: 'Gateway forward failed' });
  }
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`[gateway] listening on :${port}`);
});

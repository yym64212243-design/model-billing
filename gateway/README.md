# Gateway (Minimal)

This service forwards chat requests to Model Billing's OpenAI proxy endpoint.

## 1) Setup

```bash
cd gateway
cp .env.example .env
npm install
```

Set `.env`:

- `PORT=8080`
- `BILLING_PROXY_BASE_URL=https://your-billing-domain`

## 2) Run

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:8080/healthz
```

## 3) Request format

Call the gateway endpoint:

`POST /v1/chat/completions`

Headers:

- `Authorization: Bearer mb_xxx` (user token from Billing)
- `Content-Type: application/json`

Body example:

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    { "role": "user", "content": "Hello" }
  ]
}
```

The gateway passes through upstream JSON and returns `x-credits-balance` response header when available.

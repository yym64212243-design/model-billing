import crypto from 'crypto';

type AlipayParams = Record<string, string>;

function stripPemMarkers(key: string): string {
  return key
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s+/g, '');
}

function toPem(key: string, type: 'PUBLIC KEY' | 'PRIVATE KEY'): string {
  if (key.includes('BEGIN')) return key;
  const body = stripPemMarkers(key);
  const chunks = body.match(/.{1,64}/g)?.join('\n') ?? body;
  return `-----BEGIN ${type}-----\n${chunks}\n-----END ${type}-----`;
}

function buildSignContent(params: AlipayParams): string {
  return Object.keys(params)
    .filter((k) => params[k] !== '' && params[k] !== undefined && k !== 'sign' && k !== 'sign_type')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
}

function signRSA2(content: string, privateKey: string): string {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(content, 'utf8');
  signer.end();
  return signer.sign(toPem(privateKey, 'PRIVATE KEY'), 'base64');
}

export function verifyAlipaySignature(params: AlipayParams, publicKey: string): boolean {
  const sign = params.sign;
  if (!sign) return false;
  const content = buildSignContent(params);
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(content, 'utf8');
  verifier.end();
  return verifier.verify(toPem(publicKey, 'PUBLIC KEY'), sign, 'base64');
}

function formatTimestamp(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

export function buildAlipayPagePayUrl(args: {
  appId: string;
  privateKey: string;
  gateway: string;
  notifyUrl: string;
  returnUrl: string;
  outTradeNo: string;
  totalAmount: string;
  subject: string;
}): string {
  const params: AlipayParams = {
    app_id: args.appId,
    method: 'alipay.trade.page.pay',
    format: 'JSON',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: formatTimestamp(new Date()),
    version: '1.0',
    notify_url: args.notifyUrl,
    return_url: args.returnUrl,
    biz_content: JSON.stringify({
      out_trade_no: args.outTradeNo,
      product_code: 'FAST_INSTANT_TRADE_PAY',
      total_amount: args.totalAmount,
      subject: args.subject,
    }),
  };

  const content = buildSignContent(params);
  params.sign = signRSA2(content, args.privateKey);

  const query = new URLSearchParams(params);
  const base = args.gateway.replace(/\/+$/, '');
  return `${base}?${query.toString()}`;
}

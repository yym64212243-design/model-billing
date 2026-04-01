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

export type AlipayPrecreateResult =
  | { ok: true; qrCode: string; outTradeNo: string }
  | { ok: false; message: string; subCode?: string };

/**
 * 当面付：统一下单，返回用户需扫描的二维码内容（一般为 `https://qr.alipay.com/...`）。
 * @see https://opendocs.alipay.com/open/02ekfg
 */
export async function alipayTradePrecreate(args: {
  appId: string;
  privateKey: string;
  gateway: string;
  notifyUrl: string;
  outTradeNo: string;
  totalAmount: string;
  subject: string;
}): Promise<AlipayPrecreateResult> {
  const params: AlipayParams = {
    app_id: args.appId,
    method: 'alipay.trade.precreate',
    format: 'JSON',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: formatTimestamp(new Date()),
    version: '1.0',
    notify_url: args.notifyUrl,
    biz_content: JSON.stringify({
      out_trade_no: args.outTradeNo,
      total_amount: args.totalAmount,
      subject: args.subject,
      product_code: 'FACE_TO_FACE_PAYMENT',
    }),
  };

  const content = buildSignContent(params);
  params.sign = signRSA2(content, args.privateKey);

  const base = args.gateway.replace(/\/+$/, '');
  const body = new URLSearchParams(params).toString();

  const res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body,
  });

  const raw = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: `Invalid Alipay response: ${raw.slice(0, 200)}` };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, message: 'Empty Alipay response' };
  }

  const obj = parsed as Record<string, unknown>;
  const trade = obj.alipay_trade_precreate_response as Record<string, unknown> | undefined;
  if (!trade) {
    return { ok: false, message: 'Missing alipay_trade_precreate_response' };
  }

  const code = String(trade.code ?? '');
  if (code !== '10000') {
    return {
      ok: false,
      message: String(trade.msg ?? trade.sub_msg ?? 'precreate failed'),
      subCode: trade.sub_code != null ? String(trade.sub_code) : undefined,
    };
  }

  const qrCode = trade.qr_code;
  if (typeof qrCode !== 'string' || !qrCode.trim()) {
    return { ok: false, message: 'No qr_code in Alipay response' };
  }

  return { ok: true, qrCode: qrCode.trim(), outTradeNo: args.outTradeNo };
}

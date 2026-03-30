import crypto from 'crypto';

/** 易支付 / ZPAY MD5 签名：参数名 ASCII 排序，排除 sign、sign_type、空值，拼接后追加商户 KEY */
export function zpaySign(params: Record<string, string>, merchantKey: string): string {
  const keys = Object.keys(params)
    .filter((k) => k !== 'sign' && k !== 'sign_type' && params[k] !== '' && params[k] != null)
    .sort();
  const str = keys.map((k) => `${k}=${params[k]}`).join('&');
  return crypto.createHash('md5').update(str + merchantKey, 'utf8').digest('hex');
}

export function zpayVerify(params: Record<string, string>, merchantKey: string): boolean {
  const sign = params.sign;
  if (!sign) return false;
  const computed = zpaySign(params, merchantKey);
  return computed.toLowerCase() === sign.toLowerCase();
}

export function zpayGatewayBase(raw: string): string {
  const t = raw.trim().replace(/\/+$/, '');
  return t || 'https://zpayz.cn';
}

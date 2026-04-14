import { NextResponse } from 'next/server';

/** 供前端决定展示哪些支付入口（不返回任何密钥） */
export async function GET() {
  const zpay = Boolean(process.env.ZPAY_PID?.trim() && process.env.ZPAY_KEY?.trim());
  return NextResponse.json({
    zpay,
    alipayPage: false,
    alipayScan: false,
  });
}

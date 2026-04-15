import { NextResponse } from 'next/server';
import { PLANS } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { syncPlansToDatabase } from '@/lib/syncPlans';

const planExtras = Object.fromEntries(PLANS.map((p) => [p.id, { testOnly: p.testOnly, popular: p.popular }])) as Record<
  string,
  { testOnly?: boolean; popular?: boolean }
>;

export async function GET() {
  try {
    await syncPlansToDatabase();

    const dbPlans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [{ popular: 'desc' }, { price: 'asc' }],
    });

    return NextResponse.json(
      dbPlans.map((p) => ({
        id: p.id,
        name: p.name,
        priceAUD: p.price / 100,
        credits: p.credits,
        description: p.description,
        popular: p.popular,
        testOnly: planExtras[p.id]?.testOnly,
      }))
    );
  } catch (e) {
    console.error('Load plans error:', e);
    return NextResponse.json(PLANS);
  }
}

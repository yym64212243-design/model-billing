import { NextResponse } from 'next/server';
import { PLANS } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const dbPlans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [{ popular: 'desc' }, { price: 'asc' }],
    });

    if (dbPlans.length > 0) {
      return NextResponse.json(
        dbPlans.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price / 100,
          currency: p.currency,
          credits: p.credits,
          description: p.description,
          popular: p.popular,
        }))
      );
    }

    // Auto-seed for dev/local so the app works without manual seeding.
    await prisma.$transaction(
      PLANS.map((p) =>
        prisma.plan.upsert({
          where: { id: p.id },
          create: {
            id: p.id,
            name: p.name,
            description: p.description,
            price: Math.round(p.price * 100),
            currency: p.currency,
            credits: p.credits,
            isActive: true,
            popular: Boolean(p.popular),
          },
          update: {
            name: p.name,
            description: p.description,
            price: Math.round(p.price * 100),
            currency: p.currency,
            credits: p.credits,
            isActive: true,
            popular: Boolean(p.popular),
          },
        })
      )
    );

    return NextResponse.json(PLANS);
  } catch (e) {
    console.error('Load plans error:', e);
    // Fallback to constants so UI still renders.
    return NextResponse.json(PLANS);
  }
}

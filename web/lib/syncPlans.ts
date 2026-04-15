import { PLANS } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

/** Upsert all catalog plans from `PLANS` (idempotent). */
export async function syncPlansToDatabase() {
  await prisma.$transaction(
    PLANS.map((p) =>
      prisma.plan.upsert({
        where: { id: p.id },
        create: {
          id: p.id,
          name: p.name,
          description: p.description,
          price: Math.round(p.priceAUD * 100),
          currency: 'CNY',
          credits: p.credits,
          isActive: true,
          popular: Boolean(p.popular),
        },
        update: {
          name: p.name,
          description: p.description,
          price: Math.round(p.priceAUD * 100),
          currency: 'CNY',
          credits: p.credits,
          isActive: true,
          popular: Boolean(p.popular),
        },
      })
    )
  );
}

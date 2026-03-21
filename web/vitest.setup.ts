import { afterEach, beforeAll } from 'vitest';

// Point Prisma at a separate SQLite DB for tests.
process.env.DATABASE_URL = 'file:./prisma/test.db';
process.env.NODE_ENV = 'test';

// Lazy import so DATABASE_URL is set first.
async function resetDb() {
  const { prisma } = await import('@/lib/prisma');
  // Order matters due to relations.
  await prisma.payment.deleteMany();
  await prisma.creditLedger.deleteMany();
  await prisma.order.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.user.deleteMany();
}

beforeAll(async () => {
  await resetDb();
});

afterEach(async () => {
  await resetDb();
});


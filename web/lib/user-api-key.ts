import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const PREFIX = 'mb_';

function pepper(): string {
  return process.env.USER_API_KEY_PEPPER?.trim() || process.env.NEXTAUTH_SECRET || 'dev-api-key-pepper';
}

export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(`${rawKey}.${pepper()}`, 'utf8').digest('hex');
}

export function generateApiKeyValue(): string {
  return `${PREFIX}${crypto.randomBytes(24).toString('hex')}`;
}

export function getApiKeyFromRequest(req: Request): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  const x = req.headers.get('x-api-key');
  return x?.trim() || null;
}

export async function verifyUserApiKey(rawKey: string) {
  if (!rawKey || !rawKey.startsWith(PREFIX)) return null;
  const keyHash = hashApiKey(rawKey);
  const key = await prisma.userApiKey.findUnique({
    where: { keyHash },
    select: { id: true, userId: true, isActive: true },
  });
  if (!key || !key.isActive) return null;
  await prisma.userApiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });
  return { keyId: key.id, userId: key.userId };
}

export async function createUserApiKey(userId: string, name: string) {
  const rawKey = generateApiKeyValue();
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 10);
  const last4 = rawKey.slice(-4);
  const record = await prisma.userApiKey.create({
    data: {
      userId,
      name,
      keyHash,
      keyPrefix,
      last4,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      last4: true,
      createdAt: true,
    },
  });
  return { rawKey, record };
}

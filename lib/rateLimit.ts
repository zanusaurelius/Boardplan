import { prisma } from "@/lib/db";

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const now = new Date();

  const existing = await prisma.rateLimit.findUnique({ where: { ip: key } });

  if (!existing) {
    await prisma.rateLimit.create({ data: { ip: key, count: 1, windowStart: now } });
    return true;
  }

  const windowAge = now.getTime() - existing.windowStart.getTime();
  if (windowAge > windowMs) {
    await prisma.rateLimit.update({ where: { ip: key }, data: { count: 1, windowStart: now } });
    return true;
  }

  if (existing.count >= limit) return false;

  await prisma.rateLimit.update({ where: { ip: key }, data: { count: { increment: 1 } } });
  return true;
}

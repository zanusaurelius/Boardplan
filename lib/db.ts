import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaInstance(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      datasourceUrl:
        process.env.DATABASE_URL ||
        process.env.POSTGRES_PRISMA_URL ||
        process.env.POSTGRES_URL,
    });
  }
  return globalForPrisma.prisma;
}

// Proxy defers new PrismaClient() until first property access at runtime,
// preventing Turbopack from triggering WASM initialization during build.
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    return (getPrismaInstance() as any)[prop];
  },
});

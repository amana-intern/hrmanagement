import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  // Vercel Postgres: gunakan POSTGRES_PRISMA_URL (pooled) untuk runtime.
  // Local dev: gunakan DATABASE_URL dari .env.
  const url = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
  return new PrismaClient({
    datasources: { db: { url } },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

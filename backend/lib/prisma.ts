// backend/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Auto-reconnect on connection errors
prisma.$on('error', async (e) => {
  console.error('[Prisma Error]', e.message);
  if (e.message.includes('connection pool')) {
    console.log('[Prisma] Attempting to recover from connection pool timeout...');
  }
});

export default prisma;

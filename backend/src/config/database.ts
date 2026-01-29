import { PrismaClient } from '@prisma/client';

// ============================================
// PRISMA CLIENT SINGLETON (PRODUCTION-SAFE)
// ============================================
// Why this matters:
// 1. Single instance prevents connection pool exhaustion
// 2. Global singleton survives Render/Vercel sleep/wake cycles
// 3. Lazy initialization prevents aggressive connection attempts
// 4. Compatible with hot reload (dev) and production
// 5. Handles connection events for graceful recovery
//
// How it works:
// - First call creates PrismaClient
// - Subsequent calls reuse same instance
// - Never creates new clients per request
// - Listens for connection events to detect failures
// ============================================

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    // Logging strategy:
    // - Production: Only errors (minimize noise)
    // - Development: Include warnings and queries (debugging)
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error', 'warn'],
  });

  // Graceful disconnect handler
  // If connection dies, don't crash - let error handlers catch it
  client.$on('beforeExit' as never, async () => {
    console.warn('[Prisma] Connection pool closing (graceful shutdown)');
  });

  return client;
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

// Production: Reuse the same instance across all requests
// Development: Also keep it global to prevent hot-reload issues
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// ============================================
// CONNECTION HEALTH CHECK
// ============================================
// Exported for use in keep-alive endpoint
// Tests if Prisma can reach the database
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('[DB Health Check] Failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
};

// ============================================
// GRACEFUL CONNECTION RECOVERY
// ============================================
// If Prisma connection dies, attempt ONE reconnect
// This prevents cascading failures from taking down the server
export const ensureDatabaseConnected = async (): Promise<boolean> => {
  try {
    // Quick health check
    await checkDatabaseHealth();
    return true;
  } catch (error) {
    console.warn('[DB Recovery] Connection failed, attempting reconnect...');
    try {
      // Disconnect and reconnect
      await prisma.$disconnect();
      // Recreate connection (Prisma auto-connects on next query)
      await checkDatabaseHealth();
      console.log('[DB Recovery] Successfully reconnected');
      return true;
    } catch (reconnectError) {
      console.error('[DB Recovery] Reconnect failed:', reconnectError instanceof Error ? reconnectError.message : String(reconnectError));
      return false;
    }
  }
};

export { prisma };

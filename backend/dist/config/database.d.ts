import { PrismaClient } from '@prisma/client';
declare const prismaClientSingleton: () => PrismaClient<{
    log: ("error" | "query" | "warn")[];
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}
declare const prisma: PrismaClient<{
    log: ("error" | "query" | "warn")[];
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
export { prisma };
//# sourceMappingURL=database.d.ts.map
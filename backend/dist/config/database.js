"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const prismaClientSingleton = () => {
    return new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
};
const prisma = globalThis.prisma ?? prismaClientSingleton();
exports.prisma = prisma;
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}
//# sourceMappingURL=database.js.map
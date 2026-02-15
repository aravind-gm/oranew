export declare const prisma: any;
export declare const checkDatabaseHealth: () => Promise<boolean>;
export declare const ensureDatabaseConnected: () => Promise<boolean>;
export declare const warmupDatabase: (maxWaitMs?: number) => Promise<boolean>;
export declare const disconnectDatabase: () => Promise<void>;
export default prisma;
//# sourceMappingURL=database.d.ts.map
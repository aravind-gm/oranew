/**
 * Supabase to Cloudflare R2 Migration Script
 *
 * This script migrates all existing images from Supabase Storage to Cloudflare R2
 *
 * Features:
 * - Idempotent (can run multiple times safely)
 * - Tracks migration status in database
 * - Verifies CDN access after upload
 * - Only deletes Supabase files after verification
 * - Comprehensive logging
 *
 * Usage:
 *   npx ts-node scripts/migrate-to-r2.ts
 *   npx ts-node scripts/migrate-to-r2.ts --dry-run
 *   npx ts-node scripts/migrate-to-r2.ts --verify-only
 *
 * @author ORA Engineering
 */
export {};
//# sourceMappingURL=migrate-to-r2.d.ts.map
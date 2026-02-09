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

import dotenv from 'dotenv';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Import after dotenv is configured
import {
  generateProductImagePath,
  getCdnUrl,
  isR2Configured,
  uploadToR2,
  fileExistsInR2,
} from '../src/config/r2';
import {
  generateProductVariants,
  isValidImage,
} from '../src/services/image.service';
import { createClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURATION
// ============================================

interface MigrationConfig {
  dryRun: boolean;
  verifyOnly: boolean;
  batchSize: number;
  skipVerified: boolean;
  deleteAfterMigration: boolean;
}

const DEFAULT_CONFIG: MigrationConfig = {
  dryRun: false,
  verifyOnly: false,
  batchSize: 10,
  skipVerified: true,
  deleteAfterMigration: false, // Set to true in production after verification
};

// ============================================
// SUPABASE CLIENT
// ============================================

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  return createClient(url, serviceKey);
}

// ============================================
// LOGGING
// ============================================

const LOG_FILE = `migration-${new Date().toISOString().split('T')[0]}.log`;

function log(level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logLine, data ? JSON.stringify(data, null, 2) : '');
  
  // In production, you would also write to a log file
  // fs.appendFileSync(LOG_FILE, logLine + (data ? ' ' + JSON.stringify(data) : '') + '\n');
}

// ============================================
// MIGRATION STATISTICS
// ============================================

interface MigrationStats {
  total: number;
  migrated: number;
  verified: number;
  failed: number;
  skipped: number;
  bytesUploaded: number;
}

// ============================================
// DOWNLOAD IMAGE FROM SUPABASE
// ============================================

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    log('INFO', `Downloading image: ${url}`);
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });
    
    const buffer = Buffer.from(response.data);
    log('INFO', `Downloaded ${buffer.length} bytes`);
    
    return buffer;
  } catch (error) {
    log('ERROR', `Failed to download image: ${url}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// ============================================
// VERIFY CDN ACCESS
// ============================================

async function verifyCdnAccess(cdnUrl: string): Promise<boolean> {
  try {
    const response = await axios.head(cdnUrl, { timeout: 10000 });
    return response.status === 200;
  } catch (error) {
    log('WARN', `CDN verification failed for: ${cdnUrl}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

// ============================================
// MIGRATE SINGLE PRODUCT IMAGE
// ============================================

async function migrateProductImage(
  image: {
    id: string;
    productId: string;
    imageUrl: string;
    altText: string | null;
    sortOrder: number;
    isPrimary: boolean;
  },
  config: MigrationConfig
): Promise<{ success: boolean; newUrl?: string; error?: string }> {
  const { id, productId, imageUrl } = image;

  log('INFO', `Migrating image ${id} for product ${productId}`);

  // Check if already migrated
  const existingMigration = await prisma.imageMigration.findUnique({
    where: { originalUrl: imageUrl },
  });

  if (existingMigration) {
    if (existingMigration.status === 'verified') {
      log('INFO', `Image already migrated and verified: ${id}`);
      return { success: true, newUrl: existingMigration.newUrl };
    }
    if (existingMigration.status === 'migrated' && config.skipVerified) {
      log('INFO', `Image already migrated, skipping: ${id}`);
      return { success: true, newUrl: existingMigration.newUrl };
    }
  }

  if (config.dryRun) {
    log('INFO', `[DRY RUN] Would migrate: ${imageUrl}`);
    return { success: true };
  }

  // Step 1: Download from Supabase
  const buffer = await downloadImage(imageUrl);
  if (!buffer) {
    return { success: false, error: 'Failed to download image' };
  }

  // Step 2: Validate image
  const validation = await isValidImage(buffer);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Step 3: Generate variants and upload to R2
  try {
    const variants = await generateProductVariants(buffer);
    const uploadedUrls: Record<string, string> = {};

    for (const variant of variants) {
      const path = generateProductImagePath(productId, variant.role);
      
      // Check if already exists in R2
      const exists = await fileExistsInR2(path);
      if (exists && config.skipVerified) {
        log('INFO', `Variant ${variant.role} already exists in R2`);
        uploadedUrls[variant.role] = getCdnUrl(path);
        continue;
      }

      const result = await uploadToR2(variant.buffer, path, 'image/webp');
      uploadedUrls[variant.role] = result.url;
      log('SUCCESS', `Uploaded ${variant.role} variant: ${result.url}`);
    }

    const heroUrl = uploadedUrls['hero'];
    if (!heroUrl) {
      return { success: false, error: 'No hero variant uploaded' };
    }

    // Step 4: Record migration
    await prisma.imageMigration.upsert({
      where: { originalUrl: imageUrl },
      create: {
        originalUrl: imageUrl,
        newUrl: heroUrl,
        entityType: 'product',
        entityId: productId,
        status: 'migrated',
        migratedAt: new Date(),
      },
      update: {
        newUrl: heroUrl,
        status: 'migrated',
        migratedAt: new Date(),
        errorMessage: null,
      },
    });

    // Step 5: Update product_images table
    await prisma.productImage.update({
      where: { id },
      data: {
        imageUrl: heroUrl,
        originalUrl: imageUrl,
        imageRole: 'HERO',
        cdnVerified: false, // Will be set to true after verification
      },
    });

    return { success: true, newUrl: heroUrl };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Record failure
    await prisma.imageMigration.upsert({
      where: { originalUrl: imageUrl },
      create: {
        originalUrl: imageUrl,
        newUrl: '',
        entityType: 'product',
        entityId: productId,
        status: 'failed',
        errorMessage: errorMsg,
      },
      update: {
        status: 'failed',
        errorMessage: errorMsg,
      },
    });

    return { success: false, error: errorMsg };
  }
}

// ============================================
// VERIFY MIGRATED IMAGES
// ============================================

async function verifyMigratedImages(): Promise<void> {
  log('INFO', 'Starting verification of migrated images...');

  const unverified = await prisma.imageMigration.findMany({
    where: { status: 'migrated' },
  });

  log('INFO', `Found ${unverified.length} unverified migrations`);

  for (const migration of unverified) {
    const accessible = await verifyCdnAccess(migration.newUrl);

    if (accessible) {
      await prisma.imageMigration.update({
        where: { id: migration.id },
        data: {
          status: 'verified',
          verifiedAt: new Date(),
        },
      });

      // Also update the product_images table
      await prisma.productImage.updateMany({
        where: { imageUrl: migration.newUrl },
        data: { cdnVerified: true },
      });

      log('SUCCESS', `Verified: ${migration.newUrl}`);
    } else {
      log('ERROR', `Verification failed: ${migration.newUrl}`);
    }
  }
}

// ============================================
// DELETE SUPABASE IMAGES AFTER VERIFICATION
// ============================================

async function cleanupSupabaseStorage(): Promise<void> {
  log('INFO', 'Starting Supabase Storage cleanup...');

  const supabase = getSupabaseClient();
  const verified = await prisma.imageMigration.findMany({
    where: { status: 'verified' },
  });

  log('INFO', `Found ${verified.length} verified migrations to cleanup`);

  for (const migration of verified) {
    try {
      // Extract file path from Supabase URL
      const urlMatch = migration.originalUrl.match(/product-images\/(.*)/);
      if (!urlMatch) {
        log('WARN', `Could not extract path from URL: ${migration.originalUrl}`);
        continue;
      }

      const filePath = urlMatch[1];
      
      const { error } = await supabase.storage
        .from('product-images')
        .remove([filePath]);

      if (error) {
        log('ERROR', `Failed to delete from Supabase: ${filePath}`, error);
      } else {
        log('SUCCESS', `Deleted from Supabase: ${filePath}`);
      }
    } catch (error) {
      log('ERROR', `Cleanup error for: ${migration.originalUrl}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// ============================================
// MAIN MIGRATION FUNCTION
// ============================================

async function runMigration(config: MigrationConfig): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    verified: 0,
    failed: 0,
    skipped: 0,
    bytesUploaded: 0,
  };

  log('INFO', '='.repeat(60));
  log('INFO', 'ORA Jewellery - Supabase to Cloudflare R2 Migration');
  log('INFO', '='.repeat(60));
  log('INFO', 'Configuration:', config);

  // Check R2 configuration
  if (!isR2Configured()) {
    log('ERROR', 'R2 is not properly configured. Please check environment variables.');
    throw new Error('R2 not configured');
  }

  // Verify-only mode
  if (config.verifyOnly) {
    await verifyMigratedImages();
    return stats;
  }

  // Get all product images that need migration
  const images = await prisma.productImage.findMany({
    where: config.skipVerified
      ? { cdnVerified: false }
      : {},
    orderBy: { sortOrder: 'asc' },
  });

  stats.total = images.length;
  log('INFO', `Found ${stats.total} images to process`);

  // Filter images that are still on Supabase Storage
  const supabaseImages = images.filter((img) =>
    img.imageUrl.includes('supabase.co')
  );

  log('INFO', `${supabaseImages.length} images are on Supabase Storage`);

  // Process in batches
  for (let i = 0; i < supabaseImages.length; i += config.batchSize) {
    const batch = supabaseImages.slice(i, i + config.batchSize);
    log('INFO', `Processing batch ${Math.floor(i / config.batchSize) + 1} (${batch.length} images)`);

    for (const image of batch) {
      const result = await migrateProductImage(image, config);

      if (result.success) {
        if (result.newUrl) {
          stats.migrated++;
        } else {
          stats.skipped++;
        }
      } else {
        stats.failed++;
        log('ERROR', `Failed to migrate ${image.id}: ${result.error}`);
      }
    }

    // Small delay between batches to avoid rate limiting
    if (i + config.batchSize < supabaseImages.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Run verification
  log('INFO', 'Running verification...');
  await verifyMigratedImages();

  // Get final stats
  const verifiedCount = await prisma.imageMigration.count({
    where: { status: 'verified' },
  });
  stats.verified = verifiedCount;

  // Cleanup if enabled
  if (config.deleteAfterMigration) {
    log('INFO', 'Cleanup enabled - deleting verified Supabase files...');
    await cleanupSupabaseStorage();
  }

  // Print summary
  log('INFO', '='.repeat(60));
  log('INFO', 'MIGRATION COMPLETE');
  log('INFO', '='.repeat(60));
  log('INFO', 'Statistics:', stats);

  return stats;
}

// ============================================
// CLI ENTRY POINT
// ============================================

async function main() {
  const args = process.argv.slice(2);
  
  const config: MigrationConfig = {
    ...DEFAULT_CONFIG,
    dryRun: args.includes('--dry-run'),
    verifyOnly: args.includes('--verify-only'),
    deleteAfterMigration: args.includes('--cleanup'),
  };

  if (args.includes('--help')) {
    console.log(`
ORA Jewellery - Supabase to R2 Migration Script

Usage:
  npx ts-node scripts/migrate-to-r2.ts [options]

Options:
  --dry-run         Run without making any changes
  --verify-only     Only verify previously migrated images
  --cleanup         Delete Supabase files after verification
  --help            Show this help message

Examples:
  npx ts-node scripts/migrate-to-r2.ts --dry-run
  npx ts-node scripts/migrate-to-r2.ts
  npx ts-node scripts/migrate-to-r2.ts --verify-only
  npx ts-node scripts/migrate-to-r2.ts --cleanup
    `);
    process.exit(0);
  }

  try {
    const stats = await runMigration(config);
    
    if (stats.failed > 0) {
      log('WARN', `Migration completed with ${stats.failed} failures`);
      process.exit(1);
    }
    
    log('SUCCESS', 'Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    log('ERROR', 'Migration failed:', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();

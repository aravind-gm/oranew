/**
 * Database Cleanup Script
 * Removes ALL products, orders, customers etc.
 * Keeps ONLY: admin user + categories
 *
 * Usage: node scripts/cleanup-db.js
 * Add --confirm flag to actually execute (dry run by default)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DRY_RUN = !process.argv.includes('--confirm');

async function cleanup() {
  if (DRY_RUN) {
    console.log('🔍 DRY RUN — no data will be deleted. Pass --confirm to execute.\n');
  } else {
    console.log('⚠️  LIVE RUN — data will be permanently deleted!\n');
  }

  // Order matters due to foreign key constraints (delete children first)
  const deletionOrder = [
    // Order-related
    { model: 'orderItem', label: 'Order Items' },
    { model: 'return', label: 'Returns' },
    { model: 'payment', label: 'Payments' },
    { model: 'paymentRetryToken', label: 'Payment Retry Tokens' },
    { model: 'order', label: 'Orders' },

    // Cart & wishlist
    { model: 'cartItem', label: 'Cart Items' },
    { model: 'wishlist', label: 'Wishlists' },
    { model: 'abandonedCartLog', label: 'Abandoned Cart Logs' },

    // Product-related
    { model: 'review', label: 'Reviews' },
    { model: 'inventoryLock', label: 'Inventory Locks' },
    { model: 'productImage', label: 'Product Images' },
    { model: 'comboProduct', label: 'Combo Products' },
    { model: 'product', label: 'Products' },

    // Coupons & campaigns
    { model: 'couponUsage', label: 'Coupon Usages' },
    { model: 'coupon', label: 'Coupons' },
    { model: 'bOGOCampaign', label: 'BOGO Campaigns' },
    { model: 'offerCampaign', label: 'Offer Campaigns' },

    // Content
    { model: 'banner', label: 'Banners' },
    { model: 'announcement', label: 'Announcements' },
    { model: 'staticPage', label: 'Static Pages' },
    { model: 'collectionImage', label: 'Collection Images' },
    { model: 'brandAsset', label: 'Brand Assets' },
    { model: 'imageMigration', label: 'Image Migrations' },

    // User-related (keep admin)
    { model: 'notification', label: 'Notifications' },
    { model: 'refreshToken', label: 'Refresh Tokens' },
    { model: 'adminAuditLog', label: 'Admin Audit Logs' },
    { model: 'address', label: 'Addresses (non-admin)' },
  ];

  for (const { model, label } of deletionOrder) {
    try {
      const count = await prisma[model].count();
      if (DRY_RUN) {
        console.log(`  Would delete ${count} ${label}`);
      } else {
        const result = await prisma[model].deleteMany();
        console.log(`  ✅ Deleted ${result.count} ${label}`);
      }
    } catch (err) {
      console.log(`  ⚠️  ${label}: ${err.message.split('\n')[0]}`);
    }
  }

  // Delete non-admin users
  try {
    const nonAdminCount = await prisma.user.count({ where: { role: { not: 'ADMIN' } } });
    if (DRY_RUN) {
      console.log(`  Would delete ${nonAdminCount} non-admin Users`);
    } else {
      // First delete addresses for non-admin users
      const nonAdminUsers = await prisma.user.findMany({
        where: { role: { not: 'ADMIN' } },
        select: { id: true },
      });
      const userIds = nonAdminUsers.map((u) => u.id);
      if (userIds.length > 0) {
        await prisma.address.deleteMany({ where: { userId: { in: userIds } } });
      }
      const result = await prisma.user.deleteMany({ where: { role: { not: 'ADMIN' } } });
      console.log(`  ✅ Deleted ${result.count} non-admin Users`);
    }
  } catch (err) {
    console.log(`  ⚠️  Users: ${err.message.split('\n')[0]}`);
  }

  // Summary
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  const categoryCount = await prisma.category.count();
  console.log(`\n📊 Remaining: ${adminCount} admin user(s), ${categoryCount} categories`);

  if (DRY_RUN) {
    console.log('\n💡 Run with --confirm to execute: node scripts/cleanup-db.js --confirm');
  } else {
    console.log('\n🎉 Cleanup complete!');
  }
}

cleanup()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

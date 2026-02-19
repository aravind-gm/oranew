/**
 * Scheduled Jobs — Campaign auto-expiry + inventory lock cleanup + abandoned cart emails
 *                  + payment reconciliation
 *
 * Runs on a simple setInterval basis (no external cron dependency).
 * Safe for single-instance deployments (Render free tier).
 */

import { prisma } from '../config/database';
import { cleanupExpiredLocks } from './inventory';
import { sendAbandonedCartEmail } from '../services/email.service';
import { sendPaymentAlert } from './alerts';
import { captureException } from '../config/sentry';

const CAMPAIGN_CHECK_INTERVAL = 60 * 1000; // Every 1 minute
const INVENTORY_CLEANUP_INTERVAL = 5 * 60 * 1000; // Every 5 minutes
const ABANDONED_CART_INTERVAL = 30 * 60 * 1000; // Every 30 minutes
const RECONCILIATION_INTERVAL = 15 * 60 * 1000; // Every 15 minutes

// Track users who already received an abandoned cart email (reset on server restart)
// Key: userId, Value: timestamp of last email sent
const abandonedCartEmailsSent = new Map<string, number>();
const ABANDONED_CART_COOLDOWN = 24 * 60 * 60 * 1000; // Only re-send after 24 hours

/**
 * Deactivate expired BOGO campaigns (endDate < now).
 */
async function deactivateExpiredBOGOCampaigns(): Promise<number> {
  try {
    const result = await prisma.bOGOCampaign.updateMany({
      where: {
        isActive: true,
        endDate: {
          lt: new Date(),
          not: null,
        },
      },
      data: {
        isActive: false,
      },
    });

    if (result.count > 0) {
      console.log(`[Scheduler] Deactivated ${result.count} expired BOGO campaign(s)`);
    }

    return result.count;
  } catch (error) {
    console.error('[Scheduler] Failed to deactivate BOGO campaigns:', error);
    return 0;
  }
}

/**
 * Deactivate expired offer campaigns (endDate < now).
 */
async function deactivateExpiredOfferCampaigns(): Promise<number> {
  try {
    const result = await prisma.offerCampaign.updateMany({
      where: {
        isActive: true,
        endDate: {
          lt: new Date(),
          not: null,
        },
      },
      data: {
        isActive: false,
      },
    });

    if (result.count > 0) {
      console.log(`[Scheduler] Deactivated ${result.count} expired offer campaign(s)`);
    }

    return result.count;
  } catch (error) {
    console.error('[Scheduler] Failed to deactivate offer campaigns:', error);
    return 0;
  }
}

/**
 * Clear expired product-level offers (offerExpiry < now).
 */
async function clearExpiredProductOffers(): Promise<number> {
  try {
    const result = await prisma.product.updateMany({
      where: {
        isOnOffer: true,
        offerExpiry: {
          lt: new Date(),
          not: null,
        },
        deletedAt: null,
      },
      data: {
        isOnOffer: false,
        offerType: null,
        offerValue: null,
        offerExpiry: null,
        showCountdown: false,
      },
    });

    if (result.count > 0) {
      console.log(`[Scheduler] Cleared ${result.count} expired product offer(s)`);
    }

    return result.count;
  } catch (error) {
    console.error('[Scheduler] Failed to clear product offers:', error);
    return 0;
  }
}

/**
 * Deactivate BOGO-eligible products when no active BOGO campaign exists.
 */
async function syncBOGOProductStatus(): Promise<void> {
  try {
    const activeCampaign = await prisma.bOGOCampaign.findFirst({
      where: { isActive: true },
    });

    if (!activeCampaign) {
      // No active campaign → mark all BOGO products as inactive
      const result = await prisma.product.updateMany({
        where: {
          bogoActive: true,
          deletedAt: null,
        },
        data: {
          bogoActive: false,
        },
      });

      if (result.count > 0) {
        console.log(`[Scheduler] Deactivated BOGO on ${result.count} product(s) — no active campaign`);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Failed to sync BOGO product status:', error);
  }
}

/**
 * Send abandoned cart reminder emails.
 * 
 * Logic:
 * - Find users with cart items added > 2 hours ago
 * - Who have NOT placed an order in the last 2 hours
 * - Who haven't received an abandoned cart email in the last 24 hours
 * - Send them a reminder with their cart contents
 */
async function sendAbandonedCartReminders(): Promise<number> {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    // Find users with "stale" cart items (added > 2 hours ago)
    const usersWithOldCarts = await prisma.cartItem.findMany({
      where: {
        addedAt: { lt: twoHoursAgo },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    if (usersWithOldCarts.length === 0) return 0;

    let emailsSent = 0;

    for (const { userId } of usersWithOldCarts) {
      // Skip if we already sent them an email recently
      const lastSent = abandonedCartEmailsSent.get(userId);
      if (lastSent && Date.now() - lastSent < ABANDONED_CART_COOLDOWN) {
        continue;
      }

      // Check if user placed an order in the last 2 hours (they came back and completed)
      const recentOrder = await prisma.order.findFirst({
        where: {
          userId,
          createdAt: { gte: twoHoursAgo },
        },
        select: { id: true },
      });

      if (recentOrder) continue; // They already ordered — skip

      // Get user details + cart items
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, fullName: true },
      });

      if (!user || !user.email) continue;

      const cartItems = await prisma.cartItem.findMany({
        where: { userId },
        include: {
          product: {
            select: { name: true, price: true, isActive: true },
          },
        },
      });

      // Filter to only active products
      const activeItems = cartItems.filter(ci => ci.product.isActive);
      if (activeItems.length === 0) continue;

      const emailItems = activeItems.map(ci => ({
        productName: ci.product.name,
        unitPrice: Number(ci.product.price),
        quantity: ci.quantity,
      }));

      const cartTotal = emailItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

      try {
        await sendAbandonedCartEmail({
          customerEmail: user.email,
          customerName: user.fullName || 'there',
          items: emailItems,
          cartTotal,
        });

        abandonedCartEmailsSent.set(userId, Date.now());
        emailsSent++;
      } catch (emailErr) {
        console.error(`[Scheduler] Failed to send abandoned cart email to ${user.email}:`, emailErr);
      }
    }

    if (emailsSent > 0) {
      console.log(`[Scheduler] Sent ${emailsSent} abandoned cart reminder email(s)`);
    }

    // Cleanup old entries from the tracking map (older than 48h)
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    for (const [uid, ts] of abandonedCartEmailsSent) {
      if (ts < cutoff) abandonedCartEmailsSent.delete(uid);
    }

    return emailsSent;
  } catch (error) {
    console.error('[Scheduler] Failed to process abandoned carts:', error);
    return 0;
  }
}

/**
 * Payment Reconciliation
 *
 * Every 15 minutes: find orders where the payment is PENDING or VERIFIED
 * and was created more than 10 minutes ago (enough time for webhooks to fire),
 * then query Razorpay to get ground truth.
 *
 * Safety guarantees:
 *  - Uses Razorpay order API (not payment API) to avoid guessing IDs
 *  - Each order is processed independently — one failure doesn't stop others
 *  - Idempotent: already-CONFIRMED orders are skipped
 *  - Stock is only decremented once (verifyPayment already does it)
 */
async function reconcilePayments(): Promise<void> {
  // Lazy import Razorpay to avoid circular deps at module load
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let Razorpay: new (opts: { key_id: string; key_secret: string }) => any;
  try {
    Razorpay = (await import('razorpay')).default;
  } catch {
    console.warn('[Reconcile] Razorpay not available — skipping');
    return;
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    console.warn('[Reconcile] Razorpay credentials not set — skipping');
    return;
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  // Find stale payments that should have been resolved by now
  const stalePayments = await prisma.payment.findMany({
    where: {
      status: { in: ['PENDING', 'VERIFIED'] },
      createdAt: { lt: tenMinutesAgo },
    },
    include: {
      order: {
        select: { id: true, orderNumber: true, userId: true, status: true },
      },
    },
    take: 50, // Process at most 50 per run to avoid overwhelming Razorpay API
  });

  if (stalePayments.length === 0) return;

  console.log(`[Reconcile] Checking ${stalePayments.length} stale payment(s)...`);
  let confirmed = 0, failed = 0, skipped = 0;

  for (const payment of stalePayments) {
    try {
      // transactionId = razorpay order_id (order_xxx)
      const rzpOrder = await razorpay.orders.fetchPayments(payment.transactionId) as any;
      const payments: any[] = rzpOrder.items ?? [];

      const captured = payments.find(
        (p: any) => p.status === 'captured' || p.captured === true
      );
      const failed_p = payments.find((p: any) => p.status === 'failed');

      if (captured && payment.status !== 'CONFIRMED') {
        // Mark as CONFIRMED
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'CONFIRMED',
              gatewayResponse: {
                ...(typeof payment.gatewayResponse === 'object' && payment.gatewayResponse ? payment.gatewayResponse : {}),
                razorpayPaymentId: captured.id,
                reconciledAt: new Date().toISOString(),
                reconciledBy: 'scheduler',
              },
            },
          }),
          prisma.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus: 'CONFIRMED', status: 'CONFIRMED' },
          }),
        ]);

        sendPaymentAlert({
          level: 'info',
          event: 'Payment auto-reconciled to CONFIRMED',
          orderId: payment.order?.orderNumber ?? payment.orderId,
          userId: payment.order?.userId,
          reason: 'Webhook not received — reconciled via Razorpay API',
        });
        confirmed++;
      } else if (failed_p && payment.status === 'PENDING') {
        // Mark as FAILED
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              gatewayResponse: {
                ...(typeof payment.gatewayResponse === 'object' && payment.gatewayResponse ? payment.gatewayResponse : {}),
                reconciledAt: new Date().toISOString(),
                reconciledBy: 'scheduler',
                error_description: failed_p.error_description,
              },
            },
          }),
          prisma.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus: 'FAILED', status: 'CANCELLED', cancelledAt: new Date() },
          }),
        ]);

        sendPaymentAlert({
          level: 'error',
          event: 'Payment auto-reconciled to FAILED',
          orderId: payment.order?.orderNumber ?? payment.orderId,
          userId: payment.order?.userId,
          reason: failed_p.error_description ?? 'Payment failed at gateway',
        });
        failed++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`[Reconcile] Error processing payment ${payment.id}:`, err);
      captureException(err, { paymentId: payment.id, orderId: payment.orderId });
    }
  }

  if (confirmed > 0 || failed > 0) {
    console.log(`[Reconcile] Done — confirmed: ${confirmed}, failed: ${failed}, skipped: ${skipped}`);
  }
}

/**
 * Start all scheduled jobs. Call once at server boot.
 */
export function startScheduler(): void {
  console.log('[Scheduler] Starting scheduled jobs...');

  // Campaign expiry check — every 1 minute
  setInterval(async () => {
    await deactivateExpiredBOGOCampaigns();
    await deactivateExpiredOfferCampaigns();
    await clearExpiredProductOffers();
    await syncBOGOProductStatus();
  }, CAMPAIGN_CHECK_INTERVAL);

  // Inventory lock cleanup — every 5 minutes
  setInterval(async () => {
    try {
      await cleanupExpiredLocks();
    } catch (error) {
      console.error('[Scheduler] Inventory cleanup error:', error);
    }
  }, INVENTORY_CLEANUP_INTERVAL);

  // Abandoned cart reminders — every 30 minutes
  setInterval(async () => {
    try {
      await sendAbandonedCartReminders();
    } catch (error) {
      console.error('[Scheduler] Abandoned cart reminder error:', error);
    }
  }, ABANDONED_CART_INTERVAL);

  // Payment reconciliation — every 15 minutes
  setInterval(async () => {
    try {
      await reconcilePayments();
    } catch (error) {
      console.error('[Scheduler] Reconciliation error:', error);
      captureException(error, { job: 'payment-reconciliation' });
    }
  }, RECONCILIATION_INTERVAL);

  // Run once immediately on boot
  setTimeout(async () => {
    await deactivateExpiredBOGOCampaigns();
    await deactivateExpiredOfferCampaigns();
    await clearExpiredProductOffers();
    await syncBOGOProductStatus();
    try { await cleanupExpiredLocks(); } catch {}
  }, 5000); // 5s after boot to let DB warm up
}

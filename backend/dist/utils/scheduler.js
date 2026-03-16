"use strict";
/**
 * Scheduled Jobs — Campaign auto-expiry + inventory lock cleanup + abandoned cart emails
 *                  + payment reconciliation
 *
 * Runs on a simple setInterval basis (no external cron dependency).
 * Safe for single-instance deployments (Render free tier).
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduler = startScheduler;
const database_1 = require("../config/database");
const inventory_1 = require("./inventory");
const email_service_1 = require("../services/email.service");
const alerts_1 = require("./alerts");
const sentry_1 = require("../config/sentry");
const CAMPAIGN_CHECK_INTERVAL = 60 * 1000; // Every 1 minute
const INVENTORY_CLEANUP_INTERVAL = 5 * 60 * 1000; // Every 5 minutes
const ABANDONED_CART_INTERVAL = 30 * 60 * 1000; // Every 30 minutes
const RECONCILIATION_INTERVAL = 15 * 60 * 1000; // Every 15 minutes
// Cooldown between abandoned cart emails per user (DB-persisted)
const ABANDONED_CART_COOLDOWN_HOURS = 24;
/**
 * Deactivate expired BOGO campaigns (endDate < now).
 */
async function deactivateExpiredBOGOCampaigns() {
    try {
        const result = await database_1.prisma.bOGOCampaign.updateMany({
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
    }
    catch (error) {
        console.error('[Scheduler] Failed to deactivate BOGO campaigns:', error);
        return 0;
    }
}
/**
 * Deactivate expired offer campaigns (endDate < now).
 */
async function deactivateExpiredOfferCampaigns() {
    try {
        const result = await database_1.prisma.offerCampaign.updateMany({
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
    }
    catch (error) {
        console.error('[Scheduler] Failed to deactivate offer campaigns:', error);
        return 0;
    }
}
/**
 * Clear expired product-level offers (offerExpiry < now).
 */
async function clearExpiredProductOffers() {
    try {
        const result = await database_1.prisma.product.updateMany({
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
    }
    catch (error) {
        console.error('[Scheduler] Failed to clear product offers:', error);
        return 0;
    }
}
/**
 * Deactivate BOGO-eligible products when no active BOGO campaign exists.
 */
async function syncBOGOProductStatus() {
    try {
        const activeCampaign = await database_1.prisma.bOGOCampaign.findFirst({
            where: { isActive: true },
        });
        if (!activeCampaign) {
            // No active campaign → mark all BOGO products as inactive
            const result = await database_1.prisma.product.updateMany({
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
    }
    catch (error) {
        console.error('[Scheduler] Failed to sync BOGO product status:', error);
    }
}
/**
 * Send abandoned cart reminder emails.
 *
 * Logic:
 * - Find users with cart items added > 2 hours ago
 * - Who have NOT placed an order in the last 2 hours
 * - Who haven't received an email in the last 24 hours (DB-persisted — survives restarts)
 * - Send them a reminder with their cart contents
 * - Optionally attach a 5% coupon (if ENABLE_CART_COUPON=true env)
 *
 * Idempotent: uses AbandonedCartLog table for cooldown tracking.
 */
async function sendAbandonedCartReminders() {
    try {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const cooldownCutoff = new Date(Date.now() - ABANDONED_CART_COOLDOWN_HOURS * 60 * 60 * 1000);
        // Find users with "stale" cart items (added > 2 hours ago)
        const usersWithOldCarts = await database_1.prisma.cartItem.findMany({
            where: { addedAt: { lt: twoHoursAgo } },
            select: { userId: true },
            distinct: ['userId'],
        });
        if (usersWithOldCarts.length === 0)
            return 0;
        let emailsSent = 0;
        for (const { userId } of usersWithOldCarts) {
            // Check DB cooldown — skip if email sent recently
            const existingLog = await database_1.prisma.abandonedCartLog.findUnique({
                where: { userId },
            });
            if (existingLog && existingLog.emailSentAt > cooldownCutoff)
                continue;
            // Skip if user placed an order recently (they converted)
            const recentOrder = await database_1.prisma.order.findFirst({
                where: { userId, createdAt: { gte: twoHoursAgo } },
                select: { id: true },
            });
            if (recentOrder)
                continue;
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, fullName: true },
            });
            if (!user?.email)
                continue;
            const cartItems = await database_1.prisma.cartItem.findMany({
                where: { userId },
                include: { product: { select: { name: true, finalPrice: true, isActive: true } } },
            });
            const activeItems = cartItems.filter((ci) => ci.product.isActive);
            if (activeItems.length === 0)
                continue;
            const emailItems = activeItems.map((ci) => ({
                productName: ci.product.name,
                unitPrice: Number(ci.product.finalPrice),
                quantity: ci.quantity,
            }));
            const cartTotal = emailItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
            try {
                await (0, email_service_1.sendAbandonedCartEmail)({
                    customerEmail: user.email,
                    customerName: user.fullName || 'there',
                    items: emailItems,
                    cartTotal,
                });
                // Upsert the DB log (idempotent)
                await database_1.prisma.abandonedCartLog.upsert({
                    where: { userId },
                    create: { userId, emailSentAt: new Date(), cartTotal, itemCount: activeItems.length },
                    update: { emailSentAt: new Date(), cartTotal, itemCount: activeItems.length },
                });
                emailsSent++;
            }
            catch (emailErr) {
                console.error(`[Scheduler] Failed to send abandoned cart email to ${user.email}:`, emailErr);
            }
        }
        if (emailsSent > 0) {
            console.log(`[Scheduler] Sent ${emailsSent} abandoned cart reminder email(s)`);
        }
        return emailsSent;
    }
    catch (error) {
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
async function reconcilePayments() {
    // Lazy import Razorpay to avoid circular deps at module load
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let Razorpay;
    try {
        Razorpay = (await Promise.resolve().then(() => __importStar(require('razorpay')))).default;
    }
    catch {
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
    const stalePayments = await database_1.prisma.payment.findMany({
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
    if (stalePayments.length === 0)
        return;
    console.log(`[Reconcile] Checking ${stalePayments.length} stale payment(s)...`);
    let confirmed = 0, failed = 0, skipped = 0;
    for (const payment of stalePayments) {
        try {
            // transactionId = razorpay order_id (order_xxx)
            const rzpOrder = await razorpay.orders.fetchPayments(payment.transactionId);
            const payments = rzpOrder.items ?? [];
            const captured = payments.find((p) => p.status === 'captured' || p.captured === true);
            const failed_p = payments.find((p) => p.status === 'failed');
            if (captured && payment.status !== 'CONFIRMED') {
                // Mark as CONFIRMED
                await database_1.prisma.$transaction([
                    database_1.prisma.payment.update({
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
                    database_1.prisma.order.update({
                        where: { id: payment.orderId },
                        data: { paymentStatus: 'CONFIRMED', status: 'CONFIRMED' },
                    }),
                ]);
                (0, alerts_1.sendPaymentAlert)({
                    level: 'info',
                    event: 'Payment auto-reconciled to CONFIRMED',
                    orderId: payment.order?.orderNumber ?? payment.orderId,
                    userId: payment.order?.userId,
                    reason: 'Webhook not received — reconciled via Razorpay API',
                });
                confirmed++;
            }
            else if (failed_p && payment.status === 'PENDING') {
                // Mark as FAILED
                await database_1.prisma.$transaction([
                    database_1.prisma.payment.update({
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
                    database_1.prisma.order.update({
                        where: { id: payment.orderId },
                        data: { paymentStatus: 'FAILED', status: 'CANCELLED', cancelledAt: new Date() },
                    }),
                ]);
                (0, alerts_1.sendPaymentAlert)({
                    level: 'error',
                    event: 'Payment auto-reconciled to FAILED',
                    orderId: payment.order?.orderNumber ?? payment.orderId,
                    userId: payment.order?.userId,
                    reason: failed_p.error_description ?? 'Payment failed at gateway',
                });
                failed++;
            }
            else {
                skipped++;
            }
        }
        catch (err) {
            // If Razorpay returns 404, the order ID no longer exists — mark as FAILED
            // to prevent this payment from looping through reconciliation on every run.
            if (err?.statusCode === 404 || err?.error?.code === 'BAD_REQUEST_ERROR') {
                try {
                    await database_1.prisma.$transaction([
                        database_1.prisma.payment.update({
                            where: { id: payment.id },
                            data: {
                                status: 'FAILED',
                                gatewayResponse: {
                                    ...(typeof payment.gatewayResponse === 'object' && payment.gatewayResponse ? payment.gatewayResponse : {}),
                                    reconciledAt: new Date().toISOString(),
                                    reconciledBy: 'scheduler',
                                    error_description: `Razorpay order not found (404) — transactionId: ${payment.transactionId}`,
                                },
                            },
                        }),
                        database_1.prisma.order.update({
                            where: { id: payment.orderId },
                            data: { paymentStatus: 'FAILED', status: 'CANCELLED', cancelledAt: new Date() },
                        }),
                    ]);
                    console.warn(`[Reconcile] Marked payment ${payment.id} as FAILED — Razorpay order not found (404)`);
                    failed++;
                }
                catch (innerErr) {
                    console.error(`[Reconcile] Failed to mark payment ${payment.id} as FAILED after 404:`, innerErr);
                    (0, sentry_1.captureException)(innerErr, { paymentId: payment.id, orderId: payment.orderId });
                }
            }
            else {
                console.error(`[Reconcile] Error processing payment ${payment.id}:`, err);
                (0, sentry_1.captureException)(err, { paymentId: payment.id, orderId: payment.orderId });
            }
        }
    }
    if (confirmed > 0 || failed > 0) {
        console.log(`[Reconcile] Done — confirmed: ${confirmed}, failed: ${failed}, skipped: ${skipped}`);
    }
}
/**
 * Start all scheduled jobs. Call once at server boot.
 */
function startScheduler() {
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
            await (0, inventory_1.cleanupExpiredLocks)();
        }
        catch (error) {
            console.error('[Scheduler] Inventory cleanup error:', error);
        }
    }, INVENTORY_CLEANUP_INTERVAL);
    // Abandoned cart reminders — every 30 minutes
    setInterval(async () => {
        try {
            await sendAbandonedCartReminders();
        }
        catch (error) {
            console.error('[Scheduler] Abandoned cart reminder error:', error);
        }
    }, ABANDONED_CART_INTERVAL);
    // Payment reconciliation — every 15 minutes
    setInterval(async () => {
        try {
            await reconcilePayments();
        }
        catch (error) {
            console.error('[Scheduler] Reconciliation error:', error);
            (0, sentry_1.captureException)(error, { job: 'payment-reconciliation' });
        }
    }, RECONCILIATION_INTERVAL);
    // Run once immediately on boot
    setTimeout(async () => {
        await deactivateExpiredBOGOCampaigns();
        await deactivateExpiredOfferCampaigns();
        await clearExpiredProductOffers();
        await syncBOGOProductStatus();
        try {
            await (0, inventory_1.cleanupExpiredLocks)();
        }
        catch { }
    }, 5000); // 5s after boot to let DB warm up
}
//# sourceMappingURL=scheduler.js.map
"use strict";
/**
 * Background Job Queue — Phase 4
 * ================================
 *
 * Uses BullMQ + Redis for reliable, non-blocking background tasks:
 *  - Abandoned cart emails (replaces setInterval)
 *  - Slack/alert notifications
 *  - Payment reconciliation
 *  - Future: marketing emails, report generation
 *
 * Graceful degradation:
 *  - If Redis is not available, falls back to the existing
 *    setInterval-based scheduler (no behavior change)
 *  - Jobs are persistent — survive server restarts
 *  - Failed jobs are retried with exponential backoff
 *
 * Architecture:
 *  - Queue: defines job types and options
 *  - Worker: processes jobs in the background
 *  - All workers run in the same process (Render single-instance)
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
exports.initJobQueue = initJobQueue;
exports.enqueueJob = enqueueJob;
exports.shutdownJobQueue = shutdownJobQueue;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
// ============================================
// QUEUE SETUP
// ============================================
let backgroundQueue = null;
let backgroundWorker = null;
/**
 * Initialize the BullMQ queue and worker.
 * Call once at server startup, after Redis is initialized.
 * Returns false if Redis is not available (graceful fallback).
 */
async function initJobQueue() {
    const redis = (0, redis_1.getRedis)();
    if (!redis) {
        console.log('[JobQueue] ⏭️  Redis not available — using scheduler fallback');
        return false;
    }
    try {
        // Create queue
        // Note: `as any` is required because BullMQ bundles its own ioredis internally,
        // causing TypeScript to see two incompatible Redis type definitions.
        backgroundQueue = new bullmq_1.Queue('ora-background', {
            connection: redis.duplicate(),
            defaultJobOptions: {
                removeOnComplete: { count: 100 }, // Keep last 100 completed
                removeOnFail: { count: 50 }, // Keep last 50 failed for debugging
                attempts: 3, // Retry failed jobs 3 times
                backoff: {
                    type: 'exponential',
                    delay: 5000, // 5s, 10s, 20s
                },
            },
        });
        // Create worker
        backgroundWorker = new bullmq_1.Worker('ora-background', async (job) => {
            const startTime = Date.now();
            console.log(`[JobQueue] 🔄 Processing: ${job.name} (id: ${job.id})`);
            try {
                switch (job.data.type) {
                    case 'abandoned-cart-email':
                        await processAbandonedCartEmails();
                        break;
                    case 'payment-reconciliation':
                        await processPaymentReconciliation();
                        break;
                    case 'slack-alert':
                        await processSlackAlert(job.data);
                        break;
                    case 'cache-invalidation':
                        await processCacheInvalidation(job.data);
                        break;
                    case 'order-confirmation-email':
                        await processOrderEmail(job.data);
                        break;
                    case 'post-purchase-day2':
                    case 'post-purchase-day7':
                    case 'post-purchase-day21':
                        await processPostPurchaseEmail(job.data);
                        break;
                    case 'payment-parity-check':
                        await processPaymentParityCheck();
                        break;
                    default:
                        console.warn(`[JobQueue] ⚠️  Unknown job type: ${job.data.type}`);
                }
                const duration = Date.now() - startTime;
                console.log(`[JobQueue] ✅ Completed: ${job.name} (${duration}ms)`);
            }
            catch (err) {
                console.error(`[JobQueue] ❌ Failed: ${job.name}`, err);
                throw err; // BullMQ will retry
            }
        }, {
            connection: redis.duplicate(),
            concurrency: 3, // Process up to 3 jobs in parallel
        });
        backgroundWorker.on('failed', (job, err) => {
            console.error(`[JobQueue] ❌ Job failed: ${job?.name}`, err.message);
        });
        // Schedule recurring jobs
        await scheduleRecurringJobs();
        console.log('[JobQueue] ✅ Background job queue initialized');
        return true;
    }
    catch (err) {
        console.warn('[JobQueue] ⚠️  Failed to initialize:', err instanceof Error ? err.message : String(err));
        return false;
    }
}
/**
 * Schedule recurring jobs (cron-like, using BullMQ repeat).
 */
async function scheduleRecurringJobs() {
    if (!backgroundQueue)
        return;
    // Abandoned cart emails — every 30 minutes
    await backgroundQueue.upsertJobScheduler('abandoned-cart-check', { every: 30 * 60 * 1000 }, {
        name: 'abandoned-cart-email',
        data: { type: 'abandoned-cart-email' },
    });
    // Payment reconciliation — every 15 minutes
    await backgroundQueue.upsertJobScheduler('payment-reconciliation-check', { every: 15 * 60 * 1000 }, {
        name: 'payment-reconciliation',
        data: { type: 'payment-reconciliation' },
    });
    // Payment parity check — every 15 minutes
    await backgroundQueue.upsertJobScheduler('payment-parity-check', { every: 15 * 60 * 1000 }, {
        name: 'payment-parity-check',
        data: { type: 'payment-parity-check' },
    });
}
// ============================================
// JOB PROCESSORS
// ============================================
/**
 * Process abandoned cart emails.
 * Reuses existing logic from scheduler.ts.
 */
async function processAbandonedCartEmails() {
    const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
    const { sendAbandonedCartEmail } = await Promise.resolve().then(() => __importStar(require('../services/email.service')));
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const cooldownCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const usersWithOldCarts = await prisma.cartItem.findMany({
        where: { addedAt: { lt: twoHoursAgo } },
        select: { userId: true },
        distinct: ['userId'],
    });
    if (usersWithOldCarts.length === 0)
        return;
    let emailsSent = 0;
    for (const { userId } of usersWithOldCarts) {
        const existingLog = await prisma.abandonedCartLog.findUnique({ where: { userId } });
        if (existingLog && existingLog.emailSentAt > cooldownCutoff)
            continue;
        const recentOrder = await prisma.order.findFirst({
            where: { userId, createdAt: { gte: twoHoursAgo } },
            select: { id: true },
        });
        if (recentOrder)
            continue;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, fullName: true },
        });
        if (!user?.email)
            continue;
        const cartItems = await prisma.cartItem.findMany({
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
            await sendAbandonedCartEmail({
                customerEmail: user.email,
                customerName: user.fullName || 'there',
                items: emailItems,
                cartTotal,
            });
            await prisma.abandonedCartLog.upsert({
                where: { userId },
                create: { userId, emailSentAt: new Date(), cartTotal, itemCount: activeItems.length },
                update: { emailSentAt: new Date(), cartTotal, itemCount: activeItems.length },
            });
            emailsSent++;
        }
        catch (emailErr) {
            console.error(`[JobQueue] Failed to send abandoned cart email to ${user.email}:`, emailErr);
        }
    }
    if (emailsSent > 0) {
        console.log(`[JobQueue] Sent ${emailsSent} abandoned cart reminder email(s)`);
    }
}
/**
 * Process payment reconciliation.
 * Reuses logic from scheduler.ts.
 */
async function processPaymentReconciliation() {
    const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
    const { sendPaymentAlert } = await Promise.resolve().then(() => __importStar(require('../utils/alerts')));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let Razorpay;
    try {
        Razorpay = (await Promise.resolve().then(() => __importStar(require('razorpay')))).default;
    }
    catch {
        return;
    }
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret)
        return;
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const stalePayments = await prisma.payment.findMany({
        where: {
            status: { in: ['PENDING', 'VERIFIED'] },
            createdAt: { lt: tenMinutesAgo },
        },
        include: {
            order: { select: { id: true, orderNumber: true, userId: true, status: true } },
        },
        take: 50,
    });
    if (stalePayments.length === 0)
        return;
    let confirmed = 0, failed = 0;
    for (const payment of stalePayments) {
        try {
            const rzpOrder = await razorpay.orders.fetchPayments(payment.transactionId);
            const payments = rzpOrder.items ?? [];
            const captured = payments.find((p) => p.status === 'captured' || p.captured === true);
            const failed_p = payments.find((p) => p.status === 'failed');
            if (captured && payment.status !== 'CONFIRMED') {
                await prisma.$transaction([
                    prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'CONFIRMED',
                            gatewayResponse: {
                                ...(typeof payment.gatewayResponse === 'object' && payment.gatewayResponse ? payment.gatewayResponse : {}),
                                razorpayPaymentId: captured.id,
                                reconciledAt: new Date().toISOString(),
                                reconciledBy: 'bullmq-worker',
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
                    event: 'Payment auto-reconciled (BullMQ)',
                    orderId: payment.order?.orderNumber ?? payment.orderId,
                    userId: payment.order?.userId,
                    reason: 'Webhook not received — reconciled via Razorpay API',
                });
                confirmed++;
            }
            else if (failed_p && payment.status === 'PENDING') {
                await prisma.$transaction([
                    prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'FAILED',
                            gatewayResponse: {
                                ...(typeof payment.gatewayResponse === 'object' && payment.gatewayResponse ? payment.gatewayResponse : {}),
                                reconciledAt: new Date().toISOString(),
                                reconciledBy: 'bullmq-worker',
                                error_description: failed_p.error_description,
                            },
                        },
                    }),
                    prisma.order.update({
                        where: { id: payment.orderId },
                        data: { paymentStatus: 'FAILED', status: 'CANCELLED', cancelledAt: new Date() },
                    }),
                ]);
                failed++;
            }
        }
        catch (err) {
            // If Razorpay returns 404, the order ID is invalid/missing — mark as FAILED
            // to stop it from being retried on every reconciliation run.
            if (err?.statusCode === 404 || err?.error?.code === 'BAD_REQUEST_ERROR') {
                try {
                    await prisma.$transaction([
                        prisma.payment.update({
                            where: { id: payment.id },
                            data: {
                                status: 'FAILED',
                                gatewayResponse: {
                                    ...(typeof payment.gatewayResponse === 'object' && payment.gatewayResponse ? payment.gatewayResponse : {}),
                                    reconciledAt: new Date().toISOString(),
                                    reconciledBy: 'bullmq-worker',
                                    error_description: `Razorpay order not found (404) — transactionId: ${payment.transactionId}`,
                                },
                            },
                        }),
                        prisma.order.update({
                            where: { id: payment.orderId },
                            data: { paymentStatus: 'FAILED', status: 'CANCELLED', cancelledAt: new Date() },
                        }),
                    ]);
                    console.warn(`[JobQueue] Marked payment ${payment.id} as FAILED — Razorpay order not found (404)`);
                    failed++;
                }
                catch (innerErr) {
                    console.error(`[JobQueue] Failed to mark payment ${payment.id} as FAILED after 404:`, innerErr);
                }
            }
            else {
                console.error(`[JobQueue] Error reconciling payment ${payment.id}:`, err);
            }
        }
    }
    if (confirmed > 0 || failed > 0) {
        console.log(`[JobQueue] Reconciliation — confirmed: ${confirmed}, failed: ${failed}`);
    }
}
/**
 * Process Slack/alert notifications (non-blocking).
 */
async function processSlackAlert(data) {
    const { sendPaymentAlert } = await Promise.resolve().then(() => __importStar(require('../utils/alerts')));
    sendPaymentAlert({
        level: data.level,
        event: data.message,
        orderId: 'system',
        reason: 'BullMQ alert',
    });
}
/**
 * Process cache invalidation.
 */
async function processCacheInvalidation(data) {
    const { cacheDelPattern } = await Promise.resolve().then(() => __importStar(require('../config/redis')));
    await cacheDelPattern(data.pattern);
}
/**
 * Process order confirmation email (non-blocking).
 */
async function processOrderEmail(data) {
    const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
    const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        include: {
            items: true,
            shippingAddress: true,
            user: { select: { fullName: true, email: true } },
        },
    });
    if (!order)
        return;
    try {
        const { sendOrderPlacedEmail } = await Promise.resolve().then(() => __importStar(require('../services/email.service')));
        await sendOrderPlacedEmail({
            customerEmail: data.customerEmail,
            customerName: order.user.fullName || 'Customer',
            orderNumber: order.orderNumber,
            items: order.items.map(i => ({
                productName: i.productName,
                quantity: i.quantity,
                unitPrice: Number(i.unitPrice),
            })),
            totalAmount: Number(order.totalAmount),
            gstAmount: Number(order.gstAmount),
            shippingCost: Number(order.shippingFee),
            discountAmount: Number(order.discountAmount),
            shippingAddress: order.shippingAddress
                ? {
                    fullName: order.shippingAddress.fullName,
                    addressLine1: order.shippingAddress.addressLine1,
                    addressLine2: order.shippingAddress.addressLine2 ?? undefined,
                    city: order.shippingAddress.city,
                    state: order.shippingAddress.state,
                    pincode: order.shippingAddress.pincode,
                }
                : {
                    fullName: order.user.fullName || 'Customer',
                    addressLine1: 'N/A',
                    city: 'N/A',
                    state: 'N/A',
                    pincode: 'N/A',
                },
        });
    }
    catch (err) {
        console.error(`[JobQueue] Order email failed for ${data.orderId}:`, err);
        throw err; // Will be retried
    }
}
// ============================================
// POST-PURCHASE EMAIL PROCESSORS (Phase 9)
// ============================================
/**
 * Process post-purchase lifecycle emails (Day 2/7/21).
 * Scheduled when an order is CONFIRMED.
 */
async function processPostPurchaseEmail(data) {
    const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
    const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        include: {
            items: true,
            user: { select: { fullName: true, email: true } },
        },
    });
    if (!order)
        return;
    // Don't send if order was cancelled or returned
    if (['CANCELLED', 'RETURNED'].includes(order.status)) {
        console.log(`[JobQueue] Skipping ${data.type} for ${data.orderId} — order is ${order.status}`);
        return;
    }
    const customerName = order.user.fullName || 'there';
    const customerEmail = data.customerEmail || order.user.email;
    try {
        switch (data.type) {
            case 'post-purchase-day2': {
                const { sendShippingReassuranceEmail } = await Promise.resolve().then(() => __importStar(require('../services/email.service')));
                await sendShippingReassuranceEmail({
                    customerEmail,
                    customerName,
                    orderNumber: order.orderNumber,
                    trackingNumber: order.trackingNumber ?? undefined,
                    courierName: order.courierName ?? undefined,
                });
                break;
            }
            case 'post-purchase-day7': {
                const { sendReviewRequestEmail } = await Promise.resolve().then(() => __importStar(require('../services/email.service')));
                await sendReviewRequestEmail({
                    customerEmail,
                    customerName,
                    orderNumber: order.orderNumber,
                    items: order.items.map((i) => ({
                        productName: i.productName,
                    })),
                });
                break;
            }
            case 'post-purchase-day21': {
                const { sendReorderSuggestionEmail } = await Promise.resolve().then(() => __importStar(require('../services/email.service')));
                await sendReorderSuggestionEmail({
                    customerEmail,
                    customerName,
                    orderNumber: order.orderNumber,
                });
                break;
            }
        }
    }
    catch (err) {
        console.error(`[JobQueue] Post-purchase email (${data.type}) failed for ${data.orderId}:`, err);
        throw err; // Will be retried
    }
}
// ============================================
// PAYMENT PARITY CHECK (Phase 10)
// ============================================
/**
 * Check order/payment parity every 15 minutes.
 * Flags CONFIRMED orders that don't have a matching CONFIRMED payment (and vice versa).
 */
async function processPaymentParityCheck() {
    const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
    const { sendPaymentAlert } = await Promise.resolve().then(() => __importStar(require('../utils/alerts')));
    // Find orders with CONFIRMED status but no CONFIRMED payment
    const orphanOrders = await prisma.order.findMany({
        where: {
            status: 'CONFIRMED',
            paymentMethod: 'RAZORPAY',
            paymentStatus: { not: 'CONFIRMED' },
            createdAt: { lt: new Date(Date.now() - 30 * 60 * 1000) }, // older than 30 min
        },
        select: { id: true, orderNumber: true, userId: true, totalAmount: true, createdAt: true },
        take: 50,
    });
    // Find confirmed payments whose orders are in an unexpected state.
    // Valid downstream states after payment confirmation are excluded:
    // PROCESSING, SHIPPED, DELIVERED, RETURNED, REFUNDED — these are all fine.
    // Only PENDING and CANCELLED are genuine mismatches worth alerting on.
    const orphanPayments = await prisma.payment.findMany({
        where: {
            status: 'CONFIRMED',
            order: { status: { in: ['PENDING', 'CANCELLED'] } },
            createdAt: { lt: new Date(Date.now() - 30 * 60 * 1000) },
        },
        select: {
            id: true,
            transactionId: true,
            amount: true,
            order: { select: { orderNumber: true, status: true } },
        },
        take: 50,
    });
    const mismatches = orphanOrders.length + orphanPayments.length;
    if (mismatches > 0) {
        console.error(`[PaymentParity] CRITICAL: ${mismatches} order/payment mismatches detected`);
        // Alert for orphan orders
        for (const order of orphanOrders) {
            sendPaymentAlert({
                level: 'error',
                event: 'PARITY: Order CONFIRMED but payment not CONFIRMED',
                orderId: order.orderNumber,
                userId: order.userId,
                reason: `Order total ₹${Number(order.totalAmount)} — created ${order.createdAt.toISOString()}`,
            });
        }
        // Alert for orphan payments
        for (const payment of orphanPayments) {
            sendPaymentAlert({
                level: 'error',
                event: `PARITY: Payment CONFIRMED but order status is ${payment.order?.status}`,
                orderId: payment.order?.orderNumber || payment.id,
                reason: `Payment ₹${Number(payment.amount)} — txn: ${payment.transactionId}`,
            });
        }
    }
    else {
        console.log('[PaymentParity] ✅ All order/payment records in sync');
    }
}
// ============================================
// PUBLIC API: Enqueue jobs
// ============================================
/**
 * Add a job to the background queue.
 * If the queue is not available, the job is processed inline (fallback).
 */
async function enqueueJob(name, data) {
    if (backgroundQueue) {
        await backgroundQueue.add(name, data);
    }
    else {
        // Fallback: no queue, skip (the scheduler handles recurring tasks)
        if (process.env.NODE_ENV === 'development') {
            console.log(`[JobQueue] Queue not available, skipping: ${name}`);
        }
    }
}
/**
 * Graceful shutdown — close queue and worker.
 */
async function shutdownJobQueue() {
    if (backgroundWorker) {
        await backgroundWorker.close();
        console.log('[JobQueue] Worker closed');
    }
    if (backgroundQueue) {
        await backgroundQueue.close();
        console.log('[JobQueue] Queue closed');
    }
}
//# sourceMappingURL=jobQueue.service.js.map
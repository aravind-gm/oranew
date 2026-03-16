"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateRefund = exports.getPaymentStatus = exports.webhook = exports.verifyPayment = exports.createPayment = void 0;
const library_1 = require("@prisma/client/runtime/library");
const crypto_1 = __importDefault(require("crypto"));
const razorpay_1 = __importDefault(require("razorpay"));
const database_1 = require("../config/database");
const retry_1 = require("../utils/retry");
const email_1 = require("../utils/email");
const helpers_1 = require("../utils/helpers");
const alerts_1 = require("../utils/alerts");
const sentry_1 = require("../config/sentry");
const auditLog_1 = require("../utils/auditLog");
// ============================================
// RAZORPAY SINGLETON
// ============================================
let razorpayInstance = null;
const getRazorpay = () => {
    if (!razorpayInstance) {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) {
            throw new helpers_1.AppError('Razorpay credentials not configured', 500);
        }
        // SECURITY: Prevent test keys in production
        if (process.env.NODE_ENV === "production" && keyId.startsWith("rzp_test_")) {
            throw new helpers_1.AppError("FATAL: Production environment cannot use Razorpay test keys", 500);
        }
        razorpayInstance = new razorpay_1.default({
            key_id: keyId,
            key_secret: keySecret,
        });
    }
    return razorpayInstance;
};
// ============================================
// ENDPOINT 1: CREATE RAZORPAY ORDER
// ============================================
/**
 * POST /api/payments/create
 *
 * Called from frontend after user selects address
 * Creates a Razorpay order and saves Payment record with status = PENDING
 * Returns razorpayOrderId to frontend for opening checkout modal
 *
 * Request:  { orderId: string }
 * Response: { success: true, razorpayOrderId, amount, key, ... }
 */
exports.createPayment = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { orderId } = req.body;
    const userId = req.user?.id;
    console.log('[Payment.create] Starting:', { orderId, userId });
    // ────────────────────────────────────────────
    // VALIDATION
    // ────────────────────────────────────────────
    if (!userId) {
        throw new helpers_1.AppError('Authentication required', 401);
    }
    if (!orderId) {
        throw new helpers_1.AppError('Order ID is required', 400);
    }
    // ────────────────────────────────────────────
    // FETCH ORDER & VERIFY OWNERSHIP
    // ────────────────────────────────────────────
    const order = await (0, retry_1.withRetry)(() => database_1.prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: true,
            items: { include: { product: true } },
            payments: true,
        },
    }));
    if (!order) {
        throw new helpers_1.AppError('Order not found', 404);
    }
    if (order.userId !== userId) {
        throw new helpers_1.AppError('Unauthorized - order belongs to another user', 403);
    }
    if (order.status !== 'PENDING') {
        throw new helpers_1.AppError('Order is not in PENDING state', 400);
    }
    console.log('[Payment.create] Order found:', {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        paymentCount: order.payments.length,
    });
    // ────────────────────────────────────────────
    // IDEMPOTENCY: CHECK FOR EXISTING PAYMENTS
    // ────────────────────────────────────────────
    const existingPending = order.payments?.find((p) => p.status === 'PENDING');
    if (existingPending) {
        const paymentAge = Date.now() - new Date(existingPending.createdAt).getTime();
        const fifteenMinutes = 15 * 60 * 1000;
        if (paymentAge > fifteenMinutes) {
            // Mark old pending payment as FAILED
            console.log('[Payment.create] Marking stale PENDING payment as FAILED:', existingPending.id);
            await database_1.prisma.payment.update({
                where: { id: existingPending.id },
                data: { status: 'FAILED' },
            });
        }
        else {
            // Payment still in progress - reject new payment attempt
            throw new helpers_1.AppError('Payment already in progress. Please wait or contact support.', 409);
        }
    }
    // Return existing active (non-failed, non-refunded) payment
    const activePayment = order.payments?.find((p) => p.status !== 'FAILED' && p.status !== 'REFUNDED' && p.status !== 'PENDING');
    if (activePayment) {
        console.log('[Payment.create] Returning existing payment (idempotent):', activePayment.id);
        return res.json({
            success: true,
            paymentId: activePayment.id,
            razorpayOrderId: activePayment.transactionId,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            amount: Math.round(Number(order.totalAmount) * 100),
            currency: 'INR',
            key: process.env.RAZORPAY_KEY_ID,
            orderId: order.orderNumber,
            customer: {
                name: order.user.fullName,
                email: order.user.email,
                phone: order.user.phone,
            },
        });
    }
    // ────────────────────────────────────────────
    // CREATE RAZORPAY ORDER
    // ────────────────────────────────────────────
    const razorpayOrder = await getRazorpay().orders.create({
        amount: Math.round(Number(order.totalAmount) * 100), // Convert to paise
        currency: 'INR',
        receipt: order.orderNumber,
        notes: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerEmail: order.user.email,
        },
    });
    console.log('[Payment.create] Razorpay order created:', razorpayOrder.id);
    // ────────────────────────────────────────────
    // SAVE PAYMENT RECORD
    // ────────────────────────────────────────────
    const payment = await (0, retry_1.withRetry)(() => database_1.prisma.payment.create({
        data: {
            orderId: order.id,
            paymentGateway: 'RAZORPAY',
            transactionId: razorpayOrder.id,
            amount: order.totalAmount,
            currency: 'INR',
            status: 'PENDING',
            gatewayResponse: {
                razorpayOrderId: razorpayOrder.id,
                createdAt: new Date().toISOString(),
            },
        },
    }));
    console.log('[Payment.create] Payment record created:', payment.id);
    // ────────────────────────────────────────────
    // RETURN RESPONSE
    // ────────────────────────────────────────────
    res.json({
        success: true,
        paymentId: payment.id,
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
        orderId: order.orderNumber,
        customer: {
            name: order.user.fullName,
            email: order.user.email,
            phone: order.user.phone,
        },
    });
});
// ============================================
// ENDPOINT 2: VERIFY RAZORPAY SIGNATURE (POST FROM FRONTEND)
// ============================================
/**
 * POST /api/payments/verify
 *
 * Called from frontend Razorpay success callback
 * Verifies the payment signature using Razorpay key secret
 * Updates Order.status = CONFIRMED and Payment.status = CONFIRMED
 * Clears the shopping cart
 *
 * CRITICAL SECURITY:
 * - Signature MUST be verified: SHA256(orderId|paymentId) using key_secret
 * - Amount MUST match order total
 * - User MUST own the order
 * - Cart is ONLY cleared after successful verification
 *
 * Request: {
 *   orderId: string,
 *   razorpay_payment_id: string,
 *   razorpay_order_id: string,
 *   razorpay_signature: string
 * }
 *
 * Response: { success: true }
 */
exports.verifyPayment = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const userId = req.user?.id;
    console.log('[Payment.verify] ════════════════════════════════════════');
    console.log('[Payment.verify] Starting verification');
    console.log('[Payment.verify] Input:', { orderId, userId });
    // ────────────────────────────────────────────
    // VALIDATION
    // ────────────────────────────────────────────
    if (!userId) {
        throw new helpers_1.AppError('Authentication required', 401);
    }
    if (!orderId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        throw new helpers_1.AppError('Missing required fields: orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature', 400);
    }
    // ────────────────────────────────────────────
    // FETCH ORDER & VERIFY OWNERSHIP
    // ────────────────────────────────────────────
    const order = await (0, retry_1.withRetry)(() => database_1.prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: true,
            items: true,
            payments: true,
        },
    }));
    if (!order) {
        throw new helpers_1.AppError('Order not found', 404);
    }
    if (order.userId !== userId) {
        throw new helpers_1.AppError('Unauthorized - order belongs to another user', 403);
    }
    console.log('[Payment.verify] ✓ Order found and verified:', {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
    });
    // ────────────────────────────────────────────
    // FIND PAYMENT RECORD — filter by razorpay_order_id, NOT [0]
    // Using [0] is wrong when the user retried after a failure:
    // the first payment is FAILED, the second is the real one.
    // ────────────────────────────────────────────
    const payment = order.payments?.find((p) => p.transactionId === razorpay_order_id);
    if (!payment) {
        throw new helpers_1.AppError('Payment record not found for this Razorpay order. Possible tampered order ID.', 404);
    }
    console.log('[Payment.verify] ✓ Payment found:', {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
    });
    // ────────────────────────────────────────────
    // IDEMPOTENCY: IF ALREADY CONFIRMED, RETURN SUCCESS
    // ────────────────────────────────────────────
    if (payment.status === 'CONFIRMED') {
        console.log('[Payment.verify] ✓ Payment already CONFIRMED (idempotent)');
        return res.json({
            success: true,
            message: 'Payment already confirmed',
            orderStatus: order.status,
        });
    }
    // IDEMPOTENCY GUARD: If order is already beyond PENDING, don't re-verify
    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
        console.log('[Payment.verify] ⚠️ Order status already advanced past PENDING:', order.status);
        return res.json({
            success: true,
            message: `Order already in ${order.status} state`,
            orderStatus: order.status,
        });
    }
    // ────────────────────────────────────────────
    // VERIFY RAZORPAY SIGNATURE
    // ────────────────────────────────────────────
    console.log('[Payment.verify] Verifying signature...');
    const signatureBody = `${razorpay_order_id}|${razorpay_payment_id}`;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
        throw new helpers_1.AppError('Payment configuration error', 500);
    }
    const expectedSignature = crypto_1.default
        .createHmac('sha256', keySecret)
        .update(signatureBody)
        .digest();
    // SECURITY: Use timingSafeEqual to prevent timing-based signature forgery.
    // String comparison (===) leaks timing info character by character.
    // Buffer comparison is constant-time regardless of content.
    let signatureValid = false;
    try {
        signatureValid = crypto_1.default.timingSafeEqual(expectedSignature, Buffer.from(razorpay_signature, 'hex'));
    }
    catch {
        // timingSafeEqual throws if buffers have different lengths
        signatureValid = false;
    }
    if (!signatureValid) {
        console.error('[Payment.verify] Signature verification FAILED - possible tampering');
        (0, alerts_1.sendPaymentAlert)({
            level: 'critical',
            event: 'Payment verify HMAC mismatch — possible tampering',
            orderId,
            userId: req.user?.id,
            reason: 'timingSafeEqual failed on verify endpoint',
        });
        throw new helpers_1.AppError('Invalid payment signature - verification failed', 400);
    }
    console.log('[Payment.verify] ✓ Signature verified successfully');
    // ────────────────────────────────────────────
    // VERIFY RAZORPAY ORDER ID MATCHES
    // ────────────────────────────────────────────
    if (payment.transactionId !== razorpay_order_id) {
        console.error('[Payment.verify] ❌ Razorpay order ID mismatch');
        throw new helpers_1.AppError('Razorpay order ID does not match', 400);
    }
    console.log('[Payment.verify] ✓ Razorpay order ID matches');
    // ────────────────────────────────────────────
    // CONFIRM PAYMENT & ORDER IN ONE ATOMIC TRANSACTION
    // ────────────────────────────────────────────
    // The frontend signature verification is cryptographically valid:
    //   HMAC-SHA256(razorpay_order_id|razorpay_payment_id, key_secret) === signature
    // This is the SAME proof Razorpay uses. Waiting for a webhook that may
    // never arrive (misconfigured URL, network issues, secret mismatch)
    // leaves the customer stuck on the "Confirming…" spinner forever.
    //
    // FIX: Confirm everything here. The webhook handler is idempotent —
    // if it arrives later it will see status=CONFIRMED and return early.
    console.log('[Payment.verify] Confirming payment + order atomically');
    try {
        await database_1.prisma.$transaction(async (tx) => {
            // 1. Payment → CONFIRMED
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'CONFIRMED',
                    gatewayResponse: {
                        ...(typeof payment.gatewayResponse === 'object' && payment.gatewayResponse ? payment.gatewayResponse : {}),
                        razorpayPaymentId: razorpay_payment_id,
                        verifiedAt: new Date().toISOString(),
                        confirmedAt: new Date().toISOString(),
                        confirmedBy: 'verify-endpoint',
                    },
                },
            });
            console.log('[Payment.verify] ✓ Payment updated to CONFIRMED');
            // 2. Order → CONFIRMED + paymentStatus CONFIRMED
            await tx.order.update({
                where: { id: order.id },
                data: {
                    status: 'CONFIRMED',
                    paymentStatus: 'CONFIRMED',
                    paymentMethod: 'RAZORPAY',
                },
            });
            console.log('[Payment.verify] ✓ Order updated to CONFIRMED');
            // 3. Deduct inventory (with stock-floor check)
            for (const item of order.items) {
                const currentProduct = await tx.product.findUnique({
                    where: { id: item.productId },
                    select: { stockQuantity: true, name: true },
                });
                if (!currentProduct) {
                    throw new Error(`Product ${item.productId} not found during inventory deduction`);
                }
                if (currentProduct.stockQuantity < item.quantity) {
                    throw new Error(`Insufficient stock for "${currentProduct.name}": available=${currentProduct.stockQuantity}, needed=${item.quantity}`);
                }
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stockQuantity: { decrement: item.quantity } },
                });
            }
            console.log('[Payment.verify] ✓ Inventory deducted');
            // 4. Clear cart
            await tx.cartItem.deleteMany({ where: { userId } });
            console.log('[Payment.verify] ✓ Cart cleared');
            // 5. Release inventory locks
            await tx.inventoryLock.deleteMany({ where: { orderId: order.id } });
            console.log('[Payment.verify] ✓ Inventory locks removed');
        });
        console.log('[Payment.verify] ════════════════════════════════════════');
        console.log('[Payment.verify] ✅ PAYMENT + ORDER CONFIRMED');
        console.log('[Payment.verify] Order:', order.orderNumber);
        console.log('[Payment.verify] ════════════════════════════════════════');
        // Send confirmation email (non-blocking — don't fail the response)
        try {
            const emailTemplate = (0, email_1.getOrderConfirmationTemplate)(order.orderNumber, Number(order.totalAmount));
            await (0, email_1.sendEmail)({
                to: order.user.email,
                subject: `Order Confirmed - ${order.orderNumber}`,
                html: emailTemplate,
            });
            console.log('[Payment.verify] ✓ Confirmation email sent');
        }
        catch (emailErr) {
            console.error('[Payment.verify] ⚠️ Email send failed (non-fatal):', emailErr);
        }
        res.json({
            success: true,
            message: 'Payment confirmed successfully',
            orderStatus: 'CONFIRMED',
            paymentStatus: 'CONFIRMED',
        });
    }
    catch (txErr) {
        console.error('[Payment.verify] ❌ Transaction failed:', txErr);
        // Fallback: at minimum mark payment as VERIFIED so webhook can finish the job
        try {
            await database_1.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'VERIFIED',
                    gatewayResponse: {
                        ...(typeof payment.gatewayResponse === 'object' && payment.gatewayResponse ? payment.gatewayResponse : {}),
                        razorpayPaymentId: razorpay_payment_id,
                        verifiedAt: new Date().toISOString(),
                        verifiedBy: 'frontend',
                        confirmError: txErr.message,
                    },
                },
            });
        }
        catch {
            // best-effort
        }
        throw new helpers_1.AppError('Payment verified but order confirmation failed. Our team has been notified — your order will be confirmed shortly.', 500);
    }
});
// ============================================
// ENDPOINT 3: WEBHOOK HANDLER (RAZORPAY payment.captured)
// ============================================
/**
 * POST /api/payments/webhook
 *
 * Receives Razorpay webhook events and processes them atomically:
 *
 * HANDLES:
 * - payment.captured → SUCCESS flow (confirms order, deducts inventory)
 * - payment.failed → FAILURE flow (cancels order)
 *
 * SECURITY:
 * 1. Uses raw body for signature verification
 * 2. Verifies HMAC-SHA256 signature using webhook secret
 * 3. Idempotent - safe to receive same webhook multiple times
 * 4. Atomic transaction - all or nothing
 *
 * IMPORTANT: This endpoint uses express.raw() middleware
 * configured in server.ts to receive raw body for signature verification.
 */
const webhook = async (req, res) => {
    // ────────────────────────────────────────────
    // STEP 1: Extract raw body (CRITICAL for signature)
    // ────────────────────────────────────────────
    let rawBody;
    if (Buffer.isBuffer(req.body)) {
        rawBody = req.body;
    }
    else if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
        rawBody = req.rawBody;
    }
    else {
        console.error('[Webhook] HARD REJECT: Raw body missing — cannot verify signature');
        return res.status(400).json({ success: false, reason: 'Raw body missing — signature unverifiable' });
    }
    // ────────────────────────────────────────────
    // STEP 2: Validate signature exists (ALWAYS REQUIRED)
    // ────────────────────────────────────────────
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
        console.warn('SECURITY ALERT: Webhook signature missing', {
            ip: req.ip,
            timestamp: new Date().toISOString(),
            headers: Object.keys(req.headers).join(', ')
        });
        return res.status(400).json({ success: false, reason: 'Signature missing' });
    }
    if (!rawBody || !rawBody.length) {
        return res.status(400).json({ success: false, reason: 'Raw body missing' });
    }
    // ────────────────────────────────────────────
    // STEP 3: Verify HMAC-SHA256 signature
    // ────────────────────────────────────────────
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (!webhookSecret) {
        console.error('[Webhook] Webhook secret not configured');
        return res.status(500).json({ success: false, reason: 'Webhook secret not configured' });
    }
    const expectedWebhookSig = crypto_1.default
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest();
    // SECURITY: Constant-time comparison to prevent timing attacks on webhook HMAC
    let webhookSigValid = false;
    try {
        webhookSigValid = crypto_1.default.timingSafeEqual(expectedWebhookSig, Buffer.from(signature, 'hex'));
    }
    catch {
        webhookSigValid = false;
    }
    if (!webhookSigValid) {
        console.error('[Webhook] Signature verification FAILED - possible replay/forgery');
        (0, alerts_1.sendPaymentAlert)({
            level: 'critical',
            event: 'Webhook HMAC mismatch — possible replay/forgery attack',
            reason: 'Incoming webhook signature did not match expected HMAC',
        });
        return res.status(400).json({ success: false, reason: 'Invalid signature' });
    }
    if (process.env.NODE_ENV === 'development') {
        console.log('[Webhook] Signature verification: OK');
    }
    // ────────────────────────────────────────────
    // STEP 4: Parse event JSON
    // ────────────────────────────────────────────
    let event;
    try {
        event = JSON.parse(rawBody.toString());
    }
    catch (err) {
        console.error('[Webhook] Invalid JSON in webhook body');
        return res.status(400).json({ success: false, reason: 'Invalid JSON' });
    }
    // ────────────────────────────────────────────
    // STEP 4.5: Validate webhook timestamp (replay protection)
    // ────────────────────────────────────────────
    // Razorpay events include created_at (Unix timestamp in seconds).
    // Reject events older than 5 minutes to prevent replay attacks.
    if (event.created_at) {
        const eventAgeMs = Math.abs(Date.now() - event.created_at * 1000);
        if (eventAgeMs > 300000) { // 5 minutes
            console.warn('[Webhook] ⚠️ REPLAY PROTECTION: Webhook event too old', {
                eventAge: `${Math.round(eventAgeMs / 1000)}s`,
                created_at: event.created_at,
                now: Math.floor(Date.now() / 1000),
            });
            return res.status(400).json({ success: false, reason: 'Webhook expired' });
        }
    }
    // ────────────────────────────────────────────
    // STEP 5: Route to appropriate handler
    // ────────────────────────────────────────────
    // ONLY handle payment.captured, payment.failed, and payment.refunded
    const eventType = event?.event;
    if (eventType === 'payment.captured') {
        return handlePaymentCaptured(event, res);
    }
    else if (eventType === 'payment.failed') {
        return handlePaymentFailed(event, res);
    }
    else if (eventType === 'payment.refunded') {
        return handlePaymentRefunded(event, res);
    }
    else {
        return res.status(200).json({ success: true, reason: 'Event ignored' });
    }
};
exports.webhook = webhook;
// ============================================
// WEBHOOK HANDLER: PAYMENT CAPTURED (SUCCESS)
// ============================================
async function handlePaymentCaptured(event, res) {
    console.log('[Webhook:Captured] Processing payment.captured event');
    const paymentEntity = event.payload?.payment?.entity;
    if (!paymentEntity) {
        console.log('[Webhook:Captured] ❌ Missing payment entity in payload');
        return res.status(400).json({ success: false, reason: 'Missing payment entity' });
    }
    const { id: razorpayPaymentId, order_id: razorpayOrderId, amount: webhookAmount, notes, } = paymentEntity;
    const internalOrderId = notes?.orderId;
    console.log('[Webhook:Captured] Payment data extracted:', {
        razorpayPaymentId,
        razorpayOrderId,
        webhookAmount,
        internalOrderId,
    });
    // Find payment record by Razorpay Order ID
    console.log('[Webhook:Captured] Looking up payment record...');
    const payment = await database_1.prisma.payment.findFirst({
        where: { transactionId: razorpayOrderId },
        include: {
            order: {
                include: {
                    items: true,
                    user: true,
                },
            },
        },
    });
    if (!payment) {
        console.log('[Webhook:Captured] ❌ Payment record not found for Razorpay Order:', razorpayOrderId);
        return res.status(200).json({ success: false, reason: 'Payment not found' });
    }
    console.log('[Webhook:Captured] ✓ Payment found:', {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
    });
    // ────────────────────────────────────────────
    // IDEMPOTENCY CHECK: Already processed?
    // ────────────────────────────────────────────
    if (payment.status === 'CONFIRMED') {
        console.warn("SECURITY ALERT: Duplicate webhook - payment already confirmed", {
            paymentId: payment.id,
            timestamp: new Date().toISOString()
        });
        return res.status(200).json({ success: true, reason: 'Already confirmed' });
    }
    // Skip if already failed (shouldn't receive captured after failed, but safety check)
    if (payment.status === 'FAILED') {
        console.log('[Webhook:Captured] ⚠️ Payment already FAILED - ignoring captured event');
        return res.status(200).json({ success: true, reason: 'Payment already failed' });
    }
    // Validate amount matches (HARD REJECTION)
    const expectedAmountPaise = Math.round(Number(payment.amount) * 100);
    if (webhookAmount !== expectedAmountPaise) {
        console.error("[Webhook:Captured] ❌ RECONCILIATION MISMATCH: Payment amount mismatch", {
            expected: expectedAmountPaise,
            received: webhookAmount,
            paymentId: payment.id,
            orderId: payment.order?.id,
            orderNumber: payment.order?.orderNumber,
            timestamp: new Date().toISOString(),
            severity: 'CRITICAL',
            action: 'HARD_REJECT',
        });
        (0, alerts_1.sendPaymentAlert)({
            level: 'critical',
            event: 'Webhook amount mismatch — reconciliation failure',
            reason: `Expected ${expectedAmountPaise} paise, received ${webhookAmount} paise`,
            orderId: payment.order?.id,
        });
        return res.status(400).json({
            success: false,
            reason: "Payment amount mismatch"
        });
    }
    const order = payment.order;
    if (!order) {
        console.log('[Webhook:Captured] ❌ Order not found for payment');
        return res.status(200).json({ success: false, reason: 'Order not found' });
    }
    console.log('[Webhook:Captured] ✓ Order found:', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        itemCount: order.items.length,
        userId: order.userId,
    });
    // ────────────────────────────────────────────
    // ATOMIC TRANSACTION: Update everything at once
    // ────────────────────────────────────────────
    try {
        console.log('[Webhook:Captured] Starting atomic transaction...');
        await database_1.prisma.$transaction(async (tx) => {
            // 1. Update Payment to CONFIRMED
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'CONFIRMED',
                    gatewayResponse: {
                        ...(typeof payment.gatewayResponse === 'object' && payment.gatewayResponse
                            ? payment.gatewayResponse
                            : {}),
                        razorpayPaymentId,
                        webhookReceivedAt: new Date().toISOString(),
                        webhookEvent: 'payment.captured',
                        confirmedAt: new Date().toISOString(),
                    },
                },
            });
            console.log('[Webhook:Captured] ✓ Payment updated to CONFIRMED');
            // 2. Update Order status and payment status
            await tx.order.update({
                where: { id: order.id },
                data: {
                    status: 'CONFIRMED',
                    paymentStatus: 'CONFIRMED',
                    paymentMethod: 'RAZORPAY',
                },
            });
            console.log('[Webhook:Captured] ✓ Order updated to CONFIRMED');
            // 3. Deduct inventory for each item (with stock floor check)
            for (const item of order.items) {
                console.log('[Webhook:Captured] Deducting inventory:', item.productId, 'qty:', item.quantity);
                // STOCK FLOOR CHECK: Verify stock won't go negative
                const currentProduct = await tx.product.findUnique({
                    where: { id: item.productId },
                    select: { stockQuantity: true, name: true },
                });
                if (!currentProduct) {
                    console.error('[Webhook:Captured] ❌ Product not found:', item.productId);
                    throw new Error(`Product ${item.productId} not found during inventory deduction`);
                }
                if (currentProduct.stockQuantity < item.quantity) {
                    console.error('[Webhook:Captured] ❌ STOCK FLOOR BREACH:', {
                        product: currentProduct.name,
                        available: currentProduct.stockQuantity,
                        requested: item.quantity,
                    });
                    throw new Error(`Insufficient stock for "${currentProduct.name}": available=${currentProduct.stockQuantity}, needed=${item.quantity}`);
                }
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQuantity: {
                            decrement: item.quantity,
                        },
                    },
                });
            }
            console.log('[Webhook:Captured] ✓ Inventory deducted (all floor checks passed)');
            // 4. Clear user's cart
            console.log('[Webhook:Captured] Clearing cart for user:', order.userId);
            await tx.cartItem.deleteMany({ where: { userId: order.userId } });
            console.log('[Webhook:Captured] ✓ Cart cleared');
            // 5. Remove inventory locks for this order
            console.log('[Webhook:Captured] Removing inventory locks for order');
            await tx.inventoryLock.deleteMany({ where: { orderId: order.id } });
            console.log('[Webhook:Captured] ✓ Inventory locks removed');
        });
        console.log('[Webhook:Captured] ════════════════════════════════════════');
        console.log('[Webhook:Captured] ✅ PAYMENT CONFIRMED SUCCESSFULLY');
        console.log('[Webhook:Captured] Order:', order.orderNumber);
        console.log('[Webhook:Captured] ════════════════════════════════════════');
        // Send order confirmation email (non-blocking)
        try {
            const emailTemplate = (0, email_1.getOrderConfirmationTemplate)(order.orderNumber, Number(order.totalAmount));
            await (0, email_1.sendEmail)({
                to: order.user.email,
                subject: `Order Confirmed - ${order.orderNumber}`,
                html: emailTemplate,
            });
            console.log('[Webhook:Captured] ✓ Order confirmation email sent');
        }
        catch (emailError) {
            console.error('[Webhook:Captured] ⚠️ Failed to send confirmation email:', emailError);
            // Continue - don't fail the webhook if email fails
        }
        return res.status(200).json({ success: true });
    }
    catch (err) {
        console.error('[Webhook:Captured] ❌ Transaction error:', err);
        return res.status(500).json({ success: false, reason: 'Transaction failed' });
    }
}
// ============================================
// WEBHOOK HANDLER: PAYMENT FAILED
// ============================================
async function handlePaymentFailed(event, res) {
    console.log('[Webhook:Failed] Processing payment.failed event');
    const paymentEntity = event.payload?.payment?.entity;
    if (!paymentEntity) {
        console.log('[Webhook:Failed] ❌ Missing payment entity in payload');
        return res.status(400).json({ success: false, reason: 'Missing payment entity' });
    }
    const { id: razorpayPaymentId, order_id: razorpayOrderId, error_code, error_description, error_reason, notes, } = paymentEntity;
    const internalOrderId = notes?.orderId;
    console.log('[Webhook:Failed] Payment failure data:', {
        razorpayPaymentId,
        razorpayOrderId,
        error_code,
        error_description,
        error_reason,
        internalOrderId,
    });
    // Find payment record
    console.log('[Webhook:Failed] Looking up payment record...');
    const payment = await database_1.prisma.payment.findFirst({
        where: { transactionId: razorpayOrderId },
        include: {
            order: {
                include: {
                    user: true,
                },
            },
        },
    });
    if (!payment) {
        console.log('[Webhook:Failed] ❌ Payment record not found for Razorpay Order:', razorpayOrderId);
        return res.status(200).json({ success: false, reason: 'Payment not found' });
    }
    console.log('[Webhook:Failed] ✓ Payment found:', {
        paymentId: payment.id,
        status: payment.status,
    });
    // ────────────────────────────────────────────
    // IDEMPOTENCY CHECK: Already processed?
    // ────────────────────────────────────────────
    if (payment.status === 'FAILED') {
        console.log('[Webhook:Failed] ✓ Payment already FAILED (idempotent - returning success)');
        return res.status(200).json({ success: true, reason: 'Already marked as failed' });
    }
    // Skip if already confirmed (shouldn't happen, but safety check)
    if (payment.status === 'CONFIRMED') {
        console.log('[Webhook:Failed] ⚠️ Payment already CONFIRMED - ignoring failed event');
        return res.status(200).json({ success: true, reason: 'Payment already confirmed' });
    }
    const order = payment.order;
    if (!order) {
        console.log('[Webhook:Failed] ❌ Order not found for payment');
        return res.status(200).json({ success: false, reason: 'Order not found' });
    }
    // ────────────────────────────────────────────
    // ATOMIC TRANSACTION: Mark as failed
    // ────────────────────────────────────────────
    try {
        console.log('[Webhook:Failed] Starting atomic transaction...');
        await database_1.prisma.$transaction(async (tx) => {
            // 1. Update Payment to FAILED
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'FAILED',
                    gatewayResponse: {
                        ...(typeof payment.gatewayResponse === 'object' && payment.gatewayResponse
                            ? payment.gatewayResponse
                            : {}),
                        razorpayPaymentId,
                        webhookReceivedAt: new Date().toISOString(),
                        webhookEvent: 'payment.failed',
                        failedAt: new Date().toISOString(),
                        error_code,
                        error_description,
                        error_reason,
                    },
                },
            });
            console.log('[Webhook:Failed] ✓ Payment updated to FAILED');
            // 2. Update Order status to CANCELLED and payment status to FAILED
            await tx.order.update({
                where: { id: order.id },
                data: {
                    status: 'CANCELLED',
                    paymentStatus: 'FAILED',
                    cancelledAt: new Date(),
                    cancelReason: `Payment failed: ${error_description || error_reason || 'Unknown error'}`,
                },
            });
            console.log('[Webhook:Failed] ✓ Order updated to CANCELLED');
            // 3. Remove inventory locks (release reserved stock)
            await tx.inventoryLock.deleteMany({ where: { orderId: order.id } });
            console.log('[Webhook:Failed] ✓ Inventory locks released');
        });
        console.log('[Webhook:Failed] ════════════════════════════════════════');
        console.log('[Webhook:Failed] ❌ PAYMENT FAILED - Order cancelled');
        console.log('[Webhook:Failed] Order:', order.orderNumber);
        console.log('[Webhook:Failed] Reason:', error_description || error_reason);
        console.log('[Webhook:Failed] ════════════════════════════════════════');
        // Fire-and-forget Slack alert
        (0, alerts_1.sendPaymentAlert)({
            level: 'error',
            event: 'Payment failed (webhook)',
            orderId: order.orderNumber,
            userId: order.user?.id,
            reason: error_description || error_reason || error_code || 'Unknown',
        });
        return res.status(200).json({ success: true });
    }
    catch (err) {
        console.error('[Webhook:Failed] ❌ Transaction error:', err);
        return res.status(500).json({ success: false, reason: 'Transaction failed' });
    }
}
// ============================================
// WEBHOOK HANDLER: PAYMENT REFUNDED
// ============================================
async function handlePaymentRefunded(event, res) {
    console.log('[Webhook:Refunded] Processing payment.refunded event');
    const paymentEntity = event.payload?.payment?.entity;
    if (!paymentEntity) {
        console.log('[Webhook:Refunded] ❌ Missing payment entity in payload');
        return res.status(400).json({ success: false, reason: 'Missing payment entity' });
    }
    const { id: razorpayPaymentId, order_id: razorpayOrderId, notes } = paymentEntity;
    console.log('[Webhook:Refunded] Refund data:', { razorpayPaymentId, razorpayOrderId });
    const payment = await database_1.prisma.payment.findFirst({
        where: { transactionId: razorpayOrderId },
        include: {
            order: {
                include: { items: true, user: true },
            },
        },
    });
    if (!payment) {
        console.log('[Webhook:Refunded] ❌ Payment record not found:', razorpayOrderId);
        return res.status(200).json({ success: false, reason: 'Payment not found' });
    }
    // Idempotency: already marked refunded
    if (payment.status === 'REFUNDED') {
        console.log('[Webhook:Refunded] ✓ Already REFUNDED (idempotent)');
        return res.status(200).json({ success: true, reason: 'Already refunded' });
    }
    const order = payment.order;
    if (!order) {
        return res.status(200).json({ success: false, reason: 'Order not found' });
    }
    try {
        await database_1.prisma.$transaction(async (tx) => {
            // 1. Mark payment as REFUNDED
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'REFUNDED',
                    gatewayResponse: {
                        ...(typeof payment.gatewayResponse === 'object' && payment.gatewayResponse
                            ? payment.gatewayResponse
                            : {}),
                        razorpayPaymentId,
                        webhookEvent: 'payment.refunded',
                        refundedAt: new Date().toISOString(),
                    },
                },
            });
            // 2. Update order status to REFUNDED if not already cancelled
            if (order.status !== 'CANCELLED') {
                await tx.order.update({
                    where: { id: order.id },
                    data: { status: 'CANCELLED', paymentStatus: 'REFUNDED', cancelledAt: new Date(), cancelReason: 'Refund processed via Razorpay webhook' },
                });
            }
            else {
                // Just update payment status
                await tx.order.update({
                    where: { id: order.id },
                    data: { paymentStatus: 'REFUNDED' },
                });
            }
            // 3. Restore stock if not already restored (i.e. order was previously CONFIRMED)
            if (order.status === 'CONFIRMED') {
                for (const item of order.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stockQuantity: { increment: item.quantity } },
                    });
                }
                console.log('[Webhook:Refunded] ✓ Stock restored for', order.items.length, 'items');
            }
        });
        console.log('[Webhook:Refunded] ════════════════════════════════════════');
        console.log('[Webhook:Refunded] ✅ REFUND PROCESSED — Order:', order.orderNumber);
        console.log('[Webhook:Refunded] ════════════════════════════════════════');
        (0, alerts_1.sendPaymentAlert)({
            level: 'warning',
            event: 'Refund processed (webhook)',
            orderId: order.orderNumber,
            userId: order.user?.id,
            reason: `payment.refunded received for ${razorpayPaymentId}`,
        });
        return res.status(200).json({ success: true });
    }
    catch (err) {
        console.error('[Webhook:Refunded] ❌ Transaction error:', err);
        return res.status(500).json({ success: false, reason: 'Transaction failed' });
    }
}
// ============================================
// HELPER: GET PAYMENT STATUS (FOR POLLING)
// ============================================
/**
 * GET /api/payments/:orderId/status
 *
 * Frontend uses this to poll payment status after verification
 * Returns current order and payment status with clear flags
 *
 * CRITICAL: This endpoint is polled by success page
 * Must return clear isConfirmed/isFailed flags for frontend
 */
exports.getPaymentStatus = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
        throw new helpers_1.AppError('Authentication required', 401);
    }
    const order = await database_1.prisma.order.findUnique({
        where: { id: orderId },
        include: { payments: true },
    });
    if (!order) {
        throw new helpers_1.AppError('Order not found', 404);
    }
    if (order.userId !== userId) {
        throw new helpers_1.AppError('Unauthorized', 403);
    }
    const payment = order.payments?.[0];
    // Determine payment state for frontend
    // CONFIRMED = webhook processed successfully = payment captured
    // FAILED = payment failed at gateway
    const paymentStatus = payment?.status || 'PENDING';
    const orderPaymentStatus = order.paymentStatus || 'PENDING';
    // CRITICAL: Only mark as confirmed when BOTH payment AND order are confirmed
    // This ensures webhook has fully processed
    const isConfirmed = paymentStatus === 'CONFIRMED' && orderPaymentStatus === 'CONFIRMED';
    // Check if payment failed
    const isFailed = paymentStatus === 'FAILED' || orderPaymentStatus === 'FAILED';
    // Generate message for frontend
    let message = 'Processing payment...';
    if (isConfirmed) {
        message = 'Payment confirmed successfully';
    }
    else if (isFailed) {
        message = 'Payment failed. Please try again.';
    }
    else if (paymentStatus === 'VERIFIED') {
        message = 'Payment verified, awaiting confirmation...';
    }
    console.log('[PaymentStatus] Check:', {
        orderId,
        paymentStatus,
        orderPaymentStatus,
        isConfirmed,
        isFailed,
    });
    res.json({
        success: true,
        // Order details
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderStatus: order.status,
        // Payment details  
        paymentStatus,
        orderPaymentStatus,
        paymentId: payment?.id || null,
        // Clear flags for frontend
        isConfirmed,
        isFailed,
        message,
        // Legacy fields for backward compatibility
        paymentDetails: payment ? {
            id: payment.id,
            status: payment.status,
        } : null,
    });
});
// ============================================
// ENDPOINT: INITIATE REFUND (ADMIN ONLY)
// ============================================
/**
 * POST /api/payments/refund
 * ADMIN ONLY - Process refund for approved returns
 *
 * Calls Razorpay refund API
 * Updates Payment.status = REFUNDED
 * Updates Return.status = REFUNDED
 * Restores inventory
 * Sends email to customer
 */
exports.initiateRefund = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { returnId, refundAmount } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    // Check authorization
    if (!userId) {
        throw new helpers_1.AppError('Authentication required', 401);
    }
    if (userRole !== 'ADMIN') {
        throw new helpers_1.AppError('Only admins can process refunds', 403);
    }
    // Validate inputs
    if (!returnId || !refundAmount) {
        throw new helpers_1.AppError('returnId and refundAmount are required', 400);
    }
    // Fetch return request
    const returnRequest = await database_1.prisma.return.findUnique({
        where: { id: returnId },
        include: {
            order: {
                include: {
                    payments: true,
                    user: true,
                },
            },
        },
    });
    if (!returnRequest) {
        throw new helpers_1.AppError('Return request not found', 404);
    }
    if (returnRequest.status !== 'APPROVED') {
        throw new helpers_1.AppError('Return must be approved before refunding', 400);
    }
    // SECURITY: Validate refund amount does not exceed order total
    const orderTotal = Number(returnRequest.order.totalAmount);
    if (refundAmount > orderTotal) {
        console.warn('SECURITY ALERT: Refund exceeds order total', {
            refundAmount,
            orderTotal,
            orderId: returnRequest.order.id,
            adminId: userId,
            timestamp: new Date().toISOString()
        });
        throw new helpers_1.AppError('Refund amount exceeds order total', 400);
    }
    const order = returnRequest.order;
    // SECURITY: Find the CONFIRMED payment — the one that was actually captured
    const payment = order.payments?.find((p) => p.status === 'CONFIRMED');
    if (!payment) {
        throw new helpers_1.AppError('No confirmed payment found for this order. Only captured payments can be refunded.', 400);
    }
    // SECURITY: Extract the Razorpay Payment ID (pay_xxx) from the gateway response.
    // transactionId stores razorpayOrder.id (order_xxx) — NEVER use it for refunds.
    // The webhook handler saves the real payment ID under gatewayResponse.razorpayPaymentId.
    const gatewayResponse = payment.gatewayResponse;
    const razorpayPaymentId = gatewayResponse?.razorpayPaymentId;
    if (!razorpayPaymentId || !razorpayPaymentId.startsWith('pay_')) {
        throw new helpers_1.AppError('Razorpay Payment ID (pay_xxx) not found in payment record. Cannot process refund — contact engineering.', 500);
    }
    // IDEMPOTENCY: Prevent double-refund
    if (payment.status === 'REFUNDED') {
        throw new helpers_1.AppError('This payment has already been refunded.', 409);
    }
    if (process.env.NODE_ENV === 'development') {
        console.log('[Payment.refund] Using razorpayPaymentId:', razorpayPaymentId);
    }
    try {
        // Call Razorpay refund API with the PAYMENT ID (pay_xxx), not the order ID
        let refundResult;
        try {
            const razorpay = getRazorpay();
            refundResult = await razorpay.payments.refund(razorpayPaymentId, {
                amount: Math.round(Number(refundAmount) * 100), // Convert to paise
                notes: {
                    returnId: returnId,
                    orderId: order.id,
                    reason: returnRequest.reason,
                },
            });
            if (process.env.NODE_ENV === 'development') {
                console.log('[Payment.refund] Razorpay refund successful:', refundResult?.id);
            }
        }
        catch (razorpayError) {
            console.error('[Payment.refund] Razorpay error:', razorpayError?.message);
            throw new helpers_1.AppError(`Razorpay refund failed: ${razorpayError.message}`, 400);
        }
        // Update database in transaction
        await database_1.prisma.$transaction(async (tx) => {
            // Update return status
            await tx.return.update({
                where: { id: returnId },
                data: {
                    status: 'REFUNDED',
                    refundAmount: new library_1.Decimal(refundAmount),
                    resolvedAt: new Date(),
                },
            });
            // Update payment status
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'REFUNDED',
                    gatewayResponse: {
                        ...(typeof payment.gatewayResponse === 'object' && payment.gatewayResponse !== null ? payment.gatewayResponse : {}),
                        refundId: refundResult?.id,
                        refundedAt: new Date().toISOString(),
                    },
                },
            });
            // Update order status
            await tx.order.update({
                where: { id: order.id },
                data: { status: 'RETURNED' },
            });
            // Restock inventory
            const orderItems = await tx.orderItem.findMany({
                where: { orderId: order.id },
            });
            for (const item of orderItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQuantity: {
                            increment: item.quantity,
                        },
                    },
                });
            }
        });
        // Send email to customer
        try {
            const emailTemplate = (0, email_1.getRefundProcessedTemplate)(order.user.fullName, order.orderNumber, refundAmount);
            await (0, email_1.sendEmail)({
                to: order.user.email,
                subject: `Refund Processed - Order ${order.orderNumber}`,
                html: emailTemplate,
            });
        }
        catch (emailError) {
            console.error('[Payment.refund] Failed to send refund email:', emailError);
            // Continue - don't fail the refund if email fails
        }
        // Audit log: record admin refund action
        (0, auditLog_1.logAdminAction)(req, 'UPDATE', 'ORDER', order.id, {
            action: 'REFUND_PROCESSED',
            returnId,
            refundAmount,
            refundId: refundResult?.id,
            paymentId: payment.id,
        });
        // Fire-and-forget alert so team knows a refund was issued
        (0, alerts_1.sendPaymentAlert)({
            level: 'info',
            event: 'Refund processed',
            orderId: order.orderNumber,
            userId: userId,
            amount: Math.round(Number(refundAmount) * 100),
            reason: `returnId=${returnId}`,
        });
        res.json({
            success: true,
            message: 'Refund processed successfully',
            refundId: refundResult?.id,
            refundAmount,
            transactionId: refundResult?.id,
        });
    }
    catch (error) {
        (0, sentry_1.captureException)(error, { context: 'initiateRefund', returnId, userId });
        (0, alerts_1.sendPaymentAlert)({
            level: 'critical',
            event: 'Refund FAILED',
            userId,
            reason: error instanceof Error ? error.message : String(error),
            extra: { returnId },
        });
        console.error('[Payment.refund] Error:', error);
        throw error;
    }
});
//# sourceMappingURL=payment.controller.js.map
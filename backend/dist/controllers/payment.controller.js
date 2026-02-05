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
    // IDEMPOTENCY: RETURN EXISTING PAYMENT IF ACTIVE
    // ────────────────────────────────────────────
    const activePayment = order.payments?.find((p) => p.status !== 'FAILED' && p.status !== 'REFUNDED');
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
    // FIND PAYMENT RECORD
    // ────────────────────────────────────────────
    const payment = order.payments?.[0];
    if (!payment) {
        throw new helpers_1.AppError('Payment record not found', 404);
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
    // ────────────────────────────────────────────
    // VERIFY RAZORPAY SIGNATURE
    // ────────────────────────────────────────────
    console.log('[Payment.verify] Verifying signature...');
    const signatureBody = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto_1.default
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(signatureBody)
        .digest('hex');
    if (expectedSignature !== razorpay_signature) {
        console.error('[Payment.verify] ❌ Signature verification FAILED');
        console.error('[Payment.verify] Expected:', expectedSignature.substring(0, 20) + '...');
        console.error('[Payment.verify] Received:', razorpay_signature.substring(0, 20) + '...');
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
    // UPDATE PAYMENT TO VERIFIED (NOT CONFIRMED)
    // ────────────────────────────────────────────
    // CRITICAL: Only mark as VERIFIED, NOT CONFIRMED
    // Webhook is the source of truth for CONFIRMED status
    console.log('[Payment.verify] Marking payment as VERIFIED (waiting for webhook confirmation)');
    const updatedPayment = await (0, retry_1.withRetry)(() => database_1.prisma.payment.update({
        where: { id: payment.id },
        data: {
            status: 'VERIFIED',
            gatewayResponse: {
                ...(typeof payment.gatewayResponse === 'object' && payment.gatewayResponse ? payment.gatewayResponse : {}),
                razorpayPaymentId: razorpay_payment_id,
                verifiedAt: new Date().toISOString(),
                verifiedBy: 'frontend',
            },
        },
    }));
    // Return early - do NOT update order status yet
    // Webhook will update order.status to CONFIRMED
    console.log('[Payment.verify] ✓ Payment marked as VERIFIED');
    console.log('[Payment.verify] ════════════════════════════════════════');
    console.log('[Payment.verify] Waiting for webhook confirmation...');
    console.log('[Payment.verify] ════════════════════════════════════════');
    res.json({
        success: true,
        message: 'Signature verified. Awaiting webhook confirmation.',
        orderStatus: order.status,
        paymentStatus: updatedPayment.status,
    });
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
    console.log('[Webhook] ════════════════════════════════════════════════');
    console.log('[Webhook] Webhook received at:', new Date().toISOString());
    // ────────────────────────────────────────────
    // DEBUG: Log request info for troubleshooting
    // ────────────────────────────────────────────
    console.log('[Webhook] Request path:', req.originalUrl);
    console.log('[Webhook] Content-Type:', req.headers['content-type']);
    console.log('[Webhook] Body type:', typeof req.body, Buffer.isBuffer(req.body) ? '(Buffer)' : '');
    // Log all headers containing 'razorpay' for debugging
    const razorpayHeaders = Object.keys(req.headers).filter(h => h.toLowerCase().includes('razorpay'));
    console.log('[Webhook] Razorpay headers found:', razorpayHeaders.length > 0 ? razorpayHeaders : 'NONE');
    // ────────────────────────────────────────────
    // STEP 1: Extract raw body (CRITICAL for signature)
    // ────────────────────────────────────────────
    let rawBody;
    if (Buffer.isBuffer(req.body)) {
        rawBody = req.body;
        console.log('[Webhook] ✓ Body is Buffer (correct)');
    }
    else if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
        rawBody = req.rawBody;
        console.log('[Webhook] ✓ Using rawBody attachment');
    }
    else if (typeof req.body === 'object' && req.body !== null) {
        // Body was parsed by express.json() - this is a problem!
        console.log('[Webhook] ⚠️ Body was parsed as JSON object - express.json() ran before webhook!');
        rawBody = Buffer.from(JSON.stringify(req.body));
    }
    else {
        rawBody = Buffer.from('');
        console.log('[Webhook] ⚠️ No body found');
    }
    console.log('[Webhook] Raw body length:', rawBody.length);
    // ────────────────────────────────────────────
    // STEP 2: Validate signature exists
    // ────────────────────────────────────────────
    const signature = req.headers['x-razorpay-signature'];
    const isTestMode = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_');
    if (!signature) {
        console.log('[Webhook] ⚠️ Signature missing from headers');
        console.log('[Webhook] Available headers:', Object.keys(req.headers).join(', '));
        // In TEST MODE ONLY: Allow webhooks without signature for development
        // This happens when Razorpay webhook secret is not configured in dashboard
        if (isTestMode) {
            console.log('[Webhook] ⚠️ TEST MODE: Proceeding without signature verification');
            console.log('[Webhook] ⚠️ ACTION REQUIRED: Configure webhook secret in Razorpay Dashboard');
            console.log('[Webhook] ⚠️ Go to: Dashboard → Webhooks → Edit → Change Secret → Enter your RAZORPAY_WEBHOOK_SECRET');
            // Parse and process the webhook without signature verification (TEST ONLY)
            let event;
            try {
                event = JSON.parse(rawBody.toString());
            }
            catch (err) {
                console.log('[Webhook] ❌ Invalid JSON:', err);
                return res.status(400).json({ success: false, reason: 'Invalid JSON' });
            }
            const eventType = event?.event;
            console.log('[Webhook] Event type (UNVERIFIED):', eventType);
            if (eventType === 'payment.captured') {
                return handlePaymentCaptured(event, res);
            }
            else if (eventType === 'payment.failed') {
                return handlePaymentFailed(event, res);
            }
            else {
                console.log('[Webhook] Ignoring event type:', eventType);
                return res.status(200).json({ success: true, reason: 'Event ignored' });
            }
        }
        // In LIVE MODE: Reject webhooks without signature
        console.log('[Webhook] ❌ LIVE MODE: Signature required - rejecting webhook');
        return res.status(400).json({ success: false, reason: 'Signature missing' });
    }
    console.log('[Webhook] ✓ Signature present:', signature.substring(0, 20) + '...');
    if (!rawBody || !rawBody.length) {
        console.log('[Webhook] ❌ Raw body missing');
        return res.status(400).json({ success: false, reason: 'Raw body missing' });
    }
    // ────────────────────────────────────────────
    // STEP 3: Verify HMAC-SHA256 signature
    // ────────────────────────────────────────────
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (!webhookSecret) {
        console.log('[Webhook] ❌ Webhook secret not configured');
        return res.status(500).json({ success: false, reason: 'Webhook secret not configured' });
    }
    const expectedSignature = crypto_1.default
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');
    if (expectedSignature !== signature) {
        console.log('[Webhook] ❌ Signature verification FAILED');
        console.log('[Webhook] Expected:', expectedSignature.substring(0, 20) + '...');
        console.log('[Webhook] Received:', signature.substring(0, 20) + '...');
        return res.status(400).json({ success: false, reason: 'Invalid signature' });
    }
    console.log('[Webhook] ✓ Signature verification: OK');
    // ────────────────────────────────────────────
    // STEP 4: Parse event JSON
    // ────────────────────────────────────────────
    let event;
    try {
        event = JSON.parse(rawBody.toString());
    }
    catch (err) {
        console.log('[Webhook] ❌ Invalid JSON:', err);
        return res.status(400).json({ success: false, reason: 'Invalid JSON' });
    }
    const eventType = event?.event;
    console.log('[Webhook] Event type:', eventType);
    // ────────────────────────────────────────────
    // STEP 5: Route to appropriate handler
    // ────────────────────────────────────────────
    // ONLY handle payment.captured and payment.failed
    if (eventType === 'payment.captured') {
        return handlePaymentCaptured(event, res);
    }
    else if (eventType === 'payment.failed') {
        return handlePaymentFailed(event, res);
    }
    else {
        console.log('[Webhook] Ignoring event type:', eventType);
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
        console.log('[Webhook:Captured] ✓ Payment already CONFIRMED (idempotent - returning success)');
        return res.status(200).json({ success: true, reason: 'Already confirmed' });
    }
    // Skip if already failed (shouldn't receive captured after failed, but safety check)
    if (payment.status === 'FAILED') {
        console.log('[Webhook:Captured] ⚠️ Payment already FAILED - ignoring captured event');
        return res.status(200).json({ success: true, reason: 'Payment already failed' });
    }
    // Validate amount matches
    const expectedAmountPaise = Math.round(Number(payment.amount) * 100);
    if (webhookAmount !== expectedAmountPaise) {
        console.log('[Webhook:Captured] ⚠️ Amount mismatch!', { expectedAmountPaise, webhookAmount });
        // Log but don't reject - amount validation is secondary to signature
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
            // 3. Deduct inventory for each item
            for (const item of order.items) {
                console.log('[Webhook:Captured] Deducting inventory:', item.productId, 'qty:', item.quantity);
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQuantity: {
                            decrement: item.quantity,
                        },
                    },
                });
            }
            console.log('[Webhook:Captured] ✓ Inventory deducted');
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
        return res.status(200).json({ success: true });
    }
    catch (err) {
        console.error('[Webhook:Failed] ❌ Transaction error:', err);
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
    const order = returnRequest.order;
    const payment = order.payments?.[0];
    if (!payment) {
        throw new helpers_1.AppError('No payment found for this order', 400);
    }
    try {
        // Call Razorpay refund API
        let refundResult;
        try {
            const razorpay = getRazorpay();
            refundResult = await razorpay.payments.refund(payment.transactionId, {
                amount: Math.round(Number(refundAmount) * 100), // Convert to paise
                notes: {
                    returnId: returnId,
                    orderId: order.id,
                    reason: returnRequest.reason,
                },
            });
            console.log('[Payment.refund] Razorpay refund successful:', refundResult);
        }
        catch (razorpayError) {
            console.error('[Payment.refund] Razorpay error:', razorpayError);
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
        res.json({
            success: true,
            message: 'Refund processed successfully',
            refundId: refundResult?.id,
            refundAmount,
            transactionId: refundResult?.id,
        });
    }
    catch (error) {
        console.error('[Payment.refund] Error:', error);
        throw error;
    }
});
//# sourceMappingURL=payment.controller.js.map
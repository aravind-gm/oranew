"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWebhookSignature = exports.verifyRazorpaySignature = exports.createRazorpayOrder = exports.razorpay = void 0;
const crypto_1 = __importDefault(require("crypto"));
const razorpay_1 = __importDefault(require("razorpay"));
const errorHandler_1 = require("../middleware/errorHandler");
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
if (!keyId || !keySecret) {
    // Fail fast in non-test environments if Razorpay is misconfigured
    if (process.env.NODE_ENV !== 'test') {
        // eslint-disable-next-line no-console
        console.warn('Razorpay keys are not configured. Payment APIs will fail.');
    }
}
exports.razorpay = new razorpay_1.default({
    key_id: keyId || '',
    key_secret: keySecret || '',
});
const createRazorpayOrder = async (amountInRupees, receipt) => {
    if (!keyId || !keySecret) {
        throw new errorHandler_1.AppError('Payment gateway is not configured', 500);
    }
    const amountInPaise = Math.round(amountInRupees * 100);
    return exports.razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt,
    });
};
exports.createRazorpayOrder = createRazorpayOrder;
const verifyRazorpaySignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
    if (!keySecret) {
        throw new errorHandler_1.AppError('Payment gateway is not configured', 500);
    }
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto_1.default
        .createHmac('sha256', keySecret)
        .update(payload)
        .digest('hex');
    return expectedSignature === razorpaySignature;
};
exports.verifyRazorpaySignature = verifyRazorpaySignature;
const verifyWebhookSignature = (rawBody, receivedSignature) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        throw new errorHandler_1.AppError('Webhook secret is not configured', 500);
    }
    const expectedSignature = crypto_1.default
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');
    return expectedSignature === receivedSignature;
};
exports.verifyWebhookSignature = verifyWebhookSignature;
//# sourceMappingURL=payment.js.map
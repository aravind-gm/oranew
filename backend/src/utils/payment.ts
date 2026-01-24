import crypto from 'crypto';
import Razorpay from 'razorpay';
import { AppError } from '../middleware/errorHandler';

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  // Fail fast in non-test environments if Razorpay is misconfigured
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.warn('Razorpay keys are not configured. Payment APIs will fail.');
  }
}

export const razorpay = new Razorpay({
  key_id: keyId || '',
  key_secret: keySecret || '',
});

export const createRazorpayOrder = async (amountInRupees: number, receipt: string) => {
  if (!keyId || !keySecret) {
    throw new AppError('Payment gateway is not configured', 500);
  }

  const amountInPaise = Math.round(amountInRupees * 100);

  return razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt,
  });
};

export const verifyRazorpaySignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean => {
  if (!keySecret) {
    throw new AppError('Payment gateway is not configured', 500);
  }

  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(payload)
    .digest('hex');

  return expectedSignature === razorpaySignature;
};

export const verifyWebhookSignature = (rawBody: string, receivedSignature: string): boolean => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new AppError('Webhook secret is not configured', 500);
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === receivedSignature;
};

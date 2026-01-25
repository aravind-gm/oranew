// backend/api/payments/webhook.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { successResponse, errorResponse, methodNotAllowed, withErrorHandling } from '../../lib/handlers';
import { prisma } from '../../lib/prisma';
import crypto from 'crypto';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    // Razorpay webhook verification
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const signature = req.headers['x-razorpay-signature'] as string;

    // Get raw body
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    // Verify signature
    const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');

    if (hash !== signature) {
      return errorResponse(res, 'Invalid signature', 401);
    }

    const event = req.body;

    if (event.event === 'payment.authorized') {
      const { razorpay_payment_id, notes } = event.payload.payment.entity;
      const { orderId } = notes || {};

      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'CONFIRMED',
            status: 'CONFIRMED',
            payments: {
              create: {
                transactionId: razorpay_payment_id,
                amount: 0,
                status: 'CONFIRMED',
                paymentGateway: 'RAZORPAY',
              },
            },
          },
        });
      }
    }

    if (event.event === 'payment.failed') {
      const { notes } = event.payload.payment.entity;
      const { orderId } = notes || {};

      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'FAILED', status: 'CANCELLED' },
        });
      }
    }

    return successResponse(res, { received: true });
  } catch (error) {
    console.error('[Webhook Error]', error);
    return successResponse(res, { received: true }); // Return 200 even on error to prevent retries
  }
}

export default withErrorHandling(handler);

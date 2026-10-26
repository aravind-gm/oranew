import jwt from 'jsonwebtoken';

interface GuestTokenPayload {
  orderId: string;
  orderNumber: string;
  purpose: 'guest_order_verification';
}

/**
 * Generates a signed, short-lived (2 hour) JWT token bound specifically
 * to a guest order for payment verification and post-checkout status retrieval.
 */
export function generateGuestOrderToken(orderId: string, orderNumber: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in backend environment');
  }
  return jwt.sign(
    {
      orderId,
      orderNumber,
      purpose: 'guest_order_verification',
    },
    secret,
    { expiresIn: '2h', algorithm: 'HS256' }
  );
}

/**
 * Verifies that a guest token is genuine, unexpired, and belongs to the specified orderId.
 */
export function verifyGuestOrderToken(token: string | undefined | null, expectedOrderId: string): boolean {
  if (!token || !expectedOrderId) return false;
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as GuestTokenPayload;

    return (
      decoded &&
      decoded.purpose === 'guest_order_verification' &&
      decoded.orderId === expectedOrderId
    );
  } catch {
    return false;
  }
}

/**
 * Guest Checkout Controller — Phase 4
 * =====================================
 *
 * Allows customers to checkout WITHOUT creating an account first.
 *
 * Strategy:
 *  1. Collect email, name, phone, address, and cart items from request body
 *  2. Check if a user with that email already exists
 *     - If yes: link order to existing user (they can claim it later by logging in)
 *     - If no: create a "guest" user with a random password
 *  3. Create address, proceed with standard checkout flow
 *  4. Return order + Razorpay order for payment
 *
 * Security:
 *  - Guest users are created with role: CUSTOMER
 *  - They can later "claim" their account by resetting password
 *  - No JWT token is issued — they just get the payment link
 *  - Rate limited to 3 per 5 minutes (same as regular checkout)
 *
 * Why this matters for jewellery:
 *  - Reduces checkout friction (fewer steps = higher conversion)
 *  - Jewellery buyers are often first-time, impulse purchasers
 *  - Account creation can happen post-purchase
 */
import { Response, Request } from 'express';
export declare const guestCheckout: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=guestCheckout.controller.d.ts.map
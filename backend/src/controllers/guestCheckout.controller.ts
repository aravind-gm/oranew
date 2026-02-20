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
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import { prisma } from '../config/database';
import { AppError, asyncHandler, generateOrderNumber } from '../utils/helpers';
import { lockInventory } from '../utils/inventory';
import { getGSTRate, calculateGSTAmount } from '../utils/tax';

interface GuestCheckoutBody {
  email: string;
  fullName: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  couponCode?: string;
}

// Shipping — always FREE (consistent with order.controller.ts)
function calculateShipping(): number {
  return 0;
}

export const guestCheckout = asyncHandler(async (req: Request, res: Response) => {
  const { email, fullName, phone, address, items, couponCode } = req.body as GuestCheckoutBody;

  // ====== VALIDATION ======
  if (!email || !email.includes('@')) {
    throw new AppError('Valid email is required', 400);
  }
  if (!fullName || !fullName.trim()) {
    throw new AppError('Full name is required', 400);
  }
  if (!phone || phone.length < 10) {
    throw new AppError('Valid phone number is required', 400);
  }
  if (!address || !address.street || !address.city || !address.state || !address.zipCode) {
    throw new AppError('Complete address is required (street, city, state, zipCode)', 400);
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('At least one item is required', 400);
  }

  // Validate quantities
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new AppError('Invalid quantity: must be a positive integer', 400);
    }
    if (item.quantity > 20) {
      throw new AppError('Quantity exceeds maximum limit of 20 per item', 400);
    }
  }

  console.log('[GuestCheckout] Request received:', {
    email,
    fullName,
    itemsCount: items.length,
    couponCode: couponCode || 'None',
  });

  // ====== FIND OR CREATE USER ======
  let userId: string;

  // If the request has an authenticated user (they're logged in but using guest flow)
  if (req.user?.id) {
    userId = req.user.id;
    console.log('[GuestCheckout] Using authenticated user:', userId);
  } else {
    // Check for existing user by email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    });

    if (existingUser) {
      userId = existingUser.id;
      console.log('[GuestCheckout] Found existing user by email:', userId);
    } else {
      // Create guest user with random password
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcryptjs.hash(randomPassword, 10);

      const guestUser = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          fullName: fullName.trim(),
          phone: phone.trim(),
          passwordHash: hashedPassword,
          role: 'CUSTOMER',
          isVerified: false,
          profileCompleted: false,
        },
      });

      userId = guestUser.id;
      console.log('[GuestCheckout] Created guest user:', userId);
    }
  }

  // ====== CREATE ADDRESS ======
  const newAddress = await prisma.address.create({
    data: {
      userId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: address.street,
      city: address.city,
      state: address.state,
      pincode: address.zipCode,
      country: address.country || 'India',
      isDefault: false,
    },
  });

  // ====== FETCH AND VALIDATE PRODUCTS ======
  const productIds = items.map(i => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { images: true, category: { select: { slug: true } } },
  });

  if (products.length !== productIds.length) {
    throw new AppError('One or more products not found', 400);
  }

  const cartItems = items.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product || product.deletedAt || !product.isActive) {
      throw new AppError(`Product "${product?.name || item.productId}" is unavailable`, 400);
    }
    if (product.stockQuantity < item.quantity) {
      throw new AppError(
        `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}`,
        400
      );
    }
    return { productId: item.productId, quantity: item.quantity, product };
  });

  // ====== CALCULATE TOTALS ======
  let subtotal = 0;
  for (const item of cartItems) {
    subtotal += Number(item.product.finalPrice) * item.quantity;
  }

  // Apply coupon if provided
  let discountAmount = 0;
  let appliedCouponCode: string | null = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });

    if (coupon) {
      const now = new Date();
      const isValid =
        coupon.isActive &&
        coupon.validFrom <= now &&
        coupon.validUntil >= now &&
        (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) &&
        (!coupon.minOrderAmount || subtotal >= Number(coupon.minOrderAmount));

      if (isValid) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (subtotal * Number(coupon.discountValue)) / 100;
        } else {
          discountAmount = Number(coupon.discountValue);
        }

        if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
          discountAmount = Number(coupon.maxDiscount);
        }
        if (discountAmount > subtotal) discountAmount = subtotal;

        appliedCouponCode = coupon.code;
      }
    }
  }

  // Cap discount at 70%
  if (subtotal > 0 && (discountAmount / subtotal) > 0.7) {
    discountAmount = Math.floor(subtotal * 0.7);
  }

  // GST calculation
  let gstAmount = 0;
  const itemGstRates: number[] = [];
  for (const item of cartItems) {
    const rate = await getGSTRate(
      Number((item.product as any).gstRate) || 0,
      (item.product as any).category?.slug || null
    );
    const itemTotal = Number(item.product.finalPrice) * item.quantity;
    gstAmount += calculateGSTAmount(itemTotal, rate);
    itemGstRates.push(rate);
  }

  if (discountAmount > 0 && subtotal > 0) {
    gstAmount = gstAmount * (1 - discountAmount / subtotal);
    gstAmount = Math.round(gstAmount * 100) / 100;
  }

  const shippingFee = calculateShipping();
  const totalAmount = Math.max(0, subtotal - discountAmount + gstAmount + shippingFee);

  if (totalAmount <= 0) {
    throw new AppError('Order total must be greater than zero', 400);
  }

  // ====== CREATE ORDER (Serializable transaction for inventory safety) ======
  const order = await prisma.$transaction(async (tx) => {
    // Stock re-check inside transaction
    for (const item of cartItems) {
      const fresh = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stockQuantity: true, name: true },
      });

      if (!fresh || fresh.stockQuantity < item.quantity) {
        throw new AppError(
          `Insufficient stock for "${fresh?.name || item.productId}"`,
          400
        );
      }
    }

    const orderNumber = generateOrderNumber();

    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId,
        status: 'PENDING',
        subtotal,
        discountAmount,
        couponCode: appliedCouponCode,
        gstAmount,
        shippingFee,
        totalAmount,
        shippingAddressId: newAddress.id,
        billingAddressId: newAddress.id,
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PENDING',
        items: {
          create: cartItems.map((item, index) => ({
            productId: item.productId,
            productName: item.product.name,
            productImage: item.product.images?.[0]?.imageUrl || null,
            quantity: item.quantity,
            unitPrice: Number(item.product.finalPrice),
            discount: 0,
            gstRate: itemGstRates[index] || 0,
            totalPrice: Number(item.product.finalPrice) * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // Lock inventory (uses global prisma — not part of this transaction)
    await lockInventory(
      newOrder.id,
      cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))
    );

    // Update coupon usage
    if (appliedCouponCode) {
      await tx.coupon.update({
        where: { code: appliedCouponCode },
        data: { usageCount: { increment: 1 } },
      });
    }

    return newOrder;
  }, { timeout: 30000, maxWait: 10000 });

  // ====== CREATE RAZORPAY ORDER ======
  let Razorpay: any;
  try {
    Razorpay = (await import('razorpay')).default;
  } catch {
    throw new AppError('Payment gateway unavailable', 503);
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(totalAmount * 100), // Razorpay expects paise
    currency: 'INR',
    receipt: order.orderNumber,
    notes: {
      orderId: order.id,
      userId,
      guestCheckout: 'true',
    },
  });

  // Create payment record
  await prisma.payment.create({
    data: {
      orderId: order.id,
      paymentGateway: 'RAZORPAY',
      transactionId: razorpayOrder.id,
      amount: totalAmount,
      currency: 'INR',
      status: 'PENDING',
    },
  });

  console.log('[GuestCheckout] ✅ Order created:', {
    orderNumber: order.orderNumber,
    total: totalAmount,
    isGuest: !req.user?.id,
    razorpayOrderId: razorpayOrder.id,
  });

  res.status(201).json({
    success: true,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      subtotal,
      discountAmount,
      gstAmount,
      shippingFee,
      totalAmount,
      items: order.items,
    },
    razorpayOrder: {
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    },
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  });
});

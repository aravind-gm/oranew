import { Decimal } from '@prisma/client/runtime/library';
import { Response } from 'express';
import { prisma } from '../config/database';
import { withRetry } from '../utils/retry';
import { AuthRequest } from '../middleware/auth';
import { sendOrderPlacedEmail } from '../services/email.service';
import { AppError, asyncHandler, calculateGST, generateOrderNumber } from '../utils/helpers';
import { lockInventory, releaseInventoryLocks, restockInventory } from '../utils/inventory';

interface ShippingAddressInput {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface CartItemInput {
  productId: string;
  quantity: number;
}

export const checkout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shippingAddressId, billingAddressId, shippingAddress, items, couponCode } = req.body;

  console.log('[Checkout] Request received:', {
    userId: req.user?.id,
    hasShippingAddressId: !!shippingAddressId,
    hasShippingAddress: !!shippingAddress,
    itemsCount: items?.length || 0,
    couponCode: couponCode || 'None',
  });

  let finalShippingAddrId = shippingAddressId;
  let finalBillingAddrId = billingAddressId;

  // Support inline address creation (for simpler checkout flow)
  if (shippingAddress && !shippingAddressId) {
    const { street, city, state, zipCode, country } = shippingAddress as ShippingAddressInput;
    
    if (!street || !city || !state || !zipCode) {
      throw new AppError('Shipping address is incomplete', 400);
    }

    // Fetch full user info for address
    const fullUser = await withRetry(() =>
      prisma.user.findUnique({
        where: { id: req.user!.id },
      })
    );

    // Create new address for user
    const newAddress = await withRetry(() =>
      prisma.address.create({
        data: {
          userId: req.user!.id,
          fullName: fullUser?.fullName || 'Customer',
          addressLine1: street,
          city,
          state,
          pincode: zipCode,
          country: country || 'India',
          phone: fullUser?.phone || '',
          isDefault: false,
        },
      })
    );

    finalShippingAddrId = newAddress.id;
    finalBillingAddrId = newAddress.id; // Use same address for billing
  }

  if (!finalShippingAddrId || !finalBillingAddrId) {
    throw new AppError('Shipping and billing addresses are required', 400);
  }

  // Get cart items - either from request body or from database cart
  let cartItems;
  
  if (items && Array.isArray(items) && items.length > 0) {
    // Use items from request body (client-side cart)
    const itemsInput = items as CartItemInput[];
    const productIds = itemsInput.map(item => item.productId);
    
    console.log('[Checkout] Fetching products:', { count: productIds.length });
    
    const products = await withRetry(() =>
      prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { images: true },
      })
    );

    if (products.length !== productIds.length) {
      const missingIds = productIds.filter(id => !products.find(p => p.id === id));
      console.error('[Checkout] Some products not found:', { missingIds });
    }

    cartItems = itemsInput.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new AppError(`Product ${item.productId} not found`, 400);
      }
      return {
        productId: item.productId,
        quantity: item.quantity,
        product,
      };
    });
  } else {
    // Use server-side cart
    console.log('[Checkout] Using server-side cart for user:', req.user!.id);
    cartItems = await withRetry(() =>
      prisma.cartItem.findMany({
        where: { userId: req.user!.id },
        include: {
          product: {
            include: {
              images: true,
            },
          },
        },
      })
    );
  }

  if (cartItems.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  // Verify addresses belong to user
  const shippingAddr = await withRetry(() =>
    prisma.address.findFirst({
      where: {
        id: finalShippingAddrId,
        userId: req.user!.id,
      },
    })
  );

  const billingAddr = await withRetry(() =>
    prisma.address.findFirst({
      where: {
        id: finalBillingAddrId,
        userId: req.user!.id,
      },
    })
  );

  if (!shippingAddr || !billingAddr) {
    throw new AppError('Invalid addresses', 400);
  }

  // Calculate totals
  let subtotal = 0;
  for (const item of cartItems) {
    subtotal += Number(item.product.finalPrice) * item.quantity;
  }

  // Apply coupon if provided
  let discountAmount = 0;
  let appliedCouponCode: string | null = null;

  if (couponCode) {
    try {
      const coupon = await withRetry(() =>
        prisma.coupon.findUnique({
          where: { code: couponCode.toUpperCase() },
        })
      );

      if (coupon) {
        // Validate coupon
        const now = new Date();
        const isValid =
          coupon.isActive &&
          coupon.validFrom <= now &&
          coupon.validUntil >= now &&
          (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) &&
          (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount.toNumber());

        if (isValid) {
          // Calculate discount
          if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (subtotal * coupon.discountValue.toNumber()) / 100;
          } else {
            discountAmount = coupon.discountValue.toNumber();
          }

          // Apply max discount limit
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount.toNumber()) {
            discountAmount = coupon.maxDiscount.toNumber();
          }

          // Cannot exceed subtotal
          if (discountAmount > subtotal) {
            discountAmount = subtotal;
          }

          appliedCouponCode = coupon.code;
          console.log('[Checkout] ✓ Coupon applied:', { code: coupon.code, discount: discountAmount });
        }
      }
    } catch (error) {
      console.warn('[Checkout] Coupon validation failed:', error);
      // Continue without coupon if validation fails
    }
  }

  const gstAmount = calculateGST(subtotal - discountAmount);
  const shippingFee = subtotal - discountAmount >= 1000 ? 0 : 50;
  const totalAmount = subtotal - discountAmount + gstAmount + shippingFee;

  // Create order
  const order = await withRetry(() =>
    prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: req.user!.id,
        subtotal: new Decimal(subtotal),
        discountAmount: new Decimal(discountAmount),
        gstAmount: new Decimal(gstAmount),
        shippingFee: new Decimal(shippingFee),
        totalAmount: new Decimal(totalAmount),
        shippingAddressId: finalShippingAddrId,
        billingAddressId: finalBillingAddrId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            productImage: item.product.images?.[0]?.imageUrl || null,
            quantity: item.quantity,
            unitPrice: item.product.finalPrice,
            gstRate: new Decimal(3),
            discount: new Decimal(0),
            totalPrice: new Decimal(Number(item.product.finalPrice) * item.quantity),
          })),
        },
      },
      include: {
        items: true,
        shippingAddress: true,
        user: { select: { fullName: true, email: true } },
      },
    })
  );

  // Lock inventory for this order (holds for 15 minutes)
  const inventoryItems = cartItems.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));

  try {
    await lockInventory(order.id, inventoryItems);
  } catch (error) {
    // If inventory lock fails, delete the order
    await prisma.order.delete({ where: { id: order.id } });
    throw error;
  }

  // Send order placed email (fire and forget - don't block response)
  try {
    const emailData = {
      orderNumber: order.orderNumber,
      customerName: order.user.fullName,
      customerEmail: order.user.email,
      items: order.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
      totalAmount: Number(order.totalAmount),
      shippingAddress: {
        fullName: order.shippingAddress.fullName,
        addressLine1: order.shippingAddress.addressLine1,
        addressLine2: order.shippingAddress.addressLine2 || undefined,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        pincode: order.shippingAddress.pincode,
      },
    };
    
    sendOrderPlacedEmail(emailData).catch(err => 
      console.error('Failed to send order placed email:', err)
    );
  } catch (emailError) {
    console.error('Email error (non-blocking):', emailError);
  }

  // DO NOT clear cart yet - wait for payment confirmation webhook

  res.status(201).json({
    success: true,
    order, // Frontend expects response.data.order
    data: order,
    message: 'Order created. Proceed to payment.',
  });
});

export const getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await withRetry(() =>
    prisma.order.findMany({
      where: { userId: req.user!.id },
      include: {
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  );

  res.json({ success: true, data: orders });
});

export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const order = await withRetry(() =>
    prisma.order.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
        payments: true,
      },
    })
  );

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  res.json({ success: true, data: order });
});

export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await withRetry(() =>
    prisma.order.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    })
  );

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (['SHIPPED', 'DELIVERED'].includes(order.status)) {
    throw new AppError('Cannot cancel order at this stage', 400);
  }

  // If order is CONFIRMED (payment taken), cannot cancel without refund
  if (order.status === 'CONFIRMED') {
    throw new AppError('Order is confirmed. Please request a return/refund instead.', 400);
  }

  // For PENDING orders: release inventory locks
  if (order.status === 'PENDING') {
    await releaseInventoryLocks(id);
  }

  const updatedOrder = await withRetry(() =>
    prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    })
  );

  res.json({ success: true, data: updatedOrder });
});

export const requestReturn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { reason, description } = req.body;

  const order = await withRetry(() =>
    prisma.order.findFirst({
      where: {
        id,
        userId: req.user!.id,
        status: 'DELIVERED',
      },
    })
  );

  if (!order) {
    throw new AppError('Order not found or cannot be returned', 404);
  }

  const returnRequest = await withRetry(() =>
    prisma.return.create({
      data: {
        orderId: id,
        userId: req.user!.id,
        reason,
        description,
        status: 'REQUESTED',
      },
    })
  );

  res.status(201).json({ success: true, data: returnRequest });
});

/**
 * ADMIN ONLY: Process refund and restock inventory
 * Called by admin after approving a return request
 */
export const processRefund = asyncHandler(async (req: any, res: Response) => {
  const { returnId, refundAmount } = req.body;

  if (!returnId || !refundAmount) {
    throw new AppError('returnId and refundAmount are required', 400);
  }

  const returnRequest = await withRetry(() =>
    prisma.return.findUnique({
      where: { id: returnId },
      include: { order: true },
    })
  );

  if (!returnRequest) {
    throw new AppError('Return request not found', 404);
  }

  const order = returnRequest.order;

  // Call refund API (would integrate with Razorpay in production)
  // For now, mark as refunded and restock
  await withRetry(() =>
    prisma.$transaction(async (tx) => {
      // Update return status
      await tx.return.update({
        where: { id: returnId },
        data: {
          status: 'REFUNDED',
          refundAmount: new Decimal(refundAmount),
          resolvedAt: new Date(),
          restocked: true,
        },
      });

      // Update payment status
      const payment = await tx.payment.findFirst({
        where: { orderId: order.id },
      });

      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' },
        });
      }

      // Update order status
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'REFUNDED' },
      });

      // Restock inventory
      await restockInventory(order.id);
    })
  );

  res.json({ success: true, message: 'Refund processed and inventory restocked' });
});

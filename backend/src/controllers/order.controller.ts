import { Decimal } from '@prisma/client/runtime/library';
import { Response } from 'express';
import { prisma } from '../config/database';
import { withRetry } from '../utils/retry';
import { AuthRequest } from '../middleware/auth';
import { sendOrderPlacedEmail } from '../services/email.service';
import { AppError, asyncHandler, generateOrderNumber } from '../utils/helpers';
import { lockInventory, releaseInventoryLocks, restockInventory } from '../utils/inventory';
// Shipping — single source of truth: always FREE
function calculateShipping(): number {
  return 0;
}
import { getGSTRate, calculateGSTAmount } from '../utils/tax';

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
    ) as any;

    // Create new address for user
    const newAddress = await withRetry(() =>
      prisma.address.create({
        data: {
          userId: req.user!.id,
          fullName: (fullUser as any)?.fullName || 'Customer',
          addressLine1: street,
          city,
          state,
          pincode: zipCode,
          country: country || 'India',
          phone: (fullUser as any)?.phone || '',
          isDefault: false,
        },
      })
    ) as any;

    finalShippingAddrId = (newAddress as any).id;
    finalBillingAddrId = (newAddress as any).id; // Use same address for billing
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
    ) as any;

    if ((products as any).length !== productIds.length) {
      const missingIds = productIds.filter(id => !products.find(p => p.id === id));
      console.error('[Checkout] Some products not found:', { missingIds });
    }

    // Validate quantities (SECURITY: prevent negative/zero/excessive quantities)
    for (const item of itemsInput) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new AppError('Invalid quantity: must be a positive integer', 400);
      }
      if (item.quantity > 20) {
        throw new AppError('Quantity exceeds maximum limit of 20 per item', 400);
      }
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

  // ====== CART RE-VALIDATION (Step 6) ======
  // Re-fetch products from DB — do NOT trust client-side prices
  for (const item of cartItems) {
    const freshProduct = await withRetry(() =>
      prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true, name: true, finalPrice: true, price: true,
          stockQuantity: true, isActive: true, deletedAt: true,
          isBOGOEligible: true, bogoActive: true, bogoPriceTier: true,
          gstRate: true,
          category: { select: { slug: true } },
        },
      })
    ) as any;

    if (!freshProduct || freshProduct.deletedAt || !freshProduct.isActive) {
      throw new AppError(`Product "${item.product?.name || item.productId}" is no longer available`, 400);
    }

    if (freshProduct.stockQuantity < item.quantity) {
      throw new AppError(
        `Insufficient stock for "${freshProduct.name}". Available: ${freshProduct.stockQuantity}, Requested: ${item.quantity}`,
        400
      );
    }

    // Override with fresh DB price (never trust localStorage)
    item.product.finalPrice = freshProduct.finalPrice;
    item.product.price = freshProduct.price;
    item.product.name = freshProduct.name;
    (item as any)._gstRate = Number(freshProduct.gstRate) || 0;
    (item as any)._categorySlug = freshProduct.category?.slug || null;
    (item as any)._isBOGOEligible = freshProduct.isBOGOEligible;
    (item as any)._bogoActive = freshProduct.bogoActive;
    (item as any)._bogoPriceTier = freshProduct.bogoPriceTier;
  }

  // Calculate subtotal from re-validated DB prices
  let subtotal = 0;
  for (const item of cartItems) {
    subtotal += Number(item.product.finalPrice) * item.quantity;
  }

  // ====== DISCOUNT LOGIC (Steps 3 & 4) ======
  let discountAmount = 0;
  let appliedCouponCode: string | null = null;
  let bogoDiscountApplied = false;

  // --- Check for BOGO discount ---
  const bogoItems = cartItems.filter((item: any) => item._isBOGOEligible && item._bogoActive);
  if (bogoItems.length >= 2) {
    const activeBOGOCampaign = await prisma.bOGOCampaign.findFirst({
      where: {
        isActive: true,
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
    });

    if (activeBOGOCampaign) {
      // Group by price tier
      const tierGroups: Record<number, typeof bogoItems> = {};
      for (const item of bogoItems) {
        const tier = (item as any)._bogoPriceTier;
        if (tier) {
          if (!tierGroups[tier]) tierGroups[tier] = [];
          tierGroups[tier].push(item);
        }
      }

      // Apply BOGO per tier (pairs of 2)
      for (const [, tierItems] of Object.entries(tierGroups)) {
        if (tierItems.length >= 2) {
          // Sort by price ascending — cheaper item gets the discount
          const sorted = [...tierItems].sort(
            (a, b) => Number(a.product.finalPrice) - Number(b.product.finalPrice)
          );
          const cheaperPrice = Number(sorted[0].product.finalPrice);

          let bogoDiscount = 0;
          if (activeBOGOCampaign.discountType === 'FREE_CHEAPER') {
            bogoDiscount = cheaperPrice;
          } else if (activeBOGOCampaign.discountType === 'PERCENT') {
            bogoDiscount = Math.round(cheaperPrice * (Number(activeBOGOCampaign.discountValue) / 100));
          } else if (activeBOGOCampaign.discountType === 'FIXED') {
            bogoDiscount = Math.min(Number(activeBOGOCampaign.discountValue), cheaperPrice);
          }

          discountAmount += bogoDiscount;
          bogoDiscountApplied = true;
        }
      }
    }
  }

  // --- Apply coupon (with stacking protection) ---
  if (couponCode) {
    // STACKING RULE: If BOGO is applied, reject coupon stacking
    if (bogoDiscountApplied) {
      throw new AppError('Cannot combine BOGO discount with a coupon code. Remove BOGO items or the coupon.', 400);
    }

    try {
      const coupon = await withRetry(() =>
        prisma.coupon.findUnique({
          where: { code: couponCode.toUpperCase() },
        })
      ) as any;

      if (coupon) {
        const now = new Date();
        const isValid =
          (coupon as any).isActive &&
          (coupon as any).validFrom <= now &&
          (coupon as any).validUntil >= now &&
          (!(coupon as any).usageLimit || (coupon as any).usageCount < (coupon as any).usageLimit) &&
          (!(coupon as any).minOrderAmount || subtotal >= (coupon as any).minOrderAmount.toNumber());

        if (isValid) {
          if ((coupon as any).discountType === 'PERCENTAGE') {
            discountAmount = (subtotal * (coupon as any).discountValue.toNumber()) / 100;
          } else {
            discountAmount = (coupon as any).discountValue.toNumber();
          }

          if ((coupon as any).maxDiscount && discountAmount > (coupon as any).maxDiscount.toNumber()) {
            discountAmount = (coupon as any).maxDiscount.toNumber();
          }

          if (discountAmount > subtotal) {
            discountAmount = subtotal;
          }

          appliedCouponCode = (coupon as any).code;
        }
      }
    } catch (error) {
      // Continue without coupon if validation fails
    }
  }

  // ====== DISCOUNT STACKING PROTECTION (max 70% of subtotal) ======
  const MAX_DISCOUNT_PERCENT = 70;
  if (subtotal > 0) {
    const totalDiscountPercent = (discountAmount / subtotal) * 100;
    if (totalDiscountPercent > MAX_DISCOUNT_PERCENT) {
      console.warn('[Checkout] ⚠️ Discount exceeds cap:', { totalDiscountPercent, discountAmount, subtotal });
      discountAmount = Math.floor((subtotal * MAX_DISCOUNT_PERCENT) / 100);
      console.log('[Checkout] Discount capped to:', discountAmount);
    }
  }

  // Discount can never exceed subtotal
  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }

  // ====== GST CALCULATION (per-item configurable GST) ======
  let gstAmount = 0;
  const itemGstRates: number[] = [];
  for (const item of cartItems) {
    const rate = await getGSTRate(
      (item as any)._gstRate,
      (item as any)._categorySlug
    );
    const itemTotal = Number(item.product.finalPrice) * item.quantity;
    gstAmount += calculateGSTAmount(itemTotal, rate);
    itemGstRates.push(rate);
  }

  // Adjust GST on discount (proportional reduction)
  if (discountAmount > 0 && subtotal > 0) {
    const discountRatio = discountAmount / subtotal;
    gstAmount = gstAmount * (1 - discountRatio);
    gstAmount = Math.round(gstAmount * 100) / 100;
  }

  // ====== SHIPPING (server-side source of truth — always FREE) ======
  const shippingFee = calculateShipping();

  // ====== TOTAL CALCULATION WITH NEGATIVE PREVENTION ======
  const computedTotal = subtotal - discountAmount + gstAmount + shippingFee;
  if (computedTotal < 0) {
    throw new AppError('Invalid order amount: total cannot be negative', 400);
  }
  const totalAmount = Math.max(0, computedTotal);

  // Final safety: Razorpay requires amount > 0
  if (totalAmount <= 0) {
    throw new AppError('Order total must be greater than zero', 400);
  }

  // ====== TRANSACTIONAL ORDER + INVENTORY LOCK CREATION (CRITICAL) ======
  // ALL stock checks, order creation, inventory locks, and coupon updates
  // happen in a SINGLE atomic Serializable transaction.
  //
  // WHY Serializable?
  //   ReadCommitted (Postgres default) allows two concurrent checkouts for
  //   the last item to both read stockQuantity=1, both pass the check, and
  //   both succeed — resulting in stock going to -1 (overselling).
  //   Serializable forces transactions to execute as if sequential, so the
  //   second checkout will see the stock already reserved and fail cleanly.
  const order = await prisma.$transaction(async (tx) => {
    //    This is the definitive guard — the check above is a fast pre-check.
    for (const item of cartItems) {
      const freshProduct = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stockQuantity: true, name: true },
      });

      if (!freshProduct) {
        throw new AppError(`Product ${item.productId} not found`, 400);
      }

      // CRITICAL: Check available stock (total minus active locks) inside
      // the Serializable transaction to prevent TOCTOU race conditions.
      const lockedQty = await tx.inventoryLock.aggregate({
        where: { productId: item.productId, expiresAt: { gt: new Date() } },
        _sum: { quantity: true },
      });
      const locked = lockedQty._sum.quantity ?? 0;
      const available = freshProduct.stockQuantity - locked;

      if (available < item.quantity) {
        throw new AppError(
          `Insufficient stock for "${freshProduct.name}". Available: ${available}, Requested: ${item.quantity}`,
          409 // 409 Conflict for inventory issues
        );
      }
    }

    // 2️⃣ Create order (server-computed values only — never trust frontend)
    const newOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: req.user!.id,
        subtotal: new Decimal(subtotal),
        discountAmount: new Decimal(discountAmount),
        couponCode: appliedCouponCode || null,
        gstAmount: new Decimal(gstAmount),
        shippingFee: new Decimal(shippingFee),
        totalAmount: new Decimal(totalAmount),
        shippingAddressId: finalShippingAddrId,
        billingAddressId: finalBillingAddrId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        items: {
          create: cartItems.map((item, index) => ({
            productId: item.productId,
            productName: item.product.name,
            productImage: item.product.images?.[0]?.imageUrl || null,
            quantity: item.quantity,
            unitPrice: item.product.finalPrice,
            gstRate: new Decimal(itemGstRates[index] || 3),
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
    });

    // 3️⃣ Create inventory locks (10-minute expiry to prevent spam locking)
    const lockExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await tx.inventoryLock.createMany({
      data: cartItems.map((item) => ({
        productId: item.productId,
        orderId: newOrder.id,
        quantity: item.quantity,
        expiresAt: lockExpiry,
      })),
    });

    // 4️⃣ Atomic coupon increment + per-user usage tracking
    if (appliedCouponCode) {
      const coupon = await tx.coupon.findUnique({
        where: { code: appliedCouponCode },
        select: { id: true },
      });

      if (coupon) {
        // Check if user already used this coupon
        const existingUsage = await tx.couponUsage.findUnique({
          where: {
            userId_couponId: {
              userId: req.user!.id,
              couponId: coupon.id,
            },
          },
        });

        if (existingUsage) {
          throw new AppError('You have already used this coupon', 400);
        }

        // Atomic increment (prevents race conditions)
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });

        // Track per-user usage
        await tx.couponUsage.create({
          data: {
            userId: req.user!.id,
            couponId: coupon.id,
            orderId: newOrder.id,
          },
        });
      }
    }

    return newOrder;
  }, {
    // SECURITY: Serializable isolation prevents the "last item" race condition.
    // Two concurrent checkouts for qty=1 stock will no longer both succeed.
    // The second transaction will receive a serialization failure and Prisma
    // will surface it as a PrismaClientKnownRequestError (P2034) which we
    // catch in the global error handler and return as a 409 Conflict.
    isolationLevel: 'Serializable',
  });

  // Send order placed email (fire and forget - don't block response)
  try {
    const emailData = {
      orderNumber: (order as any).orderNumber,
      customerName: (order as any).user.fullName,
      customerEmail: (order as any).user.email,
      items: (order as any).items.map((item: any) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
      totalAmount: Number((order as any).totalAmount),
      shippingAddress: {
        fullName: (order as any).shippingAddress.fullName,
        addressLine1: (order as any).shippingAddress.addressLine1,
        addressLine2: (order as any).shippingAddress.addressLine2 || undefined,
        city: (order as any).shippingAddress.city,
        state: (order as any).shippingAddress.state,
        pincode: (order as any).shippingAddress.pincode,
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
  ) as any;

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (['SHIPPED', 'DELIVERED'].includes((order as any).status)) {
    throw new AppError('Cannot cancel order at this stage', 400);
  }

  // If order is CONFIRMED (payment taken), cannot cancel without refund
  if ((order as any).status === 'CONFIRMED') {
    throw new AppError('Order is confirmed. Please request a return/refund instead.', 400);
  }

  // For PENDING orders: release inventory locks
  if ((order as any).status === 'PENDING') {
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
  ) as any;

  res.json({ success: true, data: (updatedOrder as any) });
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

  const order = (returnRequest as any).order;

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

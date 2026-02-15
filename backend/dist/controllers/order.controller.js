"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRefund = exports.requestReturn = exports.cancelOrder = exports.getOrderById = exports.getOrders = exports.checkout = void 0;
const library_1 = require("@prisma/client/runtime/library");
const database_1 = require("../config/database");
const retry_1 = require("../utils/retry");
const email_service_1 = require("../services/email.service");
const helpers_1 = require("../utils/helpers");
const inventory_1 = require("../utils/inventory");
const shipping_1 = require("../utils/shipping");
const tax_1 = require("../utils/tax");
exports.checkout = (0, helpers_1.asyncHandler)(async (req, res) => {
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
        const { street, city, state, zipCode, country } = shippingAddress;
        if (!street || !city || !state || !zipCode) {
            throw new helpers_1.AppError('Shipping address is incomplete', 400);
        }
        // Fetch full user info for address
        const fullUser = await (0, retry_1.withRetry)(() => database_1.prisma.user.findUnique({
            where: { id: req.user.id },
        }));
        // Create new address for user
        const newAddress = await (0, retry_1.withRetry)(() => database_1.prisma.address.create({
            data: {
                userId: req.user.id,
                fullName: fullUser?.fullName || 'Customer',
                addressLine1: street,
                city,
                state,
                pincode: zipCode,
                country: country || 'India',
                phone: fullUser?.phone || '',
                isDefault: false,
            },
        }));
        finalShippingAddrId = newAddress.id;
        finalBillingAddrId = newAddress.id; // Use same address for billing
    }
    if (!finalShippingAddrId || !finalBillingAddrId) {
        throw new helpers_1.AppError('Shipping and billing addresses are required', 400);
    }
    // Get cart items - either from request body or from database cart
    let cartItems;
    if (items && Array.isArray(items) && items.length > 0) {
        // Use items from request body (client-side cart)
        const itemsInput = items;
        const productIds = itemsInput.map(item => item.productId);
        console.log('[Checkout] Fetching products:', { count: productIds.length });
        const products = await (0, retry_1.withRetry)(() => database_1.prisma.product.findMany({
            where: { id: { in: productIds } },
            include: { images: true },
        }));
        if (products.length !== productIds.length) {
            const missingIds = productIds.filter(id => !products.find(p => p.id === id));
            console.error('[Checkout] Some products not found:', { missingIds });
        }
        // Validate quantities (SECURITY: prevent negative/zero/excessive quantities)
        for (const item of itemsInput) {
            if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                throw new helpers_1.AppError('Invalid quantity: must be a positive integer', 400);
            }
            if (item.quantity > 20) {
                throw new helpers_1.AppError('Quantity exceeds maximum limit of 20 per item', 400);
            }
        }
        cartItems = itemsInput.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) {
                throw new helpers_1.AppError(`Product ${item.productId} not found`, 400);
            }
            return {
                productId: item.productId,
                quantity: item.quantity,
                product,
            };
        });
    }
    else {
        // Use server-side cart
        console.log('[Checkout] Using server-side cart for user:', req.user.id);
        cartItems = await (0, retry_1.withRetry)(() => database_1.prisma.cartItem.findMany({
            where: { userId: req.user.id },
            include: {
                product: {
                    include: {
                        images: true,
                    },
                },
            },
        }));
    }
    if (cartItems.length === 0) {
        throw new helpers_1.AppError('Cart is empty', 400);
    }
    // Verify addresses belong to user
    const shippingAddr = await (0, retry_1.withRetry)(() => database_1.prisma.address.findFirst({
        where: {
            id: finalShippingAddrId,
            userId: req.user.id,
        },
    }));
    const billingAddr = await (0, retry_1.withRetry)(() => database_1.prisma.address.findFirst({
        where: {
            id: finalBillingAddrId,
            userId: req.user.id,
        },
    }));
    if (!shippingAddr || !billingAddr) {
        throw new helpers_1.AppError('Invalid addresses', 400);
    }
    // ====== CART RE-VALIDATION (Step 6) ======
    // Re-fetch products from DB — do NOT trust client-side prices
    for (const item of cartItems) {
        const freshProduct = await (0, retry_1.withRetry)(() => database_1.prisma.product.findUnique({
            where: { id: item.productId },
            select: {
                id: true, name: true, finalPrice: true, price: true,
                stockQuantity: true, isActive: true, deletedAt: true,
                isBOGOEligible: true, bogoActive: true, bogoPriceTier: true,
                gstRate: true,
                category: { select: { slug: true } },
            },
        }));
        if (!freshProduct || freshProduct.deletedAt || !freshProduct.isActive) {
            throw new helpers_1.AppError(`Product "${item.product?.name || item.productId}" is no longer available`, 400);
        }
        if (freshProduct.stockQuantity < item.quantity) {
            throw new helpers_1.AppError(`Insufficient stock for "${freshProduct.name}". Available: ${freshProduct.stockQuantity}, Requested: ${item.quantity}`, 400);
        }
        // Override with fresh DB price (never trust localStorage)
        item.product.finalPrice = freshProduct.finalPrice;
        item.product.price = freshProduct.price;
        item.product.name = freshProduct.name;
        item._gstRate = Number(freshProduct.gstRate) || 0;
        item._categorySlug = freshProduct.category?.slug || null;
        item._isBOGOEligible = freshProduct.isBOGOEligible;
        item._bogoActive = freshProduct.bogoActive;
        item._bogoPriceTier = freshProduct.bogoPriceTier;
    }
    // Calculate subtotal from re-validated DB prices
    let subtotal = 0;
    for (const item of cartItems) {
        subtotal += Number(item.product.finalPrice) * item.quantity;
    }
    // ====== DISCOUNT LOGIC (Steps 3 & 4) ======
    let discountAmount = 0;
    let appliedCouponCode = null;
    let bogoDiscountApplied = false;
    // --- Check for BOGO discount ---
    const bogoItems = cartItems.filter((item) => item._isBOGOEligible && item._bogoActive);
    if (bogoItems.length >= 2) {
        const activeBOGOCampaign = await database_1.prisma.bOGOCampaign.findFirst({
            where: {
                isActive: true,
                OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
            },
        });
        if (activeBOGOCampaign) {
            // Group by price tier
            const tierGroups = {};
            for (const item of bogoItems) {
                const tier = item._bogoPriceTier;
                if (tier) {
                    if (!tierGroups[tier])
                        tierGroups[tier] = [];
                    tierGroups[tier].push(item);
                }
            }
            // Apply BOGO per tier (pairs of 2)
            for (const [, tierItems] of Object.entries(tierGroups)) {
                if (tierItems.length >= 2) {
                    // Sort by price ascending — cheaper item gets the discount
                    const sorted = [...tierItems].sort((a, b) => Number(a.product.finalPrice) - Number(b.product.finalPrice));
                    const cheaperPrice = Number(sorted[0].product.finalPrice);
                    let bogoDiscount = 0;
                    if (activeBOGOCampaign.discountType === 'FREE_CHEAPER') {
                        bogoDiscount = cheaperPrice;
                    }
                    else if (activeBOGOCampaign.discountType === 'PERCENT') {
                        bogoDiscount = Math.round(cheaperPrice * (Number(activeBOGOCampaign.discountValue) / 100));
                    }
                    else if (activeBOGOCampaign.discountType === 'FIXED') {
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
            throw new helpers_1.AppError('Cannot combine BOGO discount with a coupon code. Remove BOGO items or the coupon.', 400);
        }
        try {
            const coupon = await (0, retry_1.withRetry)(() => database_1.prisma.coupon.findUnique({
                where: { code: couponCode.toUpperCase() },
            }));
            if (coupon) {
                const now = new Date();
                const isValid = coupon.isActive &&
                    coupon.validFrom <= now &&
                    coupon.validUntil >= now &&
                    (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) &&
                    (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount.toNumber());
                if (isValid) {
                    if (coupon.discountType === 'PERCENTAGE') {
                        discountAmount = (subtotal * coupon.discountValue.toNumber()) / 100;
                    }
                    else {
                        discountAmount = coupon.discountValue.toNumber();
                    }
                    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount.toNumber()) {
                        discountAmount = coupon.maxDiscount.toNumber();
                    }
                    if (discountAmount > subtotal) {
                        discountAmount = subtotal;
                    }
                    appliedCouponCode = coupon.code;
                }
            }
        }
        catch (error) {
            // Continue without coupon if validation fails
        }
    }
    // ====== GST CALCULATION (Step 5 — per-item configurable GST) ======
    let gstAmount = 0;
    const itemGstRates = [];
    for (const item of cartItems) {
        const rate = await (0, tax_1.getGSTRate)(item._gstRate, item._categorySlug);
        const itemTotal = Number(item.product.finalPrice) * item.quantity;
        gstAmount += (0, tax_1.calculateGSTAmount)(itemTotal, rate);
        itemGstRates.push(rate);
    }
    // Adjust GST on discount (proportional reduction)
    if (discountAmount > 0 && subtotal > 0) {
        const discountRatio = discountAmount / subtotal;
        gstAmount = gstAmount * (1 - discountRatio);
        gstAmount = Math.round(gstAmount * 100) / 100;
    }
    // ====== SHIPPING (Step 1 — server-side source of truth) ======
    const shippingFee = await (0, shipping_1.calculateShippingFee)(subtotal - discountAmount);
    // ====== TOTAL WITH NEGATIVE PREVENTION (Step 4) ======
    const totalAmount = Math.max(0, subtotal - discountAmount + gstAmount + shippingFee);
    // Create order
    const order = await (0, retry_1.withRetry)(() => database_1.prisma.order.create({
        data: {
            orderNumber: (0, helpers_1.generateOrderNumber)(),
            userId: req.user.id,
            subtotal: new library_1.Decimal(subtotal),
            discountAmount: new library_1.Decimal(discountAmount),
            gstAmount: new library_1.Decimal(gstAmount),
            shippingFee: new library_1.Decimal(shippingFee),
            totalAmount: new library_1.Decimal(totalAmount),
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
                    gstRate: new library_1.Decimal(itemGstRates[index] || 3),
                    discount: new library_1.Decimal(0),
                    totalPrice: new library_1.Decimal(Number(item.product.finalPrice) * item.quantity),
                })),
            },
        },
        include: {
            items: true,
            shippingAddress: true,
            user: { select: { fullName: true, email: true } },
        },
    }));
    // Lock inventory for this order (holds for 15 minutes)
    const inventoryItems = cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
    }));
    try {
        await (0, inventory_1.lockInventory)(order.id, inventoryItems);
    }
    catch (error) {
        // If inventory lock fails, delete the order
        await database_1.prisma.order.delete({ where: { id: order.id } });
        throw error;
    }
    // Send order placed email (fire and forget - don't block response)
    try {
        const emailData = {
            orderNumber: order.orderNumber,
            customerName: order.user.fullName,
            customerEmail: order.user.email,
            items: order.items.map((item) => ({
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
        (0, email_service_1.sendOrderPlacedEmail)(emailData).catch(err => console.error('Failed to send order placed email:', err));
    }
    catch (emailError) {
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
exports.getOrders = (0, helpers_1.asyncHandler)(async (req, res) => {
    const orders = await (0, retry_1.withRetry)(() => database_1.prisma.order.findMany({
        where: { userId: req.user.id },
        include: {
            items: true,
            payments: true,
        },
        orderBy: { createdAt: 'desc' },
    }));
    res.json({ success: true, data: orders });
});
exports.getOrderById = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const order = await (0, retry_1.withRetry)(() => database_1.prisma.order.findFirst({
        where: {
            id,
            userId: req.user.id,
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
    }));
    if (!order) {
        throw new helpers_1.AppError('Order not found', 404);
    }
    res.json({ success: true, data: order });
});
exports.cancelOrder = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const order = await (0, retry_1.withRetry)(() => database_1.prisma.order.findFirst({
        where: {
            id,
            userId: req.user.id,
        },
    }));
    if (!order) {
        throw new helpers_1.AppError('Order not found', 404);
    }
    if (['SHIPPED', 'DELIVERED'].includes(order.status)) {
        throw new helpers_1.AppError('Cannot cancel order at this stage', 400);
    }
    // If order is CONFIRMED (payment taken), cannot cancel without refund
    if (order.status === 'CONFIRMED') {
        throw new helpers_1.AppError('Order is confirmed. Please request a return/refund instead.', 400);
    }
    // For PENDING orders: release inventory locks
    if (order.status === 'PENDING') {
        await (0, inventory_1.releaseInventoryLocks)(id);
    }
    const updatedOrder = await (0, retry_1.withRetry)(() => database_1.prisma.order.update({
        where: { id },
        data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelReason: reason,
        },
    }));
    res.json({ success: true, data: updatedOrder });
});
exports.requestReturn = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { reason, description } = req.body;
    const order = await (0, retry_1.withRetry)(() => database_1.prisma.order.findFirst({
        where: {
            id,
            userId: req.user.id,
            status: 'DELIVERED',
        },
    }));
    if (!order) {
        throw new helpers_1.AppError('Order not found or cannot be returned', 404);
    }
    const returnRequest = await (0, retry_1.withRetry)(() => database_1.prisma.return.create({
        data: {
            orderId: id,
            userId: req.user.id,
            reason,
            description,
            status: 'REQUESTED',
        },
    }));
    res.status(201).json({ success: true, data: returnRequest });
});
/**
 * ADMIN ONLY: Process refund and restock inventory
 * Called by admin after approving a return request
 */
exports.processRefund = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { returnId, refundAmount } = req.body;
    if (!returnId || !refundAmount) {
        throw new helpers_1.AppError('returnId and refundAmount are required', 400);
    }
    const returnRequest = await (0, retry_1.withRetry)(() => database_1.prisma.return.findUnique({
        where: { id: returnId },
        include: { order: true },
    }));
    if (!returnRequest) {
        throw new helpers_1.AppError('Return request not found', 404);
    }
    const order = returnRequest.order;
    // Call refund API (would integrate with Razorpay in production)
    // For now, mark as refunded and restock
    await (0, retry_1.withRetry)(() => database_1.prisma.$transaction(async (tx) => {
        // Update return status
        await tx.return.update({
            where: { id: returnId },
            data: {
                status: 'REFUNDED',
                refundAmount: new library_1.Decimal(refundAmount),
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
        await (0, inventory_1.restockInventory)(order.id);
    }));
    res.json({ success: true, message: 'Refund processed and inventory restocked' });
});
//# sourceMappingURL=order.controller.js.map
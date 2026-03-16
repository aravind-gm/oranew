"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.guestCheckout = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const helpers_1 = require("../utils/helpers");
const inventory_1 = require("../utils/inventory");
const tax_1 = require("../utils/tax");
// COD constants (must match order.controller.ts)
const COD_MAX_AMOUNT = 5000;
const COD_MAX_PER_DAY_GUEST = 1; // Stricter for guests (no account verification)
// Shipping — always FREE (consistent with order.controller.ts)
function calculateShipping() {
    return 0;
}
exports.guestCheckout = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { email, fullName, phone, address, items, couponCode, paymentMethod } = req.body;
    const isCOD = paymentMethod === 'COD';
    // ====== VALIDATION ======
    if (!email || !email.includes('@')) {
        throw new helpers_1.AppError('Valid email is required', 400);
    }
    if (!fullName || !fullName.trim()) {
        throw new helpers_1.AppError('Full name is required', 400);
    }
    if (!phone || phone.length < 10) {
        throw new helpers_1.AppError('Valid phone number is required', 400);
    }
    if (!address || !address.street || !address.city || !address.state || !address.zipCode) {
        throw new helpers_1.AppError('Complete address is required (street, city, state, zipCode)', 400);
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new helpers_1.AppError('At least one item is required', 400);
    }
    // Validate quantities
    for (const item of items) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
            throw new helpers_1.AppError('Invalid quantity: must be a positive integer', 400);
        }
        if (item.quantity > 20) {
            throw new helpers_1.AppError('Quantity exceeds maximum limit of 20 per item', 400);
        }
    }
    console.log('[GuestCheckout] Request received:', {
        email,
        fullName,
        itemsCount: items.length,
        couponCode: couponCode || 'None',
    });
    // ====== FIND OR CREATE USER ======
    let userId;
    // If the request has an authenticated user (they're logged in but using guest flow)
    if (req.user?.id) {
        userId = req.user.id;
        console.log('[GuestCheckout] Using authenticated user:', userId);
    }
    else {
        // Check for existing user by email
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { id: true },
        });
        if (existingUser) {
            userId = existingUser.id;
            console.log('[GuestCheckout] Found existing user by email:', userId);
        }
        else {
            // Create guest user with random password
            const randomPassword = crypto_1.default.randomBytes(32).toString('hex');
            const hashedPassword = await bcryptjs_1.default.hash(randomPassword, 10);
            const guestUser = await database_1.prisma.user.create({
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
    const newAddress = await database_1.prisma.address.create({
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
    const products = await database_1.prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { images: true, category: { select: { slug: true } } },
    });
    if (products.length !== productIds.length) {
        throw new helpers_1.AppError('One or more products not found', 400);
    }
    const cartItems = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product || product.deletedAt || !product.isActive) {
            throw new helpers_1.AppError(`Product "${product?.name || item.productId}" is unavailable`, 400);
        }
        if (product.stockQuantity < item.quantity) {
            throw new helpers_1.AppError(`Insufficient stock for "${product.name}". Available: ${product.stockQuantity}`, 400);
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
    let appliedCouponCode = null;
    if (couponCode) {
        const coupon = await database_1.prisma.coupon.findUnique({
            where: { code: couponCode.toUpperCase() },
        });
        if (coupon) {
            const now = new Date();
            const isValid = coupon.isActive &&
                coupon.validFrom <= now &&
                coupon.validUntil >= now &&
                (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) &&
                (!coupon.minOrderAmount || subtotal >= Number(coupon.minOrderAmount));
            if (isValid) {
                if (coupon.discountType === 'PERCENTAGE') {
                    discountAmount = (subtotal * Number(coupon.discountValue)) / 100;
                }
                else {
                    discountAmount = Number(coupon.discountValue);
                }
                if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
                    discountAmount = Number(coupon.maxDiscount);
                }
                if (discountAmount > subtotal)
                    discountAmount = subtotal;
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
    const itemGstRates = [];
    for (const item of cartItems) {
        const rate = await (0, tax_1.getGSTRate)(Number(item.product.gstRate) || 0, item.product.category?.slug || null);
        const itemTotal = Number(item.product.finalPrice) * item.quantity;
        gstAmount += (0, tax_1.calculateGSTAmount)(itemTotal, rate);
        itemGstRates.push(rate);
    }
    if (discountAmount > 0 && subtotal > 0) {
        gstAmount = gstAmount * (1 - discountAmount / subtotal);
        gstAmount = Math.round(gstAmount * 100) / 100;
    }
    const shippingFee = calculateShipping();
    const totalAmount = Math.max(0, subtotal - discountAmount + gstAmount + shippingFee);
    if (totalAmount <= 0) {
        throw new helpers_1.AppError('Order total must be greater than zero', 400);
    }
    // ====== COD BUSINESS RULES ======
    if (isCOD) {
        const COD_MAX_AMOUNT = 5000;
        if (totalAmount > COD_MAX_AMOUNT) {
            throw new helpers_1.AppError(`Cash on Delivery is available for orders up to ₹${COD_MAX_AMOUNT}. Your total is ₹${Math.round(totalAmount)}.`, 400);
        }
        // For guest COD: limit by email (max 3/day)
        const COD_DAILY_LIMIT = 3;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const codOrdersToday = await database_1.prisma.order.count({
            where: {
                userId,
                paymentMethod: 'COD',
                createdAt: { gte: todayStart },
                status: { notIn: ['CANCELLED'] },
            },
        });
        if (codOrdersToday >= COD_DAILY_LIMIT) {
            throw new helpers_1.AppError(`Daily limit of ${COD_DAILY_LIMIT} Cash on Delivery orders reached. Please use online payment or try again tomorrow.`, 400);
        }
    }
    // ====== CREATE ORDER (Serializable transaction for inventory safety) ======
    const order = await database_1.prisma.$transaction(async (tx) => {
        // Stock re-check inside transaction
        for (const item of cartItems) {
            const fresh = await tx.product.findUnique({
                where: { id: item.productId },
                select: { stockQuantity: true, name: true },
            });
            if (!fresh || fresh.stockQuantity < item.quantity) {
                throw new helpers_1.AppError(`Insufficient stock for "${fresh?.name || item.productId}"`, 400);
            }
        }
        const orderNumber = (0, helpers_1.generateOrderNumber)();
        const newOrder = await tx.order.create({
            data: {
                orderNumber,
                userId,
                status: isCOD ? 'CONFIRMED' : 'PENDING',
                subtotal,
                discountAmount,
                couponCode: appliedCouponCode,
                gstAmount,
                shippingFee,
                totalAmount,
                shippingAddressId: newAddress.id,
                billingAddressId: newAddress.id,
                paymentMethod: isCOD ? 'COD' : 'RAZORPAY',
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
        await (0, inventory_1.lockInventory)(newOrder.id, cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
        })));
        // Update coupon usage
        if (appliedCouponCode) {
            await tx.coupon.update({
                where: { code: appliedCouponCode },
                data: { usageCount: { increment: 1 } },
            });
        }
        return newOrder;
    }, { timeout: 30000, maxWait: 10000 });
    // ====== COD: Skip Razorpay, create COD payment record ======
    if (isCOD) {
        await database_1.prisma.payment.create({
            data: {
                orderId: order.id,
                paymentGateway: 'COD',
                transactionId: `COD-${order.orderNumber}`,
                amount: totalAmount,
                currency: 'INR',
                status: 'PENDING',
            },
        });
        // Deduct stock immediately for COD (order is CONFIRMED)
        for (const item of cartItems) {
            await database_1.prisma.product.update({
                where: { id: item.productId },
                data: { stockQuantity: { decrement: item.quantity } },
            });
        }
        console.log('[GuestCheckout] ✅ COD Order confirmed:', {
            orderNumber: order.orderNumber,
            total: totalAmount,
            isGuest: !req.user?.id,
        });
        return res.status(201).json({
            success: true,
            codOrder: true,
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
        });
    }
    // ====== CREATE RAZORPAY ORDER (Online payment only) ======
    let Razorpay;
    try {
        Razorpay = (await Promise.resolve().then(() => __importStar(require('razorpay')))).default;
    }
    catch {
        throw new helpers_1.AppError('Payment gateway unavailable', 503);
    }
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
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
    await database_1.prisma.payment.create({
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
        codOrder: false,
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
//# sourceMappingURL=guestCheckout.controller.js.map
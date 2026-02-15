"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const database_1 = require("../config/database");
const retry_1 = require("../utils/retry");
const errorHandler_1 = require("../middleware/errorHandler");
const getCart = async (req, res, next) => {
    try {
        const cartItems = await (0, retry_1.withRetry)(() => database_1.prisma.cartItem.findMany({
            where: { userId: req.user.id },
            include: {
                product: {
                    include: {
                        images: { where: { isPrimary: true }, take: 1 },
                    },
                },
            },
        }));
        res.json({ success: true, data: cartItems });
    }
    catch (error) {
        next(error);
    }
};
exports.getCart = getCart;
const addToCart = async (req, res, next) => {
    try {
        const { productId, quantity = 1 } = req.body;
        // Check if product exists and is active
        const product = await (0, retry_1.withRetry)(() => database_1.prisma.product.findUnique({
            where: { id: productId },
        }));
        if (!product || !product.isActive || product.deletedAt) {
            throw new errorHandler_1.AppError('Product not found or unavailable', 404);
        }
        if (product.stockQuantity < quantity) {
            throw new errorHandler_1.AppError(`Only ${product.stockQuantity} available for "${product.name}"`, 400);
        }
        // Check if item already in cart
        const existingItem = await (0, retry_1.withRetry)(() => database_1.prisma.cartItem.findUnique({
            where: {
                userId_productId: {
                    userId: req.user.id,
                    productId,
                },
            },
        }));
        // Validate total quantity (existing + new) against stock
        const existingQty = existingItem ? existingItem.quantity : 0;
        const newTotalQty = existingQty + quantity;
        if (newTotalQty > product.stockQuantity) {
            const canAdd = product.stockQuantity - existingQty;
            throw new errorHandler_1.AppError(canAdd > 0
                ? `Cannot add ${quantity} more. Only ${canAdd} more available.`
                : 'Maximum available stock already in cart.', 400);
        }
        // Cap at max 10 per product
        if (newTotalQty > 10) {
            throw new errorHandler_1.AppError(`Maximum 10 items per product allowed. You already have ${existingQty} in cart.`, 400);
        }
        let cartItem;
        if (existingItem) {
            // Update quantity
            cartItem = await (0, retry_1.withRetry)(() => database_1.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: newTotalQty },
                include: {
                    product: {
                        include: {
                            images: { where: { isPrimary: true }, take: 1 },
                        },
                    },
                },
            }));
        }
        else {
            // Create new cart item
            cartItem = await (0, retry_1.withRetry)(() => database_1.prisma.cartItem.create({
                data: {
                    userId: req.user.id,
                    productId,
                    quantity,
                },
                include: {
                    product: {
                        include: {
                            images: { where: { isPrimary: true }, take: 1 },
                        },
                    },
                },
            }));
        }
        res.status(201).json({ success: true, data: cartItem });
    }
    catch (error) {
        next(error);
    }
};
exports.addToCart = addToCart;
const updateCartItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const cartItem = await (0, retry_1.withRetry)(() => database_1.prisma.cartItem.findFirst({
            where: { id, userId: req.user.id },
            include: { product: true },
        }));
        if (!cartItem) {
            throw new errorHandler_1.AppError('Cart item not found', 404);
        }
        // Validate stock before updating quantity
        if (quantity > cartItem.product.stockQuantity) {
            throw new errorHandler_1.AppError(`Only ${cartItem.product.stockQuantity} available for "${cartItem.product.name}"`, 400);
        }
        if (quantity < 1) {
            throw new errorHandler_1.AppError('Quantity must be at least 1', 400);
        }
        // Cap at max 10 per product
        if (quantity > 10) {
            throw new errorHandler_1.AppError('Maximum 10 items per product allowed', 400);
        }
        const updatedItem = await (0, retry_1.withRetry)(() => database_1.prisma.cartItem.update({
            where: { id },
            data: { quantity },
            include: {
                product: {
                    include: {
                        images: { where: { isPrimary: true }, take: 1 },
                    },
                },
            },
        }));
        res.json({ success: true, data: updatedItem });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCartItem = updateCartItem;
const removeFromCart = async (req, res, next) => {
    try {
        const { id } = req.params;
        await (0, retry_1.withRetry)(() => database_1.prisma.cartItem.deleteMany({
            where: { id, userId: req.user.id },
        }));
        res.json({ success: true, message: 'Item removed from cart' });
    }
    catch (error) {
        next(error);
    }
};
exports.removeFromCart = removeFromCart;
const clearCart = async (req, res, next) => {
    try {
        await (0, retry_1.withRetry)(() => database_1.prisma.cartItem.deleteMany({
            where: { userId: req.user.id },
        }));
        res.json({ success: true, message: 'Cart cleared' });
    }
    catch (error) {
        next(error);
    }
};
exports.clearCart = clearCart;
//# sourceMappingURL=cart.controller.js.map
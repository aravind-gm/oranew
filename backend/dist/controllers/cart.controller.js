"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const getCart = async (req, res, next) => {
    try {
        const cartItems = await database_1.prisma.cartItem.findMany({
            where: { userId: req.user.id },
            include: {
                product: {
                    include: {
                        images: { where: { isPrimary: true }, take: 1 },
                    },
                },
            },
        });
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
        const product = await database_1.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product || !product.isActive) {
            throw new errorHandler_1.AppError('Product not found', 404);
        }
        if (product.stockQuantity < quantity) {
            throw new errorHandler_1.AppError('Insufficient stock', 400);
        }
        // Check if item already in cart
        const existingItem = await database_1.prisma.cartItem.findUnique({
            where: {
                userId_productId: {
                    userId: req.user.id,
                    productId,
                },
            },
        });
        let cartItem;
        if (existingItem) {
            // Update quantity
            cartItem = await database_1.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity },
                include: {
                    product: {
                        include: {
                            images: { where: { isPrimary: true }, take: 1 },
                        },
                    },
                },
            });
        }
        else {
            // Create new cart item
            cartItem = await database_1.prisma.cartItem.create({
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
            });
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
        const cartItem = await database_1.prisma.cartItem.findFirst({
            where: { id, userId: req.user.id },
        });
        if (!cartItem) {
            throw new errorHandler_1.AppError('Cart item not found', 404);
        }
        const updatedItem = await database_1.prisma.cartItem.update({
            where: { id },
            data: { quantity },
            include: {
                product: {
                    include: {
                        images: { where: { isPrimary: true }, take: 1 },
                    },
                },
            },
        });
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
        await database_1.prisma.cartItem.deleteMany({
            where: { id, userId: req.user.id },
        });
        res.json({ success: true, message: 'Item removed from cart' });
    }
    catch (error) {
        next(error);
    }
};
exports.removeFromCart = removeFromCart;
const clearCart = async (req, res, next) => {
    try {
        await database_1.prisma.cartItem.deleteMany({
            where: { userId: req.user.id },
        });
        res.json({ success: true, message: 'Cart cleared' });
    }
    catch (error) {
        next(error);
    }
};
exports.clearCart = clearCart;
//# sourceMappingURL=cart.controller.js.map
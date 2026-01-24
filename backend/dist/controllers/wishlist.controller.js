"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromWishlist = exports.addToWishlist = exports.getWishlist = void 0;
const database_1 = require("../config/database");
const getWishlist = async (req, res, next) => {
    try {
        const wishlist = await database_1.prisma.wishlist.findMany({
            where: { userId: req.user.id },
            include: {
                product: {
                    include: {
                        images: { where: { isPrimary: true }, take: 1 },
                    },
                },
            },
        });
        res.json({ success: true, data: wishlist });
    }
    catch (error) {
        next(error);
    }
};
exports.getWishlist = getWishlist;
const addToWishlist = async (req, res, next) => {
    try {
        const { productId } = req.body;
        const wishlistItem = await database_1.prisma.wishlist.create({
            data: {
                userId: req.user.id,
                productId,
            },
            include: {
                product: {
                    include: {
                        images: { where: { isPrimary: true }, take: 1 },
                    },
                },
            },
        });
        res.status(201).json({ success: true, data: wishlistItem });
    }
    catch (error) {
        next(error);
    }
};
exports.addToWishlist = addToWishlist;
const removeFromWishlist = async (req, res, next) => {
    try {
        const { id } = req.params;
        await database_1.prisma.wishlist.deleteMany({
            where: { id, userId: req.user.id },
        });
        res.json({ success: true, message: 'Item removed from wishlist' });
    }
    catch (error) {
        next(error);
    }
};
exports.removeFromWishlist = removeFromWishlist;
//# sourceMappingURL=wishlist.controller.js.map
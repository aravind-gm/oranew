"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.updateReview = exports.createReview = exports.getProductReviews = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const getProductReviews = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const reviews = await database_1.prisma.review.findMany({
            where: {
                productId,
                isApproved: true,
            },
            include: {
                user: {
                    select: { fullName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: reviews });
    }
    catch (error) {
        next(error);
    }
};
exports.getProductReviews = getProductReviews;
const createReview = async (req, res, next) => {
    try {
        const { productId, rating, title, reviewText } = req.body;
        // Check if user already reviewed
        const existingReview = await database_1.prisma.review.findFirst({
            where: {
                productId,
                userId: req.user.id,
            },
        });
        if (existingReview) {
            throw new errorHandler_1.AppError('You have already reviewed this product', 400);
        }
        const review = await database_1.prisma.review.create({
            data: {
                productId,
                userId: req.user.id,
                rating,
                title,
                reviewText,
            },
        });
        // Update product rating
        const reviews = await database_1.prisma.review.findMany({
            where: { productId, isApproved: true },
        });
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await database_1.prisma.product.update({
            where: { id: productId },
            data: {
                averageRating: avgRating,
                reviewCount: reviews.length,
            },
        });
        res.status(201).json({ success: true, data: review });
    }
    catch (error) {
        next(error);
    }
};
exports.createReview = createReview;
const updateReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rating, title, reviewText } = req.body;
        const review = await database_1.prisma.review.updateMany({
            where: { id, userId: req.user.id },
            data: { rating, title, reviewText },
        });
        res.json({ success: true, data: review });
    }
    catch (error) {
        next(error);
    }
};
exports.updateReview = updateReview;
const deleteReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        await database_1.prisma.review.deleteMany({
            where: { id, userId: req.user.id },
        });
        res.json({ success: true, message: 'Review deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteReview = deleteReview;
//# sourceMappingURL=review.controller.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = exports.calculateGST = exports.calculateFinalPrice = exports.generateSKU = exports.generateOrderNumber = exports.AppError = exports.asyncHandler = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return errorHandler_1.AppError; } });
// Async handler wrapper for route handlers
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `ORA${timestamp}${random}`;
};
exports.generateOrderNumber = generateOrderNumber;
const generateSKU = (categoryName, productName) => {
    const categoryCode = categoryName.substring(0, 3).toUpperCase();
    const productCode = productName.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${categoryCode}-${productCode}-${random}`;
};
exports.generateSKU = generateSKU;
const calculateFinalPrice = (price, discountPercent) => {
    return price - (price * discountPercent) / 100;
};
exports.calculateFinalPrice = calculateFinalPrice;
const calculateGST = (amount, gstRate = 3) => {
    return (amount * gstRate) / 100;
};
exports.calculateGST = calculateGST;
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};
exports.slugify = slugify;
//# sourceMappingURL=helpers.js.map
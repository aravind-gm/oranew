"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAddress = exports.updateAddress = exports.createAddress = exports.getAddresses = exports.updateProfile = exports.getProfile = exports.completeProfile = void 0;
const database_1 = require("../config/database");
const retry_1 = require("../utils/retry");
const sanitize_1 = require("../utils/sanitize");
// @desc    Complete user profile (for new users)
// @route   PUT /api/users/complete-profile
// @access  Private
const completeProfile = async (req, res, next) => {
    try {
        const { fullName, phone, gender } = req.body;
        if (!fullName || fullName.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Full name is required',
            });
        }
        const user = await (0, retry_1.withRetry)(() => database_1.prisma.user.update({
            where: { id: req.user.id },
            data: {
                fullName: (0, sanitize_1.sanitizeText)(fullName),
                phone: phone ? (0, sanitize_1.sanitizePhone)(phone) : null,
                gender: gender || null,
                profileCompleted: true,
            },
        }));
        console.log(`[User] ✅ Profile completed for: ${user.email}`);
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                phone: user.phone,
                gender: user.gender,
                role: user.role,
                profileCompleted: user.profileCompleted,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.completeProfile = completeProfile;
// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res, next) => {
    try {
        const user = await (0, retry_1.withRetry)(() => database_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                gender: true,
                role: true,
                profileCompleted: true,
                createdAt: true,
            },
        }));
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        res.json({ success: true, user });
    }
    catch (error) {
        next(error);
    }
};
exports.getProfile = getProfile;
// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
    try {
        const { fullName, phone, gender } = req.body;
        // XSS SANITIZATION - Clean profile fields
        const updateData = {};
        if (fullName)
            updateData.fullName = (0, sanitize_1.sanitizeText)(fullName);
        if (phone !== undefined)
            updateData.phone = (0, sanitize_1.sanitizePhone)(phone);
        if (gender !== undefined)
            updateData.gender = gender;
        const user = await (0, retry_1.withRetry)(() => database_1.prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
        }));
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                phone: user.phone,
                gender: user.gender,
                role: user.role,
                profileCompleted: user.profileCompleted,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
const getAddresses = async (req, res, next) => {
    try {
        const addresses = await (0, retry_1.withRetry)(() => database_1.prisma.address.findMany({
            where: { userId: req.user.id },
            orderBy: { isDefault: 'desc' },
        }));
        res.json({ success: true, data: addresses });
    }
    catch (error) {
        next(error);
    }
};
exports.getAddresses = getAddresses;
const createAddress = async (req, res, next) => {
    try {
        const { fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault, addressType, } = req.body;
        // XSS SANITIZATION - Clean all address fields
        const sanitizedFullName = (0, sanitize_1.sanitizeText)(fullName);
        const sanitizedPhone = (0, sanitize_1.sanitizePhone)(phone);
        const sanitizedAddressLine1 = (0, sanitize_1.sanitizeText)(addressLine1);
        const sanitizedAddressLine2 = addressLine2 ? (0, sanitize_1.sanitizeText)(addressLine2) : null;
        const sanitizedCity = (0, sanitize_1.sanitizeText)(city);
        const sanitizedState = (0, sanitize_1.sanitizeText)(state);
        const sanitizedPincode = (0, sanitize_1.sanitizeText)(pincode);
        const sanitizedCountry = (0, sanitize_1.sanitizeText)(country || 'India');
        // If this is default, unset other defaults
        if (isDefault) {
            await (0, retry_1.withRetry)(() => database_1.prisma.address.updateMany({
                where: { userId: req.user.id },
                data: { isDefault: false },
            }));
        }
        const address = await (0, retry_1.withRetry)(() => database_1.prisma.address.create({
            data: {
                userId: req.user.id,
                fullName: sanitizedFullName,
                phone: sanitizedPhone,
                addressLine1: sanitizedAddressLine1,
                addressLine2: sanitizedAddressLine2,
                city: sanitizedCity,
                state: sanitizedState,
                pincode: sanitizedPincode,
                country: sanitizedCountry,
                isDefault,
                addressType,
            },
        }));
        res.status(201).json({ success: true, data: address });
    }
    catch (error) {
        next(error);
    }
};
exports.createAddress = createAddress;
const updateAddress = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // XSS SANITIZATION - Clean all address fields if provided
        if (updateData.fullName)
            updateData.fullName = (0, sanitize_1.sanitizeText)(updateData.fullName);
        if (updateData.phone)
            updateData.phone = (0, sanitize_1.sanitizePhone)(updateData.phone);
        if (updateData.addressLine1)
            updateData.addressLine1 = (0, sanitize_1.sanitizeText)(updateData.addressLine1);
        if (updateData.addressLine2)
            updateData.addressLine2 = (0, sanitize_1.sanitizeText)(updateData.addressLine2);
        if (updateData.city)
            updateData.city = (0, sanitize_1.sanitizeText)(updateData.city);
        if (updateData.state)
            updateData.state = (0, sanitize_1.sanitizeText)(updateData.state);
        if (updateData.pincode)
            updateData.pincode = (0, sanitize_1.sanitizeText)(updateData.pincode);
        if (updateData.country)
            updateData.country = (0, sanitize_1.sanitizeText)(updateData.country);
        // If setting as default, unset other defaults
        if (updateData.isDefault) {
            await (0, retry_1.withRetry)(() => database_1.prisma.address.updateMany({
                where: { userId: req.user.id },
                data: { isDefault: false },
            }));
        }
        const address = await (0, retry_1.withRetry)(() => database_1.prisma.address.updateMany({
            where: { id, userId: req.user.id },
            data: updateData,
        }));
        res.json({ success: true, data: address });
    }
    catch (error) {
        next(error);
    }
};
exports.updateAddress = updateAddress;
const deleteAddress = async (req, res, next) => {
    try {
        const { id } = req.params;
        await (0, retry_1.withRetry)(() => database_1.prisma.address.deleteMany({
            where: { id, userId: req.user.id },
        }));
        res.json({ success: true, message: 'Address deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteAddress = deleteAddress;
//# sourceMappingURL=user.controller.js.map
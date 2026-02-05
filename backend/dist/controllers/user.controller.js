"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAddress = exports.updateAddress = exports.createAddress = exports.getAddresses = exports.updateProfile = exports.getProfile = exports.completeProfile = void 0;
const database_1 = require("../config/database");
const retry_1 = require("../utils/retry");
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
                fullName: fullName.trim(),
                phone: phone || null,
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
        const updateData = {};
        if (fullName)
            updateData.fullName = fullName.trim();
        if (phone !== undefined)
            updateData.phone = phone;
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
                fullName,
                phone,
                addressLine1,
                addressLine2,
                city,
                state,
                pincode,
                country: country || 'India',
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
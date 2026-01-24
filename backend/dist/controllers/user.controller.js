"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAddress = exports.updateAddress = exports.createAddress = exports.getAddresses = void 0;
const database_1 = require("../config/database");
const getAddresses = async (req, res, next) => {
    try {
        const addresses = await database_1.prisma.address.findMany({
            where: { userId: req.user.id },
            orderBy: { isDefault: 'desc' },
        });
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
            await database_1.prisma.address.updateMany({
                where: { userId: req.user.id },
                data: { isDefault: false },
            });
        }
        const address = await database_1.prisma.address.create({
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
        });
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
            await database_1.prisma.address.updateMany({
                where: { userId: req.user.id },
                data: { isDefault: false },
            });
        }
        const address = await database_1.prisma.address.updateMany({
            where: { id, userId: req.user.id },
            data: updateData,
        });
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
        await database_1.prisma.address.deleteMany({
            where: { id, userId: req.user.id },
        });
        res.json({ success: true, message: 'Address deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteAddress = deleteAddress;
//# sourceMappingURL=user.controller.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryBySlug = exports.getCategories = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const helpers_1 = require("../utils/helpers");
const getCategories = async (req, res, next) => {
    try {
        const categories = await database_1.prisma.category.findMany({
            where: { isActive: true, parentId: null },
            include: {
                children: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });
        res.json({ success: true, data: categories });
    }
    catch (error) {
        next(error);
    }
};
exports.getCategories = getCategories;
const getCategoryBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const category = await database_1.prisma.category.findUnique({
            where: { slug },
            include: {
                children: { where: { isActive: true } },
                products: {
                    where: { isActive: true },
                    include: {
                        images: { where: { isPrimary: true }, take: 1 },
                    },
                    take: 12,
                },
            },
        });
        if (!category) {
            throw new errorHandler_1.AppError('Category not found', 404);
        }
        res.json({ success: true, data: category });
    }
    catch (error) {
        next(error);
    }
};
exports.getCategoryBySlug = getCategoryBySlug;
const createCategory = async (req, res, next) => {
    try {
        const { name, description, parentId, imageUrl } = req.body;
        const category = await database_1.prisma.category.create({
            data: {
                name,
                slug: (0, helpers_1.slugify)(name),
                description,
                parentId,
                imageUrl,
            },
        });
        res.status(201).json({ success: true, data: category });
    }
    catch (error) {
        next(error);
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (updateData.name) {
            updateData.slug = (0, helpers_1.slugify)(updateData.name);
        }
        const category = await database_1.prisma.category.update({
            where: { id },
            data: updateData,
        });
        res.json({ success: true, data: category });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        await database_1.prisma.category.delete({ where: { id } });
        res.json({ success: true, message: 'Category deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=category.controller.js.map
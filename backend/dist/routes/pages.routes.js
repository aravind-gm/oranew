"use strict";
/**
 * Static Pages Routes
 * CRUD operations for static content pages (About, Terms, Privacy, etc.)
 *
 * @author ORA Engineering
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
// ============================================
// GET ALL PAGES (Admin)
// ============================================
router.get('/', auth_1.protect, (0, auth_1.authorize)('ADMIN'), async (req, res, next) => {
    try {
        const { published } = req.query;
        const where = {};
        if (published === 'true')
            where.isPublished = true;
        if (published === 'false')
            where.isPublished = false;
        const pages = await database_1.prisma.staticPage.findMany({
            where,
            orderBy: [
                { sortOrder: 'asc' },
                { title: 'asc' },
            ],
        });
        res.json({
            success: true,
            pages,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// GET PAGE BY SLUG (Public)
// ============================================
router.get('/slug/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;
        const page = await database_1.prisma.staticPage.findUnique({
            where: { slug },
        });
        if (!page || !page.isPublished) {
            throw new errorHandler_1.AppError('Page not found', 404);
        }
        res.json({
            success: true,
            page,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// GET PAGE BY ID (Admin)
// ============================================
router.get('/:id', auth_1.protect, (0, auth_1.authorize)('ADMIN'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const page = await database_1.prisma.staticPage.findUnique({
            where: { id },
        });
        if (!page) {
            throw new errorHandler_1.AppError('Page not found', 404);
        }
        res.json({
            success: true,
            page,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// CREATE PAGE
// ============================================
router.post('/', auth_1.protect, (0, auth_1.authorize)('ADMIN'), async (req, res, next) => {
    try {
        const { title, slug, content = '', metaTitle, metaDescription, isPublished = false, sortOrder = 0, } = req.body;
        if (!title || !slug) {
            throw new errorHandler_1.AppError('Title and slug are required', 400);
        }
        // Check if slug already exists
        const existing = await database_1.prisma.staticPage.findUnique({
            where: { slug },
        });
        if (existing) {
            throw new errorHandler_1.AppError('A page with this slug already exists', 400);
        }
        const page = await database_1.prisma.staticPage.create({
            data: {
                title,
                slug,
                content,
                metaTitle,
                metaDescription,
                isPublished,
                sortOrder,
            },
        });
        res.status(201).json({
            success: true,
            page,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// UPDATE PAGE
// ============================================
router.put('/:id', auth_1.protect, (0, auth_1.authorize)('ADMIN'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, slug, content, metaTitle, metaDescription, isPublished, sortOrder, } = req.body;
        const page = await database_1.prisma.staticPage.findUnique({
            where: { id },
        });
        if (!page) {
            throw new errorHandler_1.AppError('Page not found', 404);
        }
        // Check if new slug conflicts with existing page
        if (slug && slug !== page.slug) {
            const existing = await database_1.prisma.staticPage.findUnique({
                where: { slug },
            });
            if (existing) {
                throw new errorHandler_1.AppError('A page with this slug already exists', 400);
            }
        }
        const updated = await database_1.prisma.staticPage.update({
            where: { id },
            data: {
                title: title ?? page.title,
                slug: slug ?? page.slug,
                content: content ?? page.content,
                metaTitle: metaTitle ?? page.metaTitle,
                metaDescription: metaDescription ?? page.metaDescription,
                isPublished: isPublished ?? page.isPublished,
                sortOrder: sortOrder ?? page.sortOrder,
            },
        });
        res.json({
            success: true,
            page: updated,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// TOGGLE PAGE PUBLISH STATUS
// ============================================
router.patch('/:id/toggle', auth_1.protect, (0, auth_1.authorize)('ADMIN'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const page = await database_1.prisma.staticPage.findUnique({
            where: { id },
        });
        if (!page) {
            throw new errorHandler_1.AppError('Page not found', 404);
        }
        const updated = await database_1.prisma.staticPage.update({
            where: { id },
            data: { isPublished: !page.isPublished },
        });
        res.json({
            success: true,
            page: updated,
            message: `Page ${updated.isPublished ? 'published' : 'unpublished'}`,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// DELETE PAGE
// ============================================
router.delete('/:id', auth_1.protect, (0, auth_1.authorize)('ADMIN'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const page = await database_1.prisma.staticPage.findUnique({
            where: { id },
        });
        if (!page) {
            throw new errorHandler_1.AppError('Page not found', 404);
        }
        await database_1.prisma.staticPage.delete({
            where: { id },
        });
        res.json({
            success: true,
            message: 'Page deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=pages.routes.js.map
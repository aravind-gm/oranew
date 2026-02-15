"use strict";
/**
 * Announcements Routes
 * CRUD operations for site-wide announcements
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
// GET ALL ANNOUNCEMENTS
// ============================================
router.get('/', auth_1.protect, (0, auth_1.authorize)('ADMIN'), async (req, res, next) => {
    try {
        const { active } = req.query;
        const where = {};
        if (active === 'true')
            where.isActive = true;
        if (active === 'false')
            where.isActive = false;
        const announcements = await database_1.prisma.announcement.findMany({
            where,
            orderBy: [
                { priority: 'asc' },
                { createdAt: 'desc' },
            ],
        });
        res.json({
            success: true,
            announcements,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// GET ACTIVE ANNOUNCEMENTS (PUBLIC)
// ============================================
router.get('/active', async (_req, res, next) => {
    try {
        const now = new Date();
        const announcements = await database_1.prisma.announcement.findMany({
            where: {
                isActive: true,
                OR: [
                    { startDate: null },
                    { startDate: { lte: now } },
                ],
                AND: [
                    {
                        OR: [
                            { endDate: null },
                            { endDate: { gte: now } },
                        ],
                    },
                ],
            },
            orderBy: { priority: 'asc' },
        });
        res.json({
            success: true,
            announcements,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// CREATE ANNOUNCEMENT
// ============================================
router.post('/', auth_1.protect, (0, auth_1.authorize)('ADMIN'), async (req, res, next) => {
    try {
        const { message, type = 'bar', backgroundColor, textColor, link, linkText, isActive = true, priority = 1, startDate, endDate, } = req.body;
        if (!message) {
            throw new errorHandler_1.AppError('Message is required', 400);
        }
        const announcement = await database_1.prisma.announcement.create({
            data: {
                message,
                type,
                backgroundColor,
                textColor,
                link,
                linkText,
                isActive,
                priority,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
            },
        });
        res.status(201).json({
            success: true,
            announcement,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// UPDATE ANNOUNCEMENT
// ============================================
router.put('/:id', auth_1.protect, (0, auth_1.authorize)('ADMIN'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { message, type, backgroundColor, textColor, link, linkText, isActive, priority, startDate, endDate, } = req.body;
        const announcement = await database_1.prisma.announcement.findUnique({
            where: { id },
        });
        if (!announcement) {
            throw new errorHandler_1.AppError('Announcement not found', 404);
        }
        const updated = await database_1.prisma.announcement.update({
            where: { id },
            data: {
                message: message ?? announcement.message,
                type: type ?? announcement.type,
                backgroundColor: backgroundColor ?? announcement.backgroundColor,
                textColor: textColor ?? announcement.textColor,
                link: link ?? announcement.link,
                linkText: linkText ?? announcement.linkText,
                isActive: isActive ?? announcement.isActive,
                priority: priority ?? announcement.priority,
                startDate: startDate ? new Date(startDate) : announcement.startDate,
                endDate: endDate ? new Date(endDate) : announcement.endDate,
            },
        });
        res.json({
            success: true,
            announcement: updated,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// TOGGLE ANNOUNCEMENT
// ============================================
router.patch('/:id/toggle', auth_1.protect, (0, auth_1.authorize)('ADMIN'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const announcement = await database_1.prisma.announcement.findUnique({
            where: { id },
        });
        if (!announcement) {
            throw new errorHandler_1.AppError('Announcement not found', 404);
        }
        const updated = await database_1.prisma.announcement.update({
            where: { id },
            data: { isActive: !announcement.isActive },
        });
        res.json({
            success: true,
            announcement: updated,
            message: `Announcement ${updated.isActive ? 'activated' : 'deactivated'}`,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// DELETE ANNOUNCEMENT
// ============================================
router.delete('/:id', auth_1.protect, (0, auth_1.authorize)('ADMIN'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const announcement = await database_1.prisma.announcement.findUnique({
            where: { id },
        });
        if (!announcement) {
            throw new errorHandler_1.AppError('Announcement not found', 404);
        }
        await database_1.prisma.announcement.delete({
            where: { id },
        });
        res.json({
            success: true,
            message: 'Announcement deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=announcements.routes.js.map
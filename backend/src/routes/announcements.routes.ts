/**
 * Announcements Routes
 * CRUD operations for site-wide announcements
 * 
 * @author ORA Engineering
 */

import { Router, Response, NextFunction } from 'express';
import { authorize, protect, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// ============================================
// GET ALL ANNOUNCEMENTS
// ============================================

router.get(
  '/',
  protect,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { active } = req.query;

      const where: any = {};
      if (active === 'true') where.isActive = true;
      if (active === 'false') where.isActive = false;

      const announcements = await prisma.announcement.findMany({
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
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET ACTIVE ANNOUNCEMENTS (PUBLIC)
// ============================================

router.get(
  '/active',
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const now = new Date();

      const announcements = await prisma.announcement.findMany({
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
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// CREATE ANNOUNCEMENT
// ============================================

router.post(
  '/',
  protect,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const {
        message,
        type = 'bar',
        backgroundColor,
        textColor,
        link,
        linkText,
        isActive = true,
        priority = 1,
        startDate,
        endDate,
      } = req.body;

      if (!message) {
        throw new AppError('Message is required', 400);
      }

      const announcement = await prisma.announcement.create({
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
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// UPDATE ANNOUNCEMENT
// ============================================

router.put(
  '/:id',
  protect,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const {
        message,
        type,
        backgroundColor,
        textColor,
        link,
        linkText,
        isActive,
        priority,
        startDate,
        endDate,
      } = req.body;

      const announcement = await prisma.announcement.findUnique({
        where: { id },
      });

      if (!announcement) {
        throw new AppError('Announcement not found', 404);
      }

      const updated = await prisma.announcement.update({
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
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// TOGGLE ANNOUNCEMENT
// ============================================

router.patch(
  '/:id/toggle',
  protect,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const announcement = await prisma.announcement.findUnique({
        where: { id },
      });

      if (!announcement) {
        throw new AppError('Announcement not found', 404);
      }

      const updated = await prisma.announcement.update({
        where: { id },
        data: { isActive: !announcement.isActive },
      });

      res.json({
        success: true,
        announcement: updated,
        message: `Announcement ${updated.isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// DELETE ANNOUNCEMENT
// ============================================

router.delete(
  '/:id',
  protect,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const announcement = await prisma.announcement.findUnique({
        where: { id },
      });

      if (!announcement) {
        throw new AppError('Announcement not found', 404);
      }

      await prisma.announcement.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Announcement deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

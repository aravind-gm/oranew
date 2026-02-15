/**
 * Static Pages Routes
 * CRUD operations for static content pages (About, Terms, Privacy, etc.)
 * 
 * @author ORA Engineering
 */

import { Router, Response, NextFunction } from 'express';
import { authorize, protect, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// ============================================
// GET ALL PAGES (Admin)
// ============================================

router.get(
  '/',
  protect,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { published } = req.query;

      const where: any = {};
      if (published === 'true') where.isPublished = true;
      if (published === 'false') where.isPublished = false;

      const pages = await prisma.staticPage.findMany({
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
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET PAGE BY SLUG (Public)
// ============================================

router.get(
  '/slug/:slug',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;

      const page = await prisma.staticPage.findUnique({
        where: { slug },
      });

      if (!page || !page.isPublished) {
        throw new AppError('Page not found', 404);
      }

      res.json({
        success: true,
        page,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET PAGE BY ID (Admin)
// ============================================

router.get(
  '/:id',
  protect,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const page = await prisma.staticPage.findUnique({
        where: { id },
      });

      if (!page) {
        throw new AppError('Page not found', 404);
      }

      res.json({
        success: true,
        page,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// CREATE PAGE
// ============================================

router.post(
  '/',
  protect,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const {
        title,
        slug,
        content = '',
        metaTitle,
        metaDescription,
        isPublished = false,
        sortOrder = 0,
      } = req.body;

      if (!title || !slug) {
        throw new AppError('Title and slug are required', 400);
      }

      // Check if slug already exists
      const existing = await prisma.staticPage.findUnique({
        where: { slug },
      });

      if (existing) {
        throw new AppError('A page with this slug already exists', 400);
      }

      const page = await prisma.staticPage.create({
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
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// UPDATE PAGE
// ============================================

router.put(
  '/:id',
  protect,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const {
        title,
        slug,
        content,
        metaTitle,
        metaDescription,
        isPublished,
        sortOrder,
      } = req.body;

      const page = await prisma.staticPage.findUnique({
        where: { id },
      });

      if (!page) {
        throw new AppError('Page not found', 404);
      }

      // Check if new slug conflicts with existing page
      if (slug && slug !== page.slug) {
        const existing = await prisma.staticPage.findUnique({
          where: { slug },
        });
        if (existing) {
          throw new AppError('A page with this slug already exists', 400);
        }
      }

      const updated = await prisma.staticPage.update({
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
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// TOGGLE PAGE PUBLISH STATUS
// ============================================

router.patch(
  '/:id/toggle',
  protect,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const page = await prisma.staticPage.findUnique({
        where: { id },
      });

      if (!page) {
        throw new AppError('Page not found', 404);
      }

      const updated = await prisma.staticPage.update({
        where: { id },
        data: { isPublished: !page.isPublished },
      });

      res.json({
        success: true,
        page: updated,
        message: `Page ${updated.isPublished ? 'published' : 'unpublished'}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// DELETE PAGE
// ============================================

router.delete(
  '/:id',
  protect,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const page = await prisma.staticPage.findUnique({
        where: { id },
      });

      if (!page) {
        throw new AppError('Page not found', 404);
      }

      await prisma.staticPage.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Page deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

// backend/api/products.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { successResponse, errorResponse, methodNotAllowed, withErrorHandling } from '../lib/handlers';
import { prisma } from '../lib/prisma';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // GET /api/products
    const { page = 1, limit = 12, slug } = req.query;

    // If slug is provided, get single product
    if (slug) {
      const product = await prisma.product.findUnique({
        where: { slug: slug as string },
        include: {
          category: true,
          images: true,
          reviews: {
            include: {
              user: {
                select: { fullName: true, email: true },
              },
            },
          },
        },
      });

      if (!product || !product.isActive) {
        return errorResponse(res, 'Product not found', 404);
      }

      return successResponse(res, product);
    }

    // Get all active products with pagination
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSize = Math.min(100, parseInt(limit as string) || 12);
    const skip = (pageNum - 1) * pageSize;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        include: {
          category: true,
          images: true,
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where: { isActive: true } }),
    ]);

    return successResponse(res, {
      products,
      total,
      page: pageNum,
      limit: pageSize,
      pages: Math.ceil(total / pageSize),
    });
  }

  return methodNotAllowed(res);
}

export default withErrorHandling(handler);

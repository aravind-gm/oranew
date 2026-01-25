// backend/api/admin/products.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  successResponse,
  errorResponse,
  methodNotAllowed,
  withErrorHandling,
} from '../../lib/handlers';
import { requireAdmin } from '../../lib/auth';
import { prisma } from '../../lib/prisma';

async function handler(req: VercelRequest, res: VercelResponse) {
  // All admin routes require JWT
  const authHeader = req.headers.authorization;
  const admin = requireAdmin(authHeader);

  if (req.method === 'GET') {
    // GET /api/admin/products - List all products (admin view)
    const { page = 1, limit = 12, search } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSize = Math.min(100, parseInt(limit as string) || 12);
    const skip = (pageNum - 1) * pageSize;

    const where = search
      ? {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { sku: { contains: search as string, mode: 'insensitive' } },
          ],
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          productImages: true,
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return successResponse(res, {
      products,
      total,
      page: pageNum,
      limit: pageSize,
    });
  }

  if (req.method === 'POST') {
    // POST /api/admin/products - Create product
    const {
      name,
      slug,
      description,
      price,
      stock,
      categoryId,
      sku,
      images = [],
    } = req.body;

    if (!name || !slug || !price || !categoryId) {
      return errorResponse(res, 'Missing required fields', 400);
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
        sku,
        categoryId,
        isActive: true,
        productImages: {
          create: images.map((url: string) => ({
            imageUrl: url,
            isMain: false,
          })),
        },
      },
      include: {
        category: true,
        productImages: true,
      },
    });

    return successResponse(res, product, 201);
  }

  if (req.method === 'PUT') {
    // PUT /api/admin/products/:id - Update product
    const { id } = req.query;
    const { name, slug, description, price, stock, categoryId, images } = req.body;

    if (!id) {
      return errorResponse(res, 'Product ID required', 400);
    }

    const product = await prisma.product.update({
      where: { id: id as string },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(categoryId && { categoryId }),
      },
      include: {
        category: true,
        productImages: true,
      },
    });

    return successResponse(res, product);
  }

  if (req.method === 'DELETE') {
    // DELETE /api/admin/products/:id - Delete product
    const { id } = req.query;

    if (!id) {
      return errorResponse(res, 'Product ID required', 400);
    }

    await prisma.product.delete({
      where: { id: id as string },
    });

    return successResponse(res, { message: 'Product deleted' });
  }

  return methodNotAllowed(res);
}

export default withErrorHandling(handler);

// backend/api/cart.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { successResponse, errorResponse, methodNotAllowed, withErrorHandling } from '../lib/handlers';
import { prisma } from '../lib/prisma';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // GET /api/cart/:id - Get cart (use localStorage on frontend, this is just verification)
    return successResponse(res, { message: 'Cart is managed on frontend using localStorage' });
  }

  if (req.method === 'POST') {
    // POST /api/cart - Create/verify cart items
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return errorResponse(res, 'Invalid cart items', 400);
    }

    // Get all products in cart
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { images: true },
    });

    if (products.length !== productIds.length) {
      return errorResponse(res, 'Some products not found', 404);
    }

    // Verify inventory
    const cartWithDetails = items.map((item: any) => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      if (item.quantity > product.stockQuantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      return {
        product,
        quantity: item.quantity,
        size: item.size,
      };
    });

    successResponse(res, { items: cartWithDetails });
  }

  return methodNotAllowed(res);
}

export default withErrorHandling(handler);

// backend/api/orders.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { successResponse, errorResponse, methodNotAllowed, withErrorHandling } from '../lib/handlers';
import { prisma } from '../lib/prisma';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    // POST /api/orders - Create order
    const { items, shippingAddress, email, phone } = req.body;

    if (!items || !shippingAddress) {
      return errorResponse(res, 'Missing required fields', 400);
    }

    // Get products
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // Calculate total
    let total = 0;
    const orderItems = items.map((item: any) => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      total += product.price * item.quantity;
      return {
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        size: item.size || null,
      };
    });

    // Create order
    const order = await prisma.order.create({
      data: {
        email,
        phone,
        shippingAddress,
        subtotal: total,
        tax: Math.round(total * 0.18 * 100) / 100,
        shipping: 50,
        total: total + Math.round(total * 0.18 * 100) / 100 + 50,
        status: 'PENDING',
        orderItems: {
          create: orderItems,
        },
      },
      include: { orderItems: true },
    });

    return successResponse(res, order, 201);
  }

  if (req.method === 'GET') {
    // GET /api/orders/:id - Get order by ID
    const { id } = req.query;

    if (!id) {
      return errorResponse(res, 'Order ID required', 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: id as string },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    return successResponse(res, order);
  }

  return methodNotAllowed(res);
}

export default withErrorHandling(handler);

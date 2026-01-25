// backend/api/orders.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { successResponse, errorResponse, methodNotAllowed, withErrorHandling } from '../lib/handlers';
import { prisma } from '../lib/prisma';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    // POST /api/orders - Create order
    const { items, shippingAddressId, billingAddressId, userId } = req.body;

    if (!items || !shippingAddressId || !billingAddressId || !userId) {
      return errorResponse(res, 'Missing required fields', 400);
    }

    // Get products
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // Calculate totals
    let subtotal = 0;
    const orderItems = items.map((item: any) => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;
      return {
        productName: product.name,
        productImage: null,
        quantity: item.quantity,
        unitPrice: product.price,
        gstRate: 18,
        totalPrice: itemTotal,
        discount: 0,
      };
    });

    const gstAmount = Math.round(subtotal * 0.18 * 100) / 100;
    const shippingFee = 50;
    const totalAmount = subtotal + gstAmount + shippingFee;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        userId,
        shippingAddressId,
        billingAddressId,
        subtotal,
        gstAmount,
        shippingFee,
        totalAmount,
        paymentStatus: 'PENDING',
        status: 'PENDING',
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
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
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
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

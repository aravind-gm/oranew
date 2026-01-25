// backend/api/categories.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { successResponse, methodNotAllowed, withErrorHandling } from '../lib/handlers';
import { prisma } from '../lib/prisma';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res);
  }

  // GET /api/categories
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  successResponse(res, categories);
}

export default withErrorHandling(handler);

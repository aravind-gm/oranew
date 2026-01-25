// backend/api/health.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { successResponse, methodNotAllowed } from '../lib/handlers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res);
  }

  successResponse(res, {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

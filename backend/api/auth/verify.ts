// backend/api/auth/verify.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  successResponse,
  errorResponse,
  methodNotAllowed,
  withErrorHandling,
} from '../../lib/handlers';
import { verifyJWT } from '../../lib/auth';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  const { token } = req.body;

  if (!token) {
    return errorResponse(res, 'Token required', 400);
  }

  try {
    const user = verifyJWT(token);
    return successResponse(res, { valid: true, user });
  } catch (error) {
    return errorResponse(res, 'Invalid token', 401);
  }
}

export default withErrorHandling(handler);

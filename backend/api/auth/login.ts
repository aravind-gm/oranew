// backend/api/auth/login.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  successResponse,
  errorResponse,
  methodNotAllowed,
  withErrorHandling,
} from '../../lib/handlers';
import { prisma } from '../../lib/prisma';
import { createJWT } from '../../lib/auth';
import bcrypt from 'bcryptjs';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(res, 'Email and password required', 400);
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return errorResponse(res, 'Invalid credentials', 401);
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return errorResponse(res, 'Invalid credentials', 401);
  }

  // Generate JWT
  const token = createJWT({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  successResponse(res, {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

export default withErrorHandling(handler);

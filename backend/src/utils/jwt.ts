import { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';

export const generateToken = (payload: {
  id: string;
  email: string;
  role: UserRole;
}): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as string,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    return null;
  }
};

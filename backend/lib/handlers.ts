// backend/lib/handlers.ts
import { VercelRequest, VercelResponse } from '@vercel/node';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function successResponse<T>(
  res: VercelResponse,
  data: T,
  statusCode: number = 200
) {
  res.status(statusCode).json({
    success: true,
    data,
  });
}

export function errorResponse(
  res: VercelResponse,
  error: string | Error,
  statusCode: number = 400
) {
  const message = error instanceof Error ? error.message : error;
  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

export function methodNotAllowed(res: VercelResponse) {
  res.status(405).json({
    success: false,
    error: 'Method not allowed',
  });
}

export type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void;

export function withErrorHandling(handler: Handler): Handler {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('[API Error]', error);

      if (error instanceof Error) {
        if (error.message.includes('Invalid or expired token')) {
          return errorResponse(res, 'Unauthorized: Invalid token', 401);
        }
        if (error.message.includes('Admin access required')) {
          return errorResponse(res, 'Forbidden: Admin access required', 403);
        }
        if (error.message.includes('Missing authorization token')) {
          return errorResponse(res, 'Unauthorized: Missing token', 401);
        }
        return errorResponse(res, error.message, 400);
      }

      return errorResponse(res, 'Internal server error', 500);
    }
  };
}

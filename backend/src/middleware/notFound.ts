import { NextFunction, Request, Response } from 'express';

export const notFound = (req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
};

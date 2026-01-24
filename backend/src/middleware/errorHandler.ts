import { NextFunction, Request, Response } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error with context
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Handler]', {
      endpoint: req.path,
      method: req.method,
      statusCode,
      message,
      stack: err.stack,
      body: req.body ? JSON.stringify(req.body).substring(0, 200) : 'no body',
    });
  } else {
    // Production: log minimal info
    console.error('[Error Handler]', {
      endpoint: req.path,
      method: req.method,
      statusCode,
      message,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

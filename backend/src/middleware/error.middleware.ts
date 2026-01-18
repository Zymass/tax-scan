import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`\n❌ [${new Date().toISOString()}] Error ${statusCode}:`, message);
  console.error(`📍 Path: ${req.method} ${req.path}`);
  if (err.stack) {
    console.error(`📚 Stack:`, err.stack);
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  logger.error('Unhandled request error:', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    });
    return;
  }

  // Handle CORS origin rejection
  if (err.message && err.message.includes('CORS error')) {
    res.status(403).json({ error: err.message });
    return;
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
  });
};

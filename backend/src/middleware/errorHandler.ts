import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { isDevelopment } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  details?: any;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    
      // Maintains proper stack trace for where error was thrown
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ApiError);
  }
  }
}

/**
 * Handle Prisma database errors
 */
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): ApiError => {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = error.meta?.target as string[] | undefined;
      return new ApiError(
        'Resource conflict',
        409,
        `A record with this ${field?.[0] || 'field'} already exists`
      );
    
    case 'P2025':
      // Record not found
      return new ApiError('Resource not found', 404);
    
    case 'P2003':
      // Foreign key constraint violation
      return new ApiError(
        'Invalid reference',
        400,
        'Referenced resource does not exist'
      );
    
    case 'P2014':
      // Required relation violation
      return new ApiError(
        'Invalid request',
        400,
        'Required relationship is missing'
      );
    
    default:
      return new ApiError('Database error', 500, isDevelopment ? error.message : undefined);
  }
};

/**
 * Handle different types of errors
 */
const handleError = (error: Error): ApiError => {
  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ApiError('Invalid data format', 400, isDevelopment ? error.message : undefined);
  }
  
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return new ApiError('Database error', 500, isDevelopment ? error.message : undefined);
  }
  
  // Handle custom API errors
  if (error instanceof ApiError) {
    return error;
  }
  
  // Handle generic errors
  if (error.name === 'ValidationError') {
    return new ApiError('Validation failed', 400, error.message);
  }
  
  if (error.name === 'CastError') {
    return new ApiError('Invalid data format', 400, error.message);
  }
  
  // Default error
  return new ApiError(
    'Internal server error',
    500,
    isDevelopment ? error.message : undefined
  );
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiError = handleError(error);
  
  // Log error for debugging
  if (apiError.statusCode >= 500) {
    console.error('Server Error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  // Send error response
  res.status(apiError.statusCode).json({
    error: apiError.message,
    ...(apiError.details && { details: apiError.details })
  });
};

/**
 * Handle 404 errors for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Route not found',
    details: `The endpoint ${req.method} ${req.path} does not exist`
  });
};

/**
 * Async error wrapper - catches async errors and passes to error handler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

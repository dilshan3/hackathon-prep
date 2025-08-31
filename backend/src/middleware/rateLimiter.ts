import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiter for authentication endpoints
 * More restrictive to prevent brute force attacks
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  message: {
    error: 'Too many authentication attempts',
    details: 'Maximum of 10 attempts per 15 minutes allowed. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      details: 'Maximum of 10 authentication attempts per 15 minutes allowed. Please try again later.'
    });
  }
});

/**
 * General API rate limiter
 * Applied to all authenticated routes
 */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 1000 requests per hour per IP
  message: {
    error: 'Rate limit exceeded',
    details: 'Maximum of 1000 requests per hour allowed. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      details: 'Maximum of 1000 requests per hour allowed. Please try again later.'
    });
  }
});

/**
 * Strict rate limiter for resource creation
 * Applied to POST endpoints that create resources
 */
export const createResourceRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 creations per hour per IP
  message: {
    error: 'Rate limit exceeded',
    details: 'Maximum of 100 resource creations per hour allowed. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      details: 'Maximum of 100 resource creations per hour allowed. Please try again later.'
    });
  }
});

/**
 * Development rate limiter (more lenient)
 */
export const devRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2000, // 2000 requests per hour in development
  message: {
    error: 'Rate limit exceeded',
    details: 'Maximum of 2000 requests per hour allowed in development.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

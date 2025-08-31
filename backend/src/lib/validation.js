const { z } = require('zod');

// User validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  name: z.string().min(1, 'Name is required').max(100).trim(),
  role: z.enum(['CUSTOMER', 'SUPPORT']).optional().default('CUSTOMER')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Issue validation schemas
const createIssueSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required').max(100).trim(),
  type: z.enum(['LATE', 'LOST', 'DAMAGED'], {
    errorMap: () => ({ message: 'Type must be one of: LATE, LOST, DAMAGED' })
  }),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
    errorMap: () => ({ message: 'Severity must be one of: LOW, MEDIUM, HIGH' })
  }),
  description: z.string().min(1, 'Description is required').max(1000, 'Description must be less than 1000 characters').trim()
});

const getIssuesSchema = z.object({
  orderId: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

const issueIdSchema = z.object({
  id: z.string().min(1, 'Issue ID is required')
});

/**
 * Middleware to validate request body against a schema
 */
function validateBody(schema) {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'ValidationError',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}

/**
 * Middleware to validate request query parameters against a schema
 */
function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.query);
      req.validatedQuery = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'ValidationError',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}

/**
 * Middleware to validate request parameters against a schema
 */
function validateParams(schema) {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.params);
      req.validatedParams = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'ValidationError',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  createIssueSchema,
  getIssuesSchema,
  issueIdSchema,
  validateBody,
  validateQuery,
  validateParams
};

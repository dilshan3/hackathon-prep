import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { IssueType, Severity, Status } from '@prisma/client';

// Custom validation schemas
const schemas = {
  // Auth validation schemas
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required'
    }),
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 100 characters',
      'any.required': 'Name is required'
    }),
    company: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Company name must be at least 2 characters long',
      'string.max': 'Company name must not exceed 100 characters',
      'any.required': 'Company is required'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required'
    })
  }),

  // Issue validation schemas
  createIssue: Joi.object({
    trackingNumber: Joi.string().min(3).max(50).required().messages({
      'string.min': 'Tracking number must be at least 3 characters long',
      'string.max': 'Tracking number must not exceed 50 characters',
      'any.required': 'Tracking number is required'
    }),
    type: Joi.string().valid(...Object.values(IssueType)).required().messages({
      'any.only': `Issue type must be one of: ${Object.values(IssueType).join(', ')}`,
      'any.required': 'Issue type is required'
    }),
    title: Joi.string().min(5).max(200).required().messages({
      'string.min': 'Title must be at least 5 characters long',
      'string.max': 'Title must not exceed 200 characters',
      'any.required': 'Title is required'
    }),
    description: Joi.string().min(10).max(2000).required().messages({
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description must not exceed 2000 characters',
      'any.required': 'Description is required'
    }),
    customerEmail: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid customer email address',
      'any.required': 'Customer email is required'
    }),
    customerPhone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional().messages({
      'string.pattern.base': 'Please provide a valid phone number'
    })
  }),

  triageIssue: Joi.object({
    severity: Joi.string().valid(...Object.values(Severity)).required().messages({
      'any.only': `Severity must be one of: ${Object.values(Severity).join(', ')}`,
      'any.required': 'Severity is required'
    }),
    status: Joi.string().valid(...Object.values(Status)).optional().messages({
      'any.only': `Status must be one of: ${Object.values(Status).join(', ')}`
    }),
    assignedTo: Joi.string().uuid().optional().messages({
      'string.uuid': 'Assigned to must be a valid UUID'
    })
  }),

  // Query parameter validation
  issueFilters: Joi.object({
    status: Joi.string().valid(...Object.values(Status)).optional(),
    severity: Joi.string().valid(...Object.values(Severity)).optional(),
    type: Joi.string().valid(...Object.values(IssueType)).optional(),
    q: Joi.string().min(1).max(100).optional(),
    cursor: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(100).default(20).optional()
  }),

  // UUID parameter validation
  uuidParam: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.uuid': 'Invalid ID format',
      'any.required': 'ID is required'
    })
  })
};

/**
 * Generic validation middleware factory
 */
export const validate = (schema: Joi.ObjectSchema, target: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = req[target];
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const details = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      res.status(400).json({
        error: 'Validation failed',
        details
      });
      return;
    }

    // Replace the original data with validated/sanitized data
    req[target] = value;
    next();
  };
};

// Pre-configured validation middleware
export const validateRegister = validate(schemas.register, 'body');
export const validateLogin = validate(schemas.login, 'body');
export const validateRefreshToken = validate(schemas.refreshToken, 'body');
export const validateCreateIssue = validate(schemas.createIssue, 'body');
export const validateTriageIssue = validate(schemas.triageIssue, 'body');
export const validateIssueFilters = validate(schemas.issueFilters, 'query');
export const validateUuidParam = validate(schemas.uuidParam, 'params');

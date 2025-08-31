const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { 
  validateBody, 
  validateQuery, 
  validateParams,
  createIssueSchema, 
  getIssuesSchema, 
  issueIdSchema 
} = require('../lib/validation');
const { 
  NotFoundError, 
  ForbiddenError,
  asyncHandler 
} = require('../lib/errors');
const { 
  authenticate, 
  requireCustomer, 
  requireSupport 
} = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /issues
 * Create a new issue (CUSTOMER role only)
 */
router.post('/', 
  authenticate, 
  requireCustomer, 
  validateBody(createIssueSchema), 
  asyncHandler(async (req, res) => {
    const { orderId, type, severity, description } = req.validatedData;
    const customerId = req.user.id;

    const issue = await prisma.issue.create({
      data: {
        orderId,
        type,
        severity,
        description,
        customerId
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Issue created successfully',
      issue
    });
  })
);

/**
 * GET /issues
 * List issues with filtering and pagination (SUPPORT role only)
 */
router.get('/', 
  authenticate, 
  requireSupport, 
  validateQuery(getIssuesSchema), 
  asyncHandler(async (req, res) => {
    const { 
      orderId, 
      status, 
      severity, 
      from, 
      to, 
      cursor, 
      limit 
    } = req.validatedQuery;

    // Build where clause
    const where = {};
    
    if (orderId) {
      where.orderId = { contains: orderId, mode: 'insensitive' };
    }
    
    if (status) {
      where.status = status;
    }
    
    if (severity) {
      where.severity = severity;
    }
    
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    
    if (cursor) {
      where.createdAt = {
        ...where.createdAt,
        lt: new Date(cursor)
      };
    }

    // Fetch issues with pagination
    const issues = await prisma.issue.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit + 1 // Take one extra to determine if there are more results
    });

    // Determine if there are more results
    const hasMore = issues.length > limit;
    const items = hasMore ? issues.slice(0, limit) : issues;
    
    // Generate next cursor
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    res.json({
      items,
      pagination: {
        hasMore,
        nextCursor,
        limit
      },
      totalDisplayed: items.length
    });
  })
);

/**
 * GET /issues/:id
 * Get a specific issue (SUPPORT can view any, CUSTOMER can only view their own)
 */
router.get('/:id', 
  authenticate, 
  validateParams(issueIdSchema), 
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!issue) {
      throw new NotFoundError('Issue not found');
    }

    // Check permissions: SUPPORT can view any issue, CUSTOMER can only view their own
    if (req.user.role === 'CUSTOMER' && issue.customerId !== req.user.id) {
      throw new ForbiddenError('You can only view your own issues');
    }

    res.json({
      issue
    });
  })
);

/**
 * GET /issues/my
 * Get current customer's issues (CUSTOMER role only)
 */
router.get('/my/list', 
  authenticate, 
  requireCustomer, 
  validateQuery(getIssuesSchema), 
  asyncHandler(async (req, res) => {
    const { 
      orderId, 
      status, 
      severity, 
      from, 
      to, 
      cursor, 
      limit 
    } = req.validatedQuery;

    // Build where clause - always filter by current customer
    const where = {
      customerId: req.user.id
    };
    
    if (orderId) {
      where.orderId = { contains: orderId, mode: 'insensitive' };
    }
    
    if (status) {
      where.status = status;
    }
    
    if (severity) {
      where.severity = severity;
    }
    
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    
    if (cursor) {
      where.createdAt = {
        ...where.createdAt,
        lt: new Date(cursor)
      };
    }

    // Fetch customer's issues
    const issues = await prisma.issue.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit + 1
    });

    // Determine if there are more results
    const hasMore = issues.length > limit;
    const items = hasMore ? issues.slice(0, limit) : issues;
    
    // Generate next cursor
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    res.json({
      items,
      pagination: {
        hasMore,
        nextCursor,
        limit
      },
      totalDisplayed: items.length
    });
  })
);

/**
 * PATCH /issues/:id/status
 * Update issue status (SUPPORT role only)
 */
const statusUpdateSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED'])
});

router.patch('/:id/status', 
  authenticate, 
  requireSupport, 
  validateParams(issueIdSchema),
  validateBody(statusUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;
    const { status } = req.validatedData;

    const issue = await prisma.issue.findUnique({
      where: { id }
    });

    if (!issue) {
      throw new NotFoundError('Issue not found');
    }

    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Issue status updated successfully',
      issue: updatedIssue
    });
  })
);

module.exports = router;

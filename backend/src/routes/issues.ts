import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { 
  validateCreateIssue, 
  validateTriageIssue, 
  validateIssueFilters,
  validateUuidParam 
} from '../middleware/validation';
import { createResourceRateLimit } from '../middleware/rateLimiter';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { 
  CreateIssueRequest, 
  TriageIssueRequest, 
  IssueFilters,
  AuthenticatedRequest,
  PaginatedResponse
} from '../types';
import { Issue, IssueType, Severity, Status } from '@prisma/client';

const router = Router();

// Apply authentication to all issue routes
router.use(authenticate);

/**
 * POST /issues
 * Create a new issue
 */
router.post('/',
  createResourceRateLimit,
  validateCreateIssue,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { 
      trackingNumber, 
      type, 
      title, 
      description, 
      customerEmail, 
      customerPhone 
    }: CreateIssueRequest = req.body;

    // Create issue with default severity and status
    const issue = await prisma.issue.create({
      data: {
        trackingNumber,
        type: type as IssueType,
        severity: Severity.MEDIUM, // Default severity
        status: Status.OPEN, // Default status
        title,
        description,
        customerEmail: customerEmail.toLowerCase(),
        customerPhone,
        createdById: req.user!.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Format response
    const response = {
      id: issue.id,
      trackingNumber: issue.trackingNumber,
      type: issue.type,
      severity: issue.severity,
      status: issue.status,
      title: issue.title,
      description: issue.description,
      customerEmail: issue.customerEmail,
      customerPhone: issue.customerPhone,
      assignedTo: issue.assignedToId,
      createdBy: issue.createdById,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
      resolvedAt: issue.resolvedAt?.toISOString() || null
    };

    res.status(201).json(response);
  })
);

/**
 * GET /issues
 * List issues with filtering and pagination
 */
router.get('/',
  validateIssueFilters,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { 
      status, 
      severity, 
      type, 
      q, 
      cursor, 
      limit = 20 
    }: IssueFilters = req.query;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status as Status;
    }

    if (severity) {
      where.severity = severity as Severity;
    }

    if (type) {
      where.type = type as IssueType;
    }

    // Text search across multiple fields
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { trackingNumber: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Cursor-based pagination
    const cursorCondition: any = {};
    if (cursor) {
      try {
        const decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString());
        cursorCondition.cursor = {
          id: decodedCursor.id
        };
        cursorCondition.skip = 1;
      } catch (error) {
        throw new ApiError('Invalid cursor format', 400);
      }
    }

    // Fetch issues with pagination
    const issues = await prisma.issue.findMany({
      where,
      ...cursorCondition,
      take: limit + 1, // Take one extra to determine if there are more pages
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }
      ],
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Determine if there are more pages
    const hasMore = issues.length > limit;
    const data = hasMore ? issues.slice(0, -1) : issues;

    // Generate next cursor
    let nextCursor = null;
    if (hasMore && data.length > 0) {
      const lastItem = data[data.length - 1];
      const cursorData = {
        createdAt: lastItem.createdAt.toISOString(),
        id: lastItem.id
      };
      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
    }

    // Format response data
    const formattedData = data.map((issue: any) => ({
      id: issue.id,
      trackingNumber: issue.trackingNumber,
      type: issue.type,
      severity: issue.severity,
      status: issue.status,
      title: issue.title,
      description: issue.description,
      customerEmail: issue.customerEmail,
      customerPhone: issue.customerPhone,
      assignedTo: issue.assignedToId,
      createdBy: issue.createdById,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
      resolvedAt: issue.resolvedAt?.toISOString() || null
    }));

    const response: PaginatedResponse<any> = {
      data: formattedData,
      pagination: {
        cursor: cursor || undefined,
        nextCursor,
        hasMore,
        limit
      }
    };

    res.status(200).json(response);
  })
);

/**
 * GET /issues/:id
 * Get a specific issue by ID
 */
router.get('/:id',
  validateUuidParam,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!issue) {
      throw new ApiError('Resource not found', 404, `Issue with ID ${id} does not exist`);
    }

    // Format response
    const response = {
      id: issue.id,
      trackingNumber: issue.trackingNumber,
      type: issue.type,
      severity: issue.severity,
      status: issue.status,
      title: issue.title,
      description: issue.description,
      customerEmail: issue.customerEmail,
      customerPhone: issue.customerPhone,
      assignedTo: issue.assignedToId,
      createdBy: issue.createdById,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
      resolvedAt: issue.resolvedAt?.toISOString() || null
    };

    res.status(200).json(response);
  })
);

/**
 * PATCH /issues/:id/triage
 * Triage an issue (set severity and optionally status/assignee)
 */
router.patch('/:id/triage',
  validateUuidParam,
  validateTriageIssue,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { severity, status, assignedTo }: TriageIssueRequest = req.body;

    // Check if issue exists
    const existingIssue = await prisma.issue.findUnique({
      where: { id }
    });

    if (!existingIssue) {
      throw new ApiError('Resource not found', 404, `Issue with ID ${id} does not exist`);
    }

    // If assignedTo is provided, verify the user exists
    if (assignedTo) {
      const assigneeExists = await prisma.user.findUnique({
        where: { id: assignedTo }
      });

      if (!assigneeExists) {
        throw new ApiError('Invalid reference', 400, `User with ID ${assignedTo} does not exist`);
      }
    }

    // Prepare update data
    const updateData: any = {
      severity: severity as Severity,
      updatedAt: new Date()
    };

    if (status) {
      updateData.status = status as Status;
      
      // If status is RESOLVED or CLOSED, set resolvedAt
      if (status === 'RESOLVED' || status === 'CLOSED') {
        updateData.resolvedAt = new Date();
      }
    }

    if (assignedTo !== undefined) {
      updateData.assignedToId = assignedTo;
    }

    // Update issue
    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Format response
    const response = {
      id: updatedIssue.id,
      trackingNumber: updatedIssue.trackingNumber,
      type: updatedIssue.type,
      severity: updatedIssue.severity,
      status: updatedIssue.status,
      title: updatedIssue.title,
      description: updatedIssue.description,
      customerEmail: updatedIssue.customerEmail,
      customerPhone: updatedIssue.customerPhone,
      assignedTo: updatedIssue.assignedToId,
      createdBy: updatedIssue.createdById,
      createdAt: updatedIssue.createdAt.toISOString(),
      updatedAt: updatedIssue.updatedAt.toISOString(),
      resolvedAt: updatedIssue.resolvedAt?.toISOString() || null
    };

    res.status(200).json(response);
  })
);

export default router;

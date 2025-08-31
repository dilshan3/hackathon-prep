import request from 'supertest';
import app from '../../app';
import { User, Issue, IssueType, Severity, Status } from '@prisma/client';
import { generateAccessToken } from '../../utils/auth';

describe('Issues Routes', () => {
  const mockUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    password: '$2a$12$hashedpassword',
    name: 'Test User',
    company: 'Test Company',
    role: 'user',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z')
  };

  const mockIssue: Issue = {
    id: '660e8400-e29b-41d4-a716-446655440000',
    trackingNumber: 'TRK123456789',
    type: IssueType.PACKAGE_DAMAGED,
    severity: Severity.HIGH,
    status: Status.OPEN,
    title: 'Package arrived damaged',
    description: 'Customer reports visible damage to package upon delivery.',
    customerEmail: 'customer@example.com',
    customerPhone: '+1-555-0123',
    assignedToId: null,
    createdById: mockUser.id,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    resolvedAt: null
  };

  let accessToken: string;

  beforeEach(() => {
    accessToken = generateAccessToken({
      userId: mockUser.id,
      email: mockUser.email
    });

    // Mock user authentication
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
  });

  describe('POST /api/v1/issues', () => {
    it('should create a new issue successfully', async () => {
      const issueData = {
        trackingNumber: 'TRK123456789',
        type: 'PACKAGE_DAMAGED',
        title: 'Package arrived damaged',
        description: 'Customer reports visible damage to package upon delivery.',
        customerEmail: 'customer@example.com',
        customerPhone: '+1-555-0123'
      };

      const mockCreatedIssue = {
        ...mockIssue,
        severity: Severity.MEDIUM, // Override to match expected default
        createdBy: { id: mockUser.id, name: mockUser.name, email: mockUser.email },
        assignedTo: null
      };

      mockPrisma.issue.create.mockResolvedValue(mockCreatedIssue);

      const response = await request(app)
        .post('/api/v1/issues')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(issueData);

      expect(response.status).toBe(201);
      expect(response.body.trackingNumber).toBe(issueData.trackingNumber);
      expect(response.body.type).toBe(issueData.type);
      expect(response.body.title).toBe(issueData.title);
      expect(response.body.severity).toBe('MEDIUM'); // Default severity
      expect(response.body.status).toBe('OPEN'); // Default status
    });

    it('should return 401 without authentication', async () => {
      const issueData = {
        trackingNumber: 'TRK123456789',
        type: 'PACKAGE_DAMAGED',
        title: 'Package arrived damaged',
        description: 'Customer reports visible damage to package upon delivery.',
        customerEmail: 'customer@example.com'
      };

      const response = await request(app)
        .post('/api/v1/issues')
        .send(issueData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 400 for invalid issue data', async () => {
      const invalidIssueData = {
        trackingNumber: 'TR', // Too short
        type: 'INVALID_TYPE',
        title: 'Short', // Too short
        description: 'Too short', // Too short
        customerEmail: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/v1/issues')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidIssueData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/v1/issues', () => {
    it('should list issues with pagination', async () => {
      const mockIssues = [mockIssue];
      const mockIssuesWithRelations = mockIssues.map(issue => ({
        ...issue,
        createdBy: { id: mockUser.id, name: mockUser.name, email: mockUser.email },
        assignedTo: null
      }));

      mockPrisma.issue.findMany.mockResolvedValue(mockIssuesWithRelations);

      const response = await request(app)
        .get('/api/v1/issues')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.hasMore).toBe(false);
    });

    it('should filter issues by status', async () => {
      const mockIssues = [mockIssue];
      const mockIssuesWithRelations = mockIssues.map(issue => ({
        ...issue,
        createdBy: { id: mockUser.id, name: mockUser.name, email: mockUser.email },
        assignedTo: null
      }));

      mockPrisma.issue.findMany.mockResolvedValue(mockIssuesWithRelations);

      const response = await request(app)
        .get('/api/v1/issues?status=OPEN')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(mockPrisma.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'OPEN'
          })
        })
      );
    });

    it('should search issues with text query', async () => {
      const mockIssues = [mockIssue];
      const mockIssuesWithRelations = mockIssues.map(issue => ({
        ...issue,
        createdBy: { id: mockUser.id, name: mockUser.name, email: mockUser.email },
        assignedTo: null
      }));

      mockPrisma.issue.findMany.mockResolvedValue(mockIssuesWithRelations);

      const response = await request(app)
        .get('/api/v1/issues?q=damaged')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(mockPrisma.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: { contains: 'damaged', mode: 'insensitive' } },
              { description: { contains: 'damaged', mode: 'insensitive' } },
              { trackingNumber: { contains: 'damaged', mode: 'insensitive' } }
            ])
          })
        })
      );
    });
  });

  describe('GET /api/v1/issues/:id', () => {
    it('should get issue by ID successfully', async () => {
      const mockIssueWithRelations = {
        ...mockIssue,
        createdBy: { id: mockUser.id, name: mockUser.name, email: mockUser.email },
        assignedTo: null
      };

      mockPrisma.issue.findUnique.mockResolvedValue(mockIssueWithRelations);

      const response = await request(app)
        .get(`/api/v1/issues/${mockIssue.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(mockIssue.id);
      expect(response.body.trackingNumber).toBe(mockIssue.trackingNumber);
    });

    it('should return 404 for non-existent issue', async () => {
      mockPrisma.issue.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/issues/550e8400-e29b-41d4-a716-446655440999')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Resource not found');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/v1/issues/invalid-uuid')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PATCH /api/v1/issues/:id/triage', () => {
    it('should triage issue successfully', async () => {
      const triageData = {
        severity: 'CRITICAL',
        status: 'TRIAGED',
        assignedTo: '750e8400-e29b-41d4-a716-446655440001'
      };

      const mockAssignee = {
        id: '750e8400-e29b-41d4-a716-446655440001',
        name: 'Assignee User',
        email: 'assignee@example.com'
      };

      const mockUpdatedIssue = {
        ...mockIssue,
        severity: Severity.CRITICAL,
        status: Status.TRIAGED,
        assignedToId: triageData.assignedTo,
        createdBy: { id: mockUser.id, name: mockUser.name, email: mockUser.email },
        assignedTo: mockAssignee
      };

      mockPrisma.issue.findUnique.mockResolvedValue(mockIssue);
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser); // For auth
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockAssignee); // For assignee check
      mockPrisma.issue.update.mockResolvedValue(mockUpdatedIssue);

      const response = await request(app)
        .patch(`/api/v1/issues/${mockIssue.id}/triage`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(triageData);

      expect(response.status).toBe(200);
      expect(response.body.severity).toBe('CRITICAL');
      expect(response.body.status).toBe('TRIAGED');
      expect(response.body.assignedTo).toBe(triageData.assignedTo);
    });

    it('should return 404 for non-existent issue', async () => {
      const triageData = {
        severity: 'HIGH'
      };

      mockPrisma.issue.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/v1/issues/550e8400-e29b-41d4-a716-446655440999/triage')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(triageData);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Resource not found');
    });

    it('should return 400 for invalid assignee', async () => {
      const triageData = {
        severity: 'HIGH',
        assignedTo: '750e8400-e29b-41d4-a716-446655440999'
      };

      mockPrisma.issue.findUnique.mockResolvedValue(mockIssue);
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser); // For auth
      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // For assignee check

      const response = await request(app)
        .patch(`/api/v1/issues/${mockIssue.id}/triage`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(triageData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid reference');
    });

    it('should return 400 for invalid severity', async () => {
      const triageData = {
        severity: 'INVALID_SEVERITY'
      };

      const response = await request(app)
        .patch(`/api/v1/issues/${mockIssue.id}/triage`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(triageData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });
});

import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { generateAccessToken } from '../../utils/auth';
import { User } from '@prisma/client';

describe('Auth Middleware', () => {
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

  let mockReq: any;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('authenticate middleware', () => {
    it('should authenticate valid token', async () => {
      const token = generateAccessToken({
        userId: mockUser.id,
        email: mockUser.email
      });

      mockReq.headers = {
        authorization: `Bearer ${token}`
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await authenticate(mockReq as any, mockRes as Response, mockNext);

      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 for missing token', async () => {
      await authenticate(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        details: 'No access token provided'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token format', async () => {
      mockReq.headers = {
        authorization: 'Basic invalid-token'
      };

      await authenticate(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        details: 'No access token provided'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token'
      };

      await authenticate(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        details: expect.any(String)
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for user not found', async () => {
      const token = generateAccessToken({
        userId: 'non-existent-user-id',
        email: 'nonexistent@example.com'
      });

      mockReq.headers = {
        authorization: `Bearer ${token}`
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await authenticate(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        details: 'User not found'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    it('should authorize user with correct role', () => {
      mockReq.user = mockUser;

      const authorizeUser = authorize(['user']);
      authorizeUser(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should authorize user with multiple allowed roles', () => {
      mockReq.user = mockUser;

      const authorizeMultiple = authorize(['admin', 'user', 'moderator']);
      authorizeMultiple(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated user', () => {
      // No user attached to request
      const authorizeUser = authorize(['user']);
      authorizeUser(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        details: 'User not authenticated'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 for insufficient permissions', () => {
      mockReq.user = mockUser; // User role is 'user'

      const authorizeAdmin = authorize(['admin']);
      authorizeAdmin(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        details: 'Required roles: admin'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 with multiple required roles', () => {
      mockReq.user = mockUser; // User role is 'user'

      const authorizeAdminModerator = authorize(['admin', 'moderator']);
      authorizeAdminModerator(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        details: 'Required roles: admin, moderator'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

import request from 'supertest';
import app from '../../app';
import { User } from '@prisma/client';

describe('Auth Routes', () => {
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

  const mockRefreshToken = {
    id: '660e8400-e29b-41d4-a716-446655440000',
    token: 'refresh-token-123',
    userId: mockUser.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date()
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'StrongPass123!',
        name: 'New User',
        company: 'New Company'
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.refreshToken.create.mockResolvedValue(mockRefreshToken);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registerData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body.user.email).toBe(mockUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 409 for existing email', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'StrongPass123!',
        name: 'Existing User',
        company: 'Existing Company'
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registerData);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Resource conflict');
    });

    it('should return 400 for weak password', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'weak',
        name: 'New User',
        company: 'New Company'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registerData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid email', async () => {
      const registerData = {
        email: 'invalid-email',
        password: 'StrongPass123!',
        name: 'New User',
        company: 'New Company'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registerData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.refreshToken.create.mockResolvedValue(mockRefreshToken);

      // Mock bcrypt.compare to return true
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(mockUser.email);
    });

    it('should return 401 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication failed');
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Mock bcrypt.compare to return false
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication failed');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const refreshData = {
        refreshToken: 'valid-refresh-token'
      };

      const mockStoredToken = {
        ...mockRefreshToken,
        user: mockUser
      };

      // Mock JWT verification
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValue({ jti: 'test-jti' });

      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockStoredToken);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send(refreshData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('expiresIn');
    });

    it('should return 401 for invalid refresh token', async () => {
      const refreshData = {
        refreshToken: 'invalid-refresh-token'
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send(refreshData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication failed');
    });

    it('should return 401 for expired refresh token', async () => {
      const refreshData = {
        refreshToken: 'expired-refresh-token'
      };

      const expiredToken = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        user: mockUser
      };

      // Mock JWT verification to succeed
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValue({ jti: 'test-jti' });

      mockPrisma.refreshToken.findUnique.mockResolvedValue(expiredToken);
      mockPrisma.refreshToken.delete.mockResolvedValue(expiredToken);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send(refreshData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication failed');
      expect(mockPrisma.refreshToken.delete).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const logoutData = {
        refreshToken: 'valid-refresh-token'
      };

      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send(logoutData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Successfully logged out');
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: logoutData.refreshToken }
      });
    });
  });
});

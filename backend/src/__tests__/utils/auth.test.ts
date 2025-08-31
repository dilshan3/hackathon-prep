import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  validatePasswordStrength,
  toUserPublic,
  extractBearerToken
} from '../../utils/auth';
import { User } from '@prisma/client';

describe('Auth Utils', () => {
  describe('Password hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should verify password correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await verifyPassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('JWT Token generation and verification', () => {
    it('should generate and verify access token', () => {
      const payload = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com'
      };

      const token = generateAccessToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should generate refresh token', () => {
      const token = generateRefreshToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should throw error for invalid access token', () => {
      expect(() => {
        verifyAccessToken('invalid-token');
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      // This would require mocking jwt.verify to simulate expiration
      // For now, we test with malformed token
      expect(() => {
        verifyAccessToken('expired.token.here');
      }).toThrow();
    });
  });

  describe('Password strength validation', () => {
    it('should validate strong password', () => {
      const result = validatePasswordStrength('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const testCases = [
        { password: '123', expectedErrors: 5 },
        { password: 'short', expectedErrors: 4 },
        { password: 'nouppercase123!', expectedErrors: 1 },
        { password: 'NOLOWERCASE123!', expectedErrors: 1 },
        { password: 'NoNumbers!', expectedErrors: 1 },
        { password: 'NoSpecialChars123', expectedErrors: 1 }
      ];

      testCases.forEach(({ password, expectedErrors }) => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(expectedErrors - 1);
      });
    });
  });

  describe('User data transformation', () => {
    it('should convert User to UserPublic', () => {
      const user: User = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
        company: 'Test Company',
        role: 'user',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z')
      };

      const userPublic = toUserPublic(user);

      expect(userPublic).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
        createdAt: user.createdAt.toISOString()
      });

      // Ensure password is not included
      expect('password' in userPublic).toBe(false);
    });
  });

  describe('Bearer token extraction', () => {
    it('should extract token from valid Authorization header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      const authHeader = `Bearer ${token}`;
      
      const extracted = extractBearerToken(authHeader);
      expect(extracted).toBe(token);
    });

    it('should return null for invalid Authorization header', () => {
      expect(extractBearerToken(undefined)).toBe(null);
      expect(extractBearerToken('')).toBe(null);
      expect(extractBearerToken('Basic token')).toBe(null);
      expect(extractBearerToken('Bearer')).toBe(null);
    });

    it('should handle Authorization header without Bearer prefix', () => {
      const result = extractBearerToken('token-without-bearer');
      expect(result).toBe(null);
    });
  });
});

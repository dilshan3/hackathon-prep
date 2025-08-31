import { Router } from 'express';
import { prisma } from '../config/database';
import { 
  hashPassword, 
  verifyPassword, 
  generateAccessToken, 
  generateRefreshToken,
  verifyRefreshToken,
  getTokenExpirationTime,
  toUserPublic,
  validatePasswordStrength
} from '../utils/auth';
import { 
  validateRegister, 
  validateLogin, 
  validateRefreshToken 
} from '../middleware/validation';
import { authRateLimit } from '../middleware/rateLimiter';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { 
  RegisterRequest, 
  LoginRequest, 
  RefreshTokenRequest,
  AuthResponse 
} from '../types';
import { env } from '../config/env';

const router = Router();

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', 
  authRateLimit,
  validateRegister,
  asyncHandler(async (req, res) => {
    const { email, password, name, company }: RegisterRequest = req.body;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new ApiError('Password does not meet requirements', 400, {
        errors: passwordValidation.errors
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw new ApiError('Resource conflict', 409, `User with email ${email} already exists`);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        company,
        role: 'user'
      }
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email
    });
    const refreshToken = generateRefreshToken();

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    });

    const response: AuthResponse = {
      user: toUserPublic(user),
      accessToken,
      refreshToken,
      expiresIn: getTokenExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
    };

    res.status(201).json(response);
  })
);

/**
 * POST /auth/login
 * Authenticate user and return tokens
 */
router.post('/login',
  authRateLimit,
  validateLogin,
  asyncHandler(async (req, res) => {
    const { email, password }: LoginRequest = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new ApiError('Authentication failed', 401, 'Invalid email or password');
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new ApiError('Authentication failed', 401, 'Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email
    });
    const refreshToken = generateRefreshToken();

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    });

    const response: AuthResponse = {
      user: toUserPublic(user),
      accessToken,
      refreshToken,
      expiresIn: getTokenExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
    };

    res.status(200).json(response);
  })
);

/**
 * POST /auth/refresh
 * Generate new access token using refresh token
 */
router.post('/refresh',
  authRateLimit,
  validateRefreshToken,
  asyncHandler(async (req, res) => {
    const { refreshToken }: RefreshTokenRequest = req.body;

    // Verify refresh token format
    try {
      verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new ApiError('Authentication failed', 401, 'Invalid or expired refresh token');
    }

    // Find refresh token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!storedToken) {
      throw new ApiError('Authentication failed', 401, 'Refresh token not found');
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id }
      });
      throw new ApiError('Authentication failed', 401, 'Refresh token has expired');
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email
    });

    res.status(200).json({
      accessToken,
      expiresIn: getTokenExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
    });
  })
);

/**
 * POST /auth/logout
 * Invalidate refresh token
 */
router.post('/logout',
  validateRefreshToken,
  asyncHandler(async (req, res) => {
    const { refreshToken }: RefreshTokenRequest = req.body;

    // Find and delete refresh token
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    });

    res.status(200).json({
      message: 'Successfully logged out'
    });
  })
);

export default router;

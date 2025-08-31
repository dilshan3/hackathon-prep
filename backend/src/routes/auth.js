const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { 
  hashPassword, 
  verifyPassword, 
  generateAccessToken, 
  generateRefreshToken,
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens
} = require('../lib/auth');
const { 
  validateBody, 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema 
} = require('../lib/validation');
const { 
  ConflictError, 
  UnauthorizedError, 
  NotFoundError,
  asyncHandler 
} = require('../lib/errors');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /auth/register
 * Register a new user (defaults to CUSTOMER role)
 */
router.post('/register', validateBody(registerSchema), asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.validatedData;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      role
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  });

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id });

  // Store refresh token
  await storeRefreshToken(user.id, refreshToken);

  res.status(201).json({
    message: 'User registered successfully',
    user,
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: 900 // 15 minutes in seconds
    }
  });
}));

/**
 * POST /auth/login
 * Authenticate user and return tokens
 */
router.post('/login', validateBody(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.validatedData;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id });

  // Store refresh token
  await storeRefreshToken(user.id, refreshToken);

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: 900 // 15 minutes in seconds
    }
  });
}));

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', validateBody(refreshTokenSchema), asyncHandler(async (req, res) => {
  const { refreshToken } = req.validatedData;

  // Validate refresh token
  const tokenData = await validateRefreshToken(refreshToken);
  if (!tokenData) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  // Generate new access token
  const accessToken = generateAccessToken({ 
    userId: tokenData.user.id, 
    role: tokenData.user.role 
  });

  res.json({
    message: 'Token refreshed successfully',
    tokens: {
      accessToken,
      expiresIn: 900 // 15 minutes in seconds
    }
  });
}));

/**
 * POST /auth/logout
 * Logout user and invalidate refresh token
 */
router.post('/logout', validateBody(refreshTokenSchema), asyncHandler(async (req, res) => {
  const { refreshToken } = req.validatedData;

  // Revoke the specific refresh token
  await revokeRefreshToken(refreshToken);

  res.json({
    message: 'Logout successful'
  });
}));

/**
 * POST /auth/logout-all
 * Logout user from all devices (revoke all refresh tokens)
 */
router.post('/logout-all', authenticate, asyncHandler(async (req, res) => {
  await revokeAllUserTokens(req.user.id);

  res.json({
    message: 'Logged out from all devices'
  });
}));

/**
 * GET /auth/me
 * Get current user profile
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    user
  });
}));

module.exports = router;

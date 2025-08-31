const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ACCESS_EXPIRY = '15m';
const JWT_REFRESH_EXPIRY = '7d';

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT access token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_ACCESS_EXPIRY,
    issuer: 'delivery-tracker-api'
  });
}

/**
 * Generate JWT refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_REFRESH_EXPIRY,
    issuer: 'delivery-tracker-api'
  });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, { issuer: 'delivery-tracker-api' });
  } catch (error) {
    return null;
  }
}

/**
 * Store refresh token in database
 */
async function storeRefreshToken(userId, token) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  return prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });
}

/**
 * Validate refresh token from database
 */
async function validateRefreshToken(token) {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!refreshToken || refreshToken.revoked || refreshToken.expiresAt < new Date()) {
    return null;
  }

  return refreshToken;
}

/**
 * Revoke refresh token
 */
async function revokeRefreshToken(token) {
  return prisma.refreshToken.updateMany({
    where: { token },
    data: { revoked: true }
  });
}

/**
 * Revoke all refresh tokens for a user
 */
async function revokeAllUserTokens(userId) {
  return prisma.refreshToken.updateMany({
    where: { userId },
    data: { revoked: true }
  });
}

/**
 * Clean up expired tokens
 */
async function cleanupExpiredTokens() {
  return prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revoked: true }
      ]
    }
  });
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanupExpiredTokens
};

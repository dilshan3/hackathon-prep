const { verifyToken } = require('../lib/auth');
const { UnauthorizedError, ForbiddenError } = require('../lib/errors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Middleware to authenticate JWT tokens
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);
    
    if (!decoded) {
      throw new UnauthorizedError('Invalid token');
    }

    // Fetch user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to require specific roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
}

/**
 * Middleware to require CUSTOMER role
 */
function requireCustomer(req, res, next) {
  return requireRole('CUSTOMER')(req, res, next);
}

/**
 * Middleware to require SUPPORT role
 */
function requireSupport(req, res, next) {
  return requireRole('SUPPORT')(req, res, next);
}

/**
 * Middleware to allow both CUSTOMER and SUPPORT roles
 */
function requireAnyRole(req, res, next) {
  return requireRole('CUSTOMER', 'SUPPORT')(req, res, next);
}

/**
 * Optional authentication - sets req.user if token is valid, but doesn't fail if no token
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (decoded) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });
      
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}

module.exports = {
  authenticate,
  requireRole,
  requireCustomer,
  requireSupport,
  requireAnyRole,
  optionalAuth
};

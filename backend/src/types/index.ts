import { Request } from 'express';
import { User } from '@prisma/client';

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    cursor?: string;
    nextCursor?: string | null;
    hasMore: boolean;
    limit: number;
  };
}

// Auth types
export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  company: string;
  role: string;
  createdAt: string;
}

// Request validation types
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  company: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface CreateIssueRequest {
  trackingNumber: string;
  type: string;
  title: string;
  description: string;
  customerEmail: string;
  customerPhone?: string;
}

export interface TriageIssueRequest {
  severity: string;
  status?: string;
  assignedTo?: string;
}

export interface IssueFilters {
  status?: string;
  severity?: string;
  type?: string;
  q?: string;
  cursor?: string;
  limit?: number;
}

// Environment variables
export interface EnvConfig {
  NODE_ENV: string;
  PORT: string;
  DATABASE_URL: string;
  DIRECT_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  BCRYPT_ROUNDS: string;
}

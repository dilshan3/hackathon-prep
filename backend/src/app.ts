import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRateLimit, devRateLimit } from './middleware/rateLimiter';
import { isDevelopment } from './config/env';

// Import routes
import authRoutes from './routes/auth';
import issueRoutes from './routes/issues';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://logistics-dashboard.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(isDevelopment ? devRateLimit : apiRateLimit);

// Request logging in development
if (isDevelopment) {
  app.use((req: any, res: any, next: any) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req: any, res: any) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/issues', issueRoutes);

// API documentation redirect
app.get('/docs', (req: any, res: any) => {
  res.redirect('https://github.com/your-org/logistics-api/blob/main/docs/api-documentation.md');
});

// Root endpoint
app.get('/', (req: any, res: any) => {
  res.json({
    name: 'Logistics Delivery Issue Tracking API',
    version: '1.0.0',
    description: 'Enterprise API for managing delivery issues and tracking',
    documentation: '/docs',
    health: '/health',
    endpoints: {
      auth: '/api/v1/auth',
      issues: '/api/v1/issues'
    }
  });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;

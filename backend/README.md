# Logistics Delivery Issue Tracking API

Enterprise-grade REST API for managing delivery issues and tracking in logistics operations. Built with Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or later
- PostgreSQL database (we recommend [Neon](https://neon.tech))
- npm or yarn

### Installation

1. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your configuration values.

4. **Set up database:**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database (for development)
   npm run db:push
   
   # OR run migrations (for production)
   npm run db:migrate
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`.

## 📖 API Documentation

Complete API documentation is available in [`/docs/api-documentation.md`](../docs/api-documentation.md).

### Quick Reference

- **Base URL**: `http://localhost:3000/api/v1`
- **Health Check**: `GET /health`
- **API Docs**: `GET /docs`

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

### Issue Management Endpoints
- `POST /api/v1/issues` - Create new issue
- `GET /api/v1/issues` - List issues (with filtering)
- `GET /api/v1/issues/:id` - Get specific issue
- `PATCH /api/v1/issues/:id/triage` - Triage issue

## 🏗️ Architecture

### Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Neon)
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Joi
- **Testing**: Jest + Supertest
- **Deployment**: Vercel

### Project Structure
```
backend/
├── src/
│   ├── __tests__/          # Test files
│   ├── config/             # Configuration files
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── app.ts              # Express app setup
│   └── index.ts            # Server entry point
├── prisma/
│   └── schema.prisma       # Database schema
├── dist/                   # Compiled JavaScript
├── coverage/               # Test coverage reports
└── package.json
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start           # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push     # Push schema to database (dev)
npm run db:migrate  # Run database migrations
npm run db:studio   # Open Prisma Studio

# Testing
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
npm run type-check  # Run TypeScript type checking
```

### Database Schema

The application uses the following main entities:

- **User**: System users with authentication
- **Issue**: Delivery issues with tracking and triage
- **RefreshToken**: JWT refresh tokens for authentication

Key enums:
- **IssueType**: Types of delivery issues
- **Severity**: Issue severity levels (LOW, MEDIUM, HIGH, CRITICAL)
- **Status**: Issue status (OPEN, TRIAGED, IN_PROGRESS, ESCALATED, RESOLVED, CLOSED)

## 🧪 Testing

The project includes comprehensive test coverage:

- **Unit Tests**: Individual function and utility testing
- **Integration Tests**: API endpoint testing
- **Middleware Tests**: Authentication and validation testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🔒 Security

### Security Features
- JWT-based authentication with refresh tokens
- Password hashing using bcrypt
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Security headers (Helmet.js)
- SQL injection prevention (Prisma ORM)

### Environment Security
- Sensitive data in environment variables
- Separate staging and production configurations
- Database connection encryption (SSL)

## 🚀 Deployment

### Vercel Deployment

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

### Environment Variables (Production)

Set these in your Vercel dashboard or deployment platform:

```bash
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
NODE_ENV=production
```

### GitHub Actions CI/CD

The project includes automated CI/CD pipeline:

- **Testing**: Runs on Node.js 18.x and 20.x
- **Security Scanning**: Dependency auditing
- **Staging Deployment**: Auto-deploy from `develop` branch
- **Production Deployment**: Auto-deploy from `main` branch

## 📊 Monitoring & Logging

### Health Checks
- `GET /health` - Application health status
- Database connection monitoring
- Graceful shutdown handling

### Logging
- Request/response logging in development
- Error logging with stack traces
- Performance monitoring ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- TypeScript strict mode
- ESLint configuration
- 100% test coverage goal
- Conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [API Documentation](../docs/api-documentation.md)
- 🐛 [Report Issues](https://github.com/your-org/logistics-api/issues)
- 💬 [Discussions](https://github.com/your-org/logistics-api/discussions)

---

**Enterprise Support**: For enterprise support and custom implementations, contact our team.

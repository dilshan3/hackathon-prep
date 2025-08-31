# Last-Mile Delivery Issue Tracker API

A production-ready Node.js + Express API for tracking delivery issues, built with PostgreSQL (Neon), Prisma ORM, JWT authentication, and deployed on Vercel as serverless functions.

## 🚀 Features

- **Authentication**: JWT-based auth with access tokens (15min) and refresh tokens (7 days)
- **Role-based Access**: Customer and Support user roles with appropriate permissions
- **Issue Management**: Create, list, and view delivery issues with filtering and pagination
- **Security**: Bcrypt password hashing, rate limiting, CORS, and Helmet security headers
- **Validation**: Comprehensive input validation using Zod
- **Error Handling**: Consistent JSON error responses
- **Serverless**: Optimized for Vercel deployment with serverless-http

## 📋 API Endpoints

### Authentication
- `POST /auth/register` - Register new user (defaults to CUSTOMER role)
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout (invalidate refresh token)
- `POST /auth/logout-all` - Logout from all devices
- `GET /auth/me` - Get current user profile

### Issues
- `POST /issues` - Create new issue (CUSTOMER only)
- `GET /issues` - List all issues with filters (SUPPORT only)
- `GET /issues/:id` - Get specific issue (SUPPORT or owner CUSTOMER)
- `GET /issues/my/list` - Get current customer's issues (CUSTOMER only)
- `PATCH /issues/:id/status` - Update issue status (SUPPORT only)

### Health
- `GET /health` - API health check

## 🏗️ Architecture

```
backend/
├── api/
│   └── index.js              # Vercel serverless entry point
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
├── src/
│   ├── lib/
│   │   ├── auth.js          # JWT & password utilities
│   │   ├── validation.js    # Zod schemas & validation middleware
│   │   └── errors.js        # Error classes & handlers
│   ├── middleware/
│   │   └── auth.js          # Authentication & authorization middleware
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   └── issues.js        # Issue management routes
│   └── server.js            # Express app configuration
├── package.json
├── vercel.json              # Vercel deployment configuration
└── env.example              # Environment variables template
```

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (local or Neon)
- Vercel CLI (optional, for local serverless testing)

### 1. Clone and Install
```bash
git clone <your-repo>
cd backend
npm install
```

### 2. Environment Configuration
```bash
cp env.example .env
```

Edit `.env` with your values:
```env
DATABASE_URL="postgresql://username:password@hostname:5432/database_name?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
NODE_ENV="development"
```

### 3. Database Setup

#### Using Neon (Recommended for Production)
1. Create account at [neon.tech](https://neon.tech)
2. Create new project and database
3. Copy connection string to `DATABASE_URL`

#### Using Local PostgreSQL
```bash
# Install PostgreSQL locally
# Create database
createdb delivery_tracker

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://username:password@localhost:5432/delivery_tracker"
```

### 4. Database Migration
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Optional: Open Prisma Studio
npm run db:studio
```

### 5. Start Development Server

#### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI globally
npm install -g vercel

# Start development server
npm run dev
```
Server runs at: `http://localhost:3000`

#### Option B: Using Node.js directly
```bash
# Create local development script
echo 'const app = require("./src/server"); app.listen(3000, () => console.log("Server running on port 3000"));' > dev-server.js

# Start server
node dev-server.js
```

## 🚀 Deployment

### Option 1: Automated Deployment with GitHub Actions (Recommended)

For automated CI/CD deployment, see [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) for complete setup instructions.

**Quick Setup:**
```bash
# Run the setup script
./scripts/setup-github-actions.sh

# Follow the prompts to configure GitHub Actions
```

### Option 2: Manual Deployment

#### 1. Prepare Repository
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

#### 2. Deploy via Vercel Dashboard
1. Visit [vercel.com](https://vercel.com) and sign in
2. Click "New Project" and import your GitHub repository
3. Configure environment variables:
   - `DATABASE_URL`: Your Neon connection string
   - `JWT_SECRET`: Strong secret key (32+ characters)
   - `NODE_ENV`: `production`

#### 3. Deploy via Vercel CLI
```bash
# Install and login
npm install -g vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add NODE_ENV

# Redeploy with env vars
vercel --prod
```

#### 4. Run Database Migration on Production
```bash
# Set production DATABASE_URL locally
export DATABASE_URL="your-neon-connection-string"

# Deploy migrations
npm run db:deploy
```

Your API will be available at: `https://your-project.vercel.app`

## 🧪 Testing with cURL

### 1. Health Check
```bash
curl -X GET https://your-project.vercel.app/health
```

### 2. Register Customer
```bash
curl -X POST https://your-project.vercel.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "SecurePass123!",
    "name": "John Customer"
  }'
```

### 3. Register Support Agent
```bash
curl -X POST https://your-project.vercel.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "support@example.com",
    "password": "SecurePass123!",
    "name": "Jane Support",
    "role": "SUPPORT"
  }'
```

### 4. Login
```bash
curl -X POST https://your-project.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "SecurePass123!"
  }'
```
**Save the `accessToken` from response for subsequent requests.**

### 5. Create Issue (as Customer)
```bash
curl -X POST https://your-project.vercel.app/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "orderId": "ORD-12345",
    "type": "LATE",
    "severity": "HIGH",
    "description": "Package was supposed to arrive yesterday but still not delivered. Customer is waiting urgently."
  }'
```

### 6. Get User Profile
```bash
curl -X GET https://your-project.vercel.app/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 7. List Customer's Issues
```bash
curl -X GET https://your-project.vercel.app/issues/my/list \
  -H "Authorization: Bearer YOUR_CUSTOMER_ACCESS_TOKEN"
```

### 8. List All Issues (as Support)
```bash
curl -X GET "https://your-project.vercel.app/issues?limit=10&status=OPEN" \
  -H "Authorization: Bearer YOUR_SUPPORT_ACCESS_TOKEN"
```

### 9. Get Specific Issue
```bash
curl -X GET https://your-project.vercel.app/issues/ISSUE_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 10. Update Issue Status (as Support)
```bash
curl -X PATCH https://your-project.vercel.app/issues/ISSUE_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPPORT_ACCESS_TOKEN" \
  -d '{
    "status": "IN_PROGRESS"
  }'
```

### 11. Refresh Token
```bash
curl -X POST https://your-project.vercel.app/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 12. Logout
```bash
curl -X POST https://your-project.vercel.app/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## 📊 Data Models

### User
```typescript
{
  id: string
  email: string
  name: string
  role: "CUSTOMER" | "SUPPORT"
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Issue
```typescript
{
  id: string
  orderId: string
  type: "LATE" | "LOST" | "DAMAGED"
  severity: "LOW" | "MEDIUM" | "HIGH"
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED"
  description: string
  customerId: string
  createdAt: DateTime
  updatedAt: DateTime
  customer: User
}
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Short-lived access tokens (15min) + long-lived refresh tokens (7 days)
- **Rate Limiting**: 100 requests/15min (general), 20 requests/15min (auth)
- **CORS**: Configured for production domains
- **Helmet**: Security headers
- **Input Validation**: Comprehensive Zod schemas
- **SQL Injection Protection**: Prisma ORM with parameterized queries

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `your-super-secret-jwt-key-at-least-32-characters-long` |
| `NODE_ENV` | Environment mode | `development` or `production` |

## 🚨 Error Responses

All errors return JSON in this format:
```json
{
  "error": "ErrorType",
  "message": "Human readable message",
  "details": "Additional details (optional)"
}
```

**Error Types:**
- `ValidationError` (400) - Invalid input data
- `Unauthorized` (401) - Authentication required/failed
- `Forbidden` (403) - Insufficient permissions
- `NotFound` (404) - Resource not found
- `Conflict` (409) - Resource already exists
- `TooManyRequests` (429) - Rate limit exceeded
- `InternalError` (500) - Server error

## 📈 Performance & Scaling

- **Serverless Architecture**: Auto-scaling based on demand
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Prisma handles database connections efficiently
- **Rate Limiting**: Prevents abuse and ensures fair usage
- **Cursor Pagination**: Efficient pagination for large datasets

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
npm run deploy

# Testing
npm test              # Run tests (placeholder)
npm run test:api      # Run API tests

# Database commands
npm run db:migrate     # Run migrations
npm run db:deploy      # Deploy migrations to production
npm run db:generate    # Generate Prisma client
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database with test data
```

## 🔄 GitHub Actions Workflows

The project includes automated CI/CD workflows:

- **`.github/workflows/deploy.yml`**: Main deployment workflow
  - Tests code on every push/PR
  - Deploys to Vercel on main/master branch
- **`.github/workflows/migrate.yml`**: Database migration workflow
  - Manual trigger for running migrations
- **`.github/workflows/test-api.yml`**: API testing workflow
  - Tests endpoints after deployment

See [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) for setup instructions.

## 📝 License

MIT License - see LICENSE file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

For issues and feature requests, please use GitHub Issues.

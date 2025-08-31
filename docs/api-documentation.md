# Logistics Delivery Issue Tracking API Documentation

## Table of Contents
- [API Overview](#api-overview)
- [Authentication & Security](#authentication--security)
- [Data Models](#data-models)
- [Endpoint Reference](#endpoint-reference)
- [Error Handling](#error-handling)
- [API Conventions](#api-conventions)

---

## API Overview

### Purpose
The Logistics Delivery Issue Tracking API is designed for large e-commerce and courier companies to efficiently manage and track delivery-related issues. This enterprise-grade API enables automated issue intake, intelligent triage, and comprehensive tracking throughout the resolution lifecycle.

### Key Capabilities
- **Automated Issue Intake**: Streamlined submission of delivery issues from multiple channels
- **Intelligent Triage**: Priority-based categorization and severity assessment
- **Real-time Tracking**: Live status updates and comprehensive audit trails
- **Advanced Filtering**: Powerful search and filtering capabilities for issue management
- **Scalable Architecture**: Built to handle thousands of concurrent requests

### Key Benefits
- **Reduced Resolution Time**: Automated triage and routing accelerate issue resolution
- **Enhanced Customer Experience**: Real-time visibility into issue status
- **Operational Efficiency**: Centralized issue management reduces manual overhead
- **Data-Driven Insights**: Comprehensive analytics for process optimization

### Base URL & Versioning
- **Development**: `https://logistics-api-dev.vercel.app/api/v1`
- **Production**: `https://logistics-api.vercel.app/api/v1`

### Versioning Strategy
- URL path versioning (e.g., `/api/v1/`)
- Major version increments for breaking changes
- Minor updates maintain backward compatibility
- Deprecation notices provided 90 days in advance

### Rate Limits
- **Authenticated Requests**: 1000 requests/hour per user
- **Authentication Endpoints**: 10 requests/minute per IP
- **Bulk Operations**: 100 requests/hour per user
- Rate limit headers included in all responses:
  - `X-RateLimit-Limit`: Request limit per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Authentication & Security

### JWT Authentication
The API uses JSON Web Tokens (JWT) with a dual-token approach:
- **Access Token**: 15-minute expiration, used for API requests
- **Refresh Token**: 7-day expiration, used to obtain new access tokens

### Token Lifecycle

#### 1. Registration & Login
Obtain initial token pair through registration or login:

```bash
# Registration
curl -X POST https://logistics-api.vercel.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@company.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "company": "ACME Logistics"
  }'

# Login
curl -X POST https://logistics-api.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@company.com",
    "password": "SecurePass123!"
  }'
```

```javascript
// JavaScript/TypeScript fetch example
const registerUser = async () => {
  const response = await fetch('https://logistics-api.vercel.app/api/v1/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'john.doe@company.com',
      password: 'SecurePass123!',
      name: 'John Doe',
      company: 'ACME Logistics'
    })
  });
  
  const data = await response.json();
  
  // Store tokens securely
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return data;
};
```

#### 2. Making Authenticated Requests
Include the access token in the Authorization header:

```bash
curl -X GET https://logistics-api.vercel.app/api/v1/issues \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

```javascript
const fetchIssues = async () => {
  const accessToken = localStorage.getItem('accessToken');
  
  const response = await fetch('https://logistics-api.vercel.app/api/v1/issues', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (response.status === 401) {
    // Token expired, refresh it
    await refreshAccessToken();
    return fetchIssues(); // Retry request
  }
  
  return response.json();
};
```

#### 3. Token Refresh
When access tokens expire (15 minutes), use the refresh token:

```bash
curl -X POST https://logistics-api.vercel.app/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

```javascript
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('https://logistics-api.vercel.app/api/v1/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  });
  
  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    return data.accessToken;
  } else {
    // Refresh token expired, redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }
};
```

### Security Best Practices

#### Password Requirements
- Minimum 8 characters
- Must include uppercase, lowercase, number, and special character
- Passwords are hashed using bcrypt with salt rounds of 12

#### Token Security
- Store tokens in secure, httpOnly cookies when possible
- Never expose tokens in URLs or logs
- Implement automatic token refresh before expiration
- Clear tokens on logout and session timeout

#### API Security Headers
All responses include security headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## Data Models

### Core Entities

#### Issue Schema
```json
{
  "id": "string (UUID v4)",
  "trackingNumber": "string",
  "type": "IssueType",
  "severity": "Severity",
  "status": "Status",
  "title": "string",
  "description": "string",
  "customerEmail": "string (email)",
  "customerPhone": "string?",
  "assignedTo": "string (UUID v4)?",
  "createdBy": "string (UUID v4)",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)",
  "resolvedAt": "string (ISO 8601)?"
}
```

#### UserPublic Schema
```json
{
  "id": "string (UUID v4)",
  "email": "string (email)",
  "name": "string",
  "company": "string",
  "role": "string",
  "createdAt": "string (ISO 8601)"
}
```

### Enumerations

#### IssueType
```typescript
enum IssueType {
  DELIVERY_DELAY = "DELIVERY_DELAY",
  PACKAGE_DAMAGED = "PACKAGE_DAMAGED",
  PACKAGE_LOST = "PACKAGE_LOST",
  WRONG_ADDRESS = "WRONG_ADDRESS",
  DELIVERY_ATTEMPTED = "DELIVERY_ATTEMPTED",
  CUSTOMER_UNAVAILABLE = "CUSTOMER_UNAVAILABLE",
  WEATHER_DELAY = "WEATHER_DELAY",
  VEHICLE_BREAKDOWN = "VEHICLE_BREAKDOWN",
  OTHER = "OTHER"
}
```

#### Severity
```typescript
enum Severity {
  LOW = "LOW",        // Minor issues, SLA: 48 hours
  MEDIUM = "MEDIUM",  // Standard issues, SLA: 24 hours
  HIGH = "HIGH",      // Urgent issues, SLA: 4 hours
  CRITICAL = "CRITICAL" // Emergency issues, SLA: 1 hour
}
```

#### Status
```typescript
enum Status {
  OPEN = "OPEN",           // Issue submitted, awaiting triage
  TRIAGED = "TRIAGED",     // Issue assessed and prioritized
  IN_PROGRESS = "IN_PROGRESS", // Issue being actively worked on
  ESCALATED = "ESCALATED", // Issue escalated to higher tier
  RESOLVED = "RESOLVED",   // Issue successfully resolved
  CLOSED = "CLOSED"        // Issue closed (resolved or cancelled)
}
```

### Example Issue Object
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "trackingNumber": "TRK123456789",
  "type": "PACKAGE_DAMAGED",
  "severity": "HIGH",
  "status": "TRIAGED",
  "title": "Package arrived damaged - electronics",
  "description": "Customer reports that the laptop package was visibly damaged upon delivery. Box was crushed and contents may be affected.",
  "customerEmail": "customer@example.com",
  "customerPhone": "+1-555-0123",
  "assignedTo": "750e8400-e29b-41d4-a716-446655440001",
  "createdBy": "650e8400-e29b-41d4-a716-446655440002",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:15:00.000Z",
  "resolvedAt": null
}
```

---

## Endpoint Reference

### Authentication Endpoints

#### Register User
**POST** `/auth/register`

Creates a new user account and returns authentication tokens.

**Request Body:**
```json
{
  "email": "string (email, required)",
  "password": "string (min 8 chars, required)",
  "name": "string (required)",
  "company": "string (required)"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@company.com",
    "name": "John Doe",
    "company": "ACME Logistics",
    "role": "user",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Example:**
```bash
curl -X POST https://logistics-api.vercel.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@company.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "company": "ACME Logistics"
  }'
```

#### Login User
**POST** `/auth/login`

Authenticates existing user and returns tokens.

**Request Body:**
```json
{
  "email": "string (email, required)",
  "password": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@company.com",
    "name": "John Doe",
    "company": "ACME Logistics",
    "role": "user",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

#### Refresh Token
**POST** `/auth/refresh`

Generates new access token using valid refresh token.

**Request Body:**
```json
{
  "refreshToken": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

### Issue Management Endpoints

#### Create Issue
**POST** `/issues`

Creates a new delivery issue.

**Headers:**
- `Authorization: Bearer <access_token>` (required)
- `Content-Type: application/json` (required)

**Request Body:**
```json
{
  "trackingNumber": "string (required)",
  "type": "IssueType (required)",
  "title": "string (required, max 200 chars)",
  "description": "string (required, max 2000 chars)",
  "customerEmail": "string (email, required)",
  "customerPhone": "string (optional)"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "trackingNumber": "TRK123456789",
  "type": "PACKAGE_DAMAGED",
  "severity": "MEDIUM",
  "status": "OPEN",
  "title": "Package arrived damaged",
  "description": "Customer reports visible damage to package upon delivery.",
  "customerEmail": "customer@example.com",
  "customerPhone": "+1-555-0123",
  "assignedTo": null,
  "createdBy": "650e8400-e29b-41d4-a716-446655440002",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "resolvedAt": null
}
```

**Example:**
```bash
curl -X POST https://logistics-api.vercel.app/api/v1/issues \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "trackingNumber": "TRK123456789",
    "type": "PACKAGE_DAMAGED",
    "title": "Package arrived damaged",
    "description": "Customer reports visible damage to package upon delivery.",
    "customerEmail": "customer@example.com",
    "customerPhone": "+1-555-0123"
  }'
```

```javascript
const createIssue = async (issueData) => {
  const response = await fetch('https://logistics-api.vercel.app/api/v1/issues', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(issueData)
  });
  
  return response.json();
};
```

#### List Issues
**GET** `/issues`

Retrieves paginated list of issues with optional filtering.

**Headers:**
- `Authorization: Bearer <access_token>` (required)

**Query Parameters:**
- `status`: Filter by status (`OPEN`, `TRIAGED`, `IN_PROGRESS`, `ESCALATED`, `RESOLVED`, `CLOSED`)
- `severity`: Filter by severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- `type`: Filter by issue type (see IssueType enum)
- `q`: Text search across title, description, and tracking number
- `cursor`: Pagination cursor (use `nextCursor` from previous response)
- `limit`: Number of results per page (default: 20, max: 100)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "trackingNumber": "TRK123456789",
      "type": "PACKAGE_DAMAGED",
      "severity": "HIGH",
      "status": "TRIAGED",
      "title": "Package arrived damaged",
      "description": "Customer reports visible damage...",
      "customerEmail": "customer@example.com",
      "customerPhone": "+1-555-0123",
      "assignedTo": "750e8400-e29b-41d4-a716-446655440001",
      "createdBy": "650e8400-e29b-41d4-a716-446655440002",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:15:00.000Z",
      "resolvedAt": null
    }
  ],
  "pagination": {
    "cursor": "eyJjcmVhdGVkQXQiOiIyMDI0LTAxLTE1VDEwOjMwOjAwLjAwMFoiLCJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCJ9",
    "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI0LTAxLTE1VDA5OjMwOjAwLjAwMFoiLCJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMSJ9",
    "hasMore": true,
    "limit": 20
  }
}
```

**Examples:**
```bash
# Get all issues
curl -X GET https://logistics-api.vercel.app/api/v1/issues \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Filter by status and severity
curl -X GET "https://logistics-api.vercel.app/api/v1/issues?status=OPEN&severity=HIGH&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Search with text query
curl -X GET "https://logistics-api.vercel.app/api/v1/issues?q=damaged+package" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Get Issue by ID
**GET** `/issues/{id}`

Retrieves a specific issue by its ID.

**Headers:**
- `Authorization: Bearer <access_token>` (required)

**Path Parameters:**
- `id`: Issue UUID (required)

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "trackingNumber": "TRK123456789",
  "type": "PACKAGE_DAMAGED",
  "severity": "HIGH",
  "status": "TRIAGED",
  "title": "Package arrived damaged",
  "description": "Customer reports visible damage to package upon delivery.",
  "customerEmail": "customer@example.com",
  "customerPhone": "+1-555-0123",
  "assignedTo": "750e8400-e29b-41d4-a716-446655440001",
  "createdBy": "650e8400-e29b-41d4-a716-446655440002",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:15:00.000Z",
  "resolvedAt": null
}
```

**Example:**
```bash
curl -X GET https://logistics-api.vercel.app/api/v1/issues/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Triage Issue
**PATCH** `/issues/{id}/triage`

Updates issue severity and optionally status during triage process.

**Headers:**
- `Authorization: Bearer <access_token>` (required)
- `Content-Type: application/json` (required)

**Path Parameters:**
- `id`: Issue UUID (required)

**Request Body:**
```json
{
  "severity": "Severity (required)",
  "status": "Status (optional)",
  "assignedTo": "string UUID (optional)"
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "trackingNumber": "TRK123456789",
  "type": "PACKAGE_DAMAGED",
  "severity": "CRITICAL",
  "status": "TRIAGED",
  "title": "Package arrived damaged",
  "description": "Customer reports visible damage to package upon delivery.",
  "customerEmail": "customer@example.com",
  "customerPhone": "+1-555-0123",
  "assignedTo": "750e8400-e29b-41d4-a716-446655440001",
  "createdBy": "650e8400-e29b-41d4-a716-446655440002",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:45:00.000Z",
  "resolvedAt": null
}
```

**Example:**
```bash
curl -X PATCH https://logistics-api.vercel.app/api/v1/issues/550e8400-e29b-41d4-a716-446655440000/triage \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "severity": "CRITICAL",
    "status": "TRIAGED",
    "assignedTo": "750e8400-e29b-41d4-a716-446655440001"
  }'
```

```javascript
const triageIssue = async (issueId, triageData) => {
  const response = await fetch(`https://logistics-api.vercel.app/api/v1/issues/${issueId}/triage`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(triageData)
  });
  
  return response.json();
};
```

---

## Error Handling

### Standard Error Response Format
All API errors follow a consistent JSON structure:

```json
{
  "error": "string (human-readable error message)",
  "details": "any (optional additional context)"
}
```

### Common HTTP Status Codes

#### 400 Bad Request
Request validation failed or malformed data.

```json
{
  "error": "Validation failed",
  "details": {
    "field": "email",
    "message": "Invalid email format",
    "value": "invalid-email"
  }
}
```

#### 401 Unauthorized
Authentication required or token invalid/expired.

```json
{
  "error": "Authentication required",
  "details": "Access token has expired"
}
```

#### 403 Forbidden
Authenticated but insufficient permissions.

```json
{
  "error": "Insufficient permissions",
  "details": "User does not have access to modify this resource"
}
```

#### 404 Not Found
Requested resource does not exist.

```json
{
  "error": "Resource not found",
  "details": "Issue with ID 550e8400-e29b-41d4-a716-446655440000 does not exist"
}
```

#### 409 Conflict
Resource conflict (e.g., duplicate email during registration).

```json
{
  "error": "Resource conflict",
  "details": "User with email john.doe@company.com already exists"
}
```

#### 422 Unprocessable Entity
Request syntax is valid but semantically incorrect.

```json
{
  "error": "Invalid issue type",
  "details": "INVALID_TYPE is not a valid IssueType. Valid values: DELIVERY_DELAY, PACKAGE_DAMAGED, PACKAGE_LOST, WRONG_ADDRESS, DELIVERY_ATTEMPTED, CUSTOMER_UNAVAILABLE, WEATHER_DELAY, VEHICLE_BREAKDOWN, OTHER"
}
```

#### 429 Too Many Requests
Rate limit exceeded.

```json
{
  "error": "Rate limit exceeded",
  "details": "Maximum of 1000 requests per hour allowed. Try again in 45 minutes."
}
```

#### 500 Internal Server Error
Unexpected server error.

```json
{
  "error": "Internal server error",
  "details": "An unexpected error occurred. Please try again later."
}
```

### Error Handling Best Practices

#### Client-Side Error Handling
```javascript
const handleApiError = (response, data) => {
  switch (response.status) {
    case 400:
      console.error('Validation Error:', data.details);
      // Show user-friendly validation messages
      break;
    case 401:
      console.error('Authentication Error:', data.error);
      // Redirect to login or refresh token
      refreshAccessToken();
      break;
    case 403:
      console.error('Permission Error:', data.error);
      // Show access denied message
      break;
    case 404:
      console.error('Not Found:', data.error);
      // Show resource not found message
      break;
    case 429:
      console.error('Rate Limited:', data.error);
      // Implement exponential backoff
      break;
    case 500:
      console.error('Server Error:', data.error);
      // Show generic error message and retry option
      break;
    default:
      console.error('Unknown Error:', data.error);
  }
};

// Usage example
const apiCall = async () => {
  try {
    const response = await fetch('/api/v1/issues');
    const data = await response.json();
    
    if (!response.ok) {
      handleApiError(response, data);
      return;
    }
    
    // Handle success
    return data;
  } catch (error) {
    console.error('Network Error:', error);
    // Handle network errors
  }
};
```

---

## API Conventions

### Pagination
The API uses cursor-based pagination for efficient handling of large datasets.

#### Cursor Pagination Format
```json
{
  "data": [...],
  "pagination": {
    "cursor": "string (current page cursor)",
    "nextCursor": "string (next page cursor, null if no more pages)",
    "hasMore": "boolean (true if more pages available)",
    "limit": "number (items per page)"
  }
}
```

#### Pagination Parameters
- `cursor`: Opaque cursor string for pagination position
- `limit`: Items per page (default: 20, max: 100)

#### Example Usage
```bash
# First page
curl -X GET "https://logistics-api.vercel.app/api/v1/issues?limit=20"

# Next page using cursor from previous response
curl -X GET "https://logistics-api.vercel.app/api/v1/issues?cursor=eyJjcmVhdGVkQXQiOi...&limit=20"
```

### Filtering

#### Query Parameters
- `status`: Exact match on issue status
- `severity`: Exact match on issue severity  
- `type`: Exact match on issue type
- `q`: Full-text search across title, description, and tracking number

#### Filter Combinations
Multiple filters can be combined using AND logic:
```bash
curl -X GET "https://logistics-api.vercel.app/api/v1/issues?status=OPEN&severity=HIGH&type=PACKAGE_DAMAGED"
```

### ID Format
- All entity IDs use UUID v4 format
- Example: `550e8400-e29b-41d4-a716-446655440000`
- IDs are case-sensitive and must be provided exactly as returned

### Timestamps
- All timestamps use ISO 8601 format with UTC timezone
- Format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Example: `2024-01-15T10:30:00.000Z`

### Field Naming
- Use camelCase for JSON field names
- Boolean fields use positive naming (e.g., `isActive` not `isNotActive`)
- Timestamps end with `At` suffix (e.g., `createdAt`, `updatedAt`)

### HTTP Methods
- `GET`: Retrieve resources (idempotent)
- `POST`: Create new resources
- `PATCH`: Partial updates to existing resources
- `PUT`: Complete replacement of resources (not used in MVP-1)
- `DELETE`: Remove resources (not used in MVP-1)

### Content Types
- Request bodies: `application/json`
- Response bodies: `application/json`
- Character encoding: UTF-8

### Environment URLs

#### Development Environment
- **Base URL**: `https://logistics-api-dev.vercel.app/api/v1`
- **Purpose**: Development and testing
- **Rate Limits**: Relaxed (2000 requests/hour)
- **Data**: Test data only, reset nightly

#### Production Environment
- **Base URL**: `https://logistics-api.vercel.app/api/v1`
- **Purpose**: Live production traffic
- **Rate Limits**: Standard (1000 requests/hour)
- **Data**: Live customer data

### Response Headers
All API responses include standard headers:
```
Content-Type: application/json; charset=utf-8
X-Request-ID: unique-request-identifier
X-Response-Time: response-time-in-ms
X-RateLimit-Limit: rate-limit-per-window
X-RateLimit-Remaining: remaining-requests
X-RateLimit-Reset: reset-timestamp
```

### API Versioning
- Current version: `v1`
- Version specified in URL path: `/api/v1/`
- Breaking changes increment major version
- Backward-compatible changes maintain version
- Deprecated endpoints supported for 90 days minimum

---

## Getting Started

### Quick Start Guide

1. **Register for API Access**
   ```bash
   curl -X POST https://logistics-api.vercel.app/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@company.com","password":"SecurePass123!","name":"Your Name","company":"Your Company"}'
   ```

2. **Create Your First Issue**
   ```bash
   curl -X POST https://logistics-api.vercel.app/api/v1/issues \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"trackingNumber":"TRK123","type":"DELIVERY_DELAY","title":"Package delayed","description":"Customer reports package not delivered on time","customerEmail":"customer@example.com"}'
   ```

3. **Retrieve and Filter Issues**
   ```bash
   curl -X GET "https://logistics-api.vercel.app/api/v1/issues?status=OPEN&limit=10" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

### SDK and Integration Examples
For complete SDK examples and integration guides, visit our [Developer Portal](https://developers.logistics-api.com).

---

*Last updated: January 2024*
*API Version: v1.0.0*

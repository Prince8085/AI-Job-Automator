## Production Architecture Documentation

### Overview

This document outlines the enterprise-grade backend architecture implemented for the AI Job Automator project. The architecture follows best practices for Node.js/Express server design, including layered architecture, comprehensive error handling, logging, metrics collection, and caching.

---

## Architecture Components

### 1. **Configuration Management**
**File:** `server/config.ts`

Centralized configuration system with environment variable validation.

**Key Features:**
- Automatic environment variable loading from `.env`
- Validation method to check required variables
- Environment-specific settings (production vs development)
- Centralized access to all configuration across the app

**Usage:**
```typescript
import { config } from './config';

// Access configuration
console.log(config.NODE_ENV);
console.log(config.NVIDIA_API_KEY);
console.log(config.DATABASE_URL);

// Validate all required variables are set
if (!config.isValidated()) {
  throw new Error('Missing required environment variables');
}
```

---

### 2. **Structured Logging**
**File:** `server/utils/logger.ts`

Production-grade structured logging with context support and multiple log levels.

**Log Levels:**
- `DEBUG` - Detailed debugging information
- `INFO` - General information messages
- `WARN` - Warning messages for potentially problematic situations
- `ERROR` - Error messages for failures
- `FATAL` - Critical errors requiring immediate attention

**Features:**
- Automatic context tracking (userId, requestId, action)
- Structured JSON output for log aggregation
- Timestamps for all log entries
- Stack traces for errors

**Usage:**
```typescript
import { logger } from './utils/logger';

// Set context for subsequent logs
logger.setContext({ userId: 'user123', requestId: 'req-456' });

// Log at different levels
logger.debug('Debug info', { key: 'value' });
logger.info('Information', { key: 'value' });
logger.warn('Warning', { key: 'value' });
logger.error('Error occurred', { key: 'value' });
logger.fatal('Critical issue', { key: 'value' });
```

---

### 3. **Error Handling**
**File:** `server/utils/errors.ts`

Comprehensive error class hierarchy with consistent error responses.

**Error Classes:**
- `AppError` - Base error class with statusCode, message, code, and details
- `ValidationError` - 400 Bad Request
- `AuthenticationError` - 401 Unauthorized
- `AuthorizationError` - 403 Forbidden
- `NotFoundError` - 404 Not Found
- `ConflictError` - 409 Conflict
- `RateLimitError` - 429 Too Many Requests
- `AIServiceError` - 503 Service Unavailable (AI API)
- `DatabaseError` - 500 Internal Server Error (Database)

**Response Formatting:**
```typescript
import { ResponseFormatter, ValidationError } from './utils/errors';

// Success response
res.json(ResponseFormatter.success(data, 'Success message', requestId));

// Error response
res.json(ResponseFormatter.error(error, requestId));

// Paginated response
res.json(ResponseFormatter.paginated(items, total, page, pageSize, requestId));

// Throw custom errors
throw new ValidationError('Invalid input', { field: 'email' });
throw new NotFoundError('User');
```

---

### 4. **Request/Response Interceptors**
**File:** `server/middleware/interceptor.ts`

Global middleware for request tracking, response monitoring, and performance metrics.

**Features:**
- Unique request ID generation and tracking
- Request logging with method, path, query
- Response logging with status code and duration
- Performance monitoring for slow requests
- Error logging and context propagation

**Applied Globally:**
```typescript
app.use(requestInterceptor);      // Logs incoming requests
app.use(responseInterceptor);     // Logs outgoing responses  
app.use(performanceMonitor);      // Tracks performance metrics
```

---

### 5. **API Client Wrapper**
**File:** `server/utils/apiClient.ts`

Wrapper around NVIDIA API with retry logic, rate limiting, and error handling.

**Features:**
- Automatic retry with exponential backoff
- Rate limiting (100 requests per minute)
- Request timeout handling
- Streaming support for large responses
- Structured JSON parsing
- Request tracking and metrics

**Available Methods:**
- `generateText()` - Single response generation
- `generateTextStream()` - Streaming text generation
- `generateStructured<T>()` - Generate and parse JSON responses
- `getRateLimitStatus()` - Check current rate limit

**Usage:**
```typescript
import { nvidiaClient } from './utils/apiClient';

// Generate text
const response = await nvidiaClient.generateText('Write a cover letter', {
  maxTokens: 2000,
  temperature: 0.7,
});

// Stream generation
await nvidiaClient.generateTextStream(
  'Write interview questions',
  (chunk) => console.log(chunk),
  { maxTokens: 3000 }
);

// Structured output
const data = await nvidiaClient.generateStructured<MyType>(
  'Generate JSON with specific structure'
);
```

---

### 6. **Database Service Layer**
**File:** `server/services/databaseService.ts`

Abstract database operations with connection pooling, error handling, and transaction support.

**Available Operations:**
- `executeQuery()` - Execute raw SQL queries
- `insert()` - Insert single record
- `insertMany()` - Insert multiple records
- `update()` - Update record
- `delete()` - Delete record
- `findById()` - Find by ID
- `findMany()` - Find with filters
- `count()` - Count records
- `transaction()` - Execute transaction
- `getHealth()` - Check database connectivity

**Features:**
- Query statistics and monitoring
- Error handling and logging
- Connection pooling
- Performance tracking
- Transaction support

**Usage:**
```typescript
import { dbService } from './services/databaseService';

// Insert
const user = await dbService.insert('users', {
  email: 'user@example.com',
  name: 'John Doe'
});

// Find
const users = await dbService.findMany('users', { status: 'active' });

// Update
const updated = await dbService.update('users', userId, { status: 'inactive' });

// Transaction
await dbService.transaction(async () => {
  await dbService.insert('users', userData);
  await dbService.insert('logs', logData);
});

// Stats
console.log(dbService.getStats());
```

---

### 7. **Validation Middleware**
**File:** `server/middleware/validation.ts`

Centralized input validation using express-validator with preset chains.

**Pre-built Validators:**
- `validators.registerUser` - Email, password, name validation
- `validators.loginUser` - Email and password validation
- `validators.createJob` - Job creation validation
- `validators.pagination` - Pagination parameters
- `validators.uploadResume` - Resume file validation
- And many more...

**Custom Validation Builder:**
```typescript
import { ValidationBuilder, validateRequest } from './middleware/validation';

// Use preset validators
app.post('/register', validators.registerUser, validateRequest, handler);

// Build custom validators
const customValidators = new ValidationBuilder()
  .string('title', { min: 5, max: 200 })
  .email()
  .number('price', { min: 0 })
  .optional()
  .build();

app.post('/create', customValidators, validateRequest, handler);
```

---

### 8. **Authentication Middleware**
**File:** `server/middleware/auth.ts`

Clerk authentication integration with role-based access control.

**Available Middleware:**
- `requireAuth` - Requires authentication
- `optionalAuth` - Optional authentication
- `enhancedAuth` - Enhanced auth with role extraction
- `requireRole()` - Role-based access control
- `requirePermission()` - Permission-based access control
- `ownerOnly()` - User can only access their resources
- `rateLimitByUser()` - Rate limiting per authenticated user

**Usage:**
```typescript
app.get('/protected', requireAuth, (req, res) => {
  // User is authenticated, req.userId available
});

app.delete('/users/:userId', requireRole('admin'), (req, res) => {
  // Only admins can delete users
});

app.put('/profile/:userId', ownerOnly('userId'), (req, res) => {
  // Users can only update their own profile
});

app.post('/api/ai', rateLimitByUser(20, 60000), (req, res) => {
  // Limit to 20 requests per minute per user
});
```

---

### 9. **Caching Service**
**File:** `server/utils/cache.ts`

In-memory caching with TTL support, pattern matching, and statistics.

**Features:**
- Time-to-live (TTL) support
- Pattern-based matching and deletion
- Cache-aside pattern support
- Resource invalidation
- Hit/miss tracking
- Automatic cleanup of expired entries

**Usage:**
```typescript
import { cacheManager } from './utils/cache';

// Set cache value
cacheManager.set('user:123', userData, 60000); // 60 second TTL

// Get cache value
const cached = cacheManager.get('user:123');

// Cache-aside pattern
const data = await cacheManager.getOrSet(
  'jobs:search',
  async () => await fetchJobs(),
  30 * 60 * 1000 // 30 minutes
);

// Delete by pattern
cacheManager.deleteByPattern('user:.*');

// Get stats
const stats = cacheManager.getStats();
// { hits: 45, misses: 12, sets: 30, deletes: 5, hitRate: '79.00%' }
```

---

### 10. **Metrics Collection**
**File:** `server/utils/metrics.ts`

Production-grade metrics collection for API, database, and AI service monitoring.

**Metrics Tracked:**
- HTTP requests (count, errors, duration, status codes)
- Database queries (count, errors, slow queries)
- AI API calls (count, errors, tokens used)
- Response times and error rates
- Component health status
- Overall system uptime

**Usage:**
```typescript
import { metricsCollector } from './utils/metrics';

// Record HTTP request
metricsCollector.recordHttpRequest(endpoint, method, statusCode, duration);

// Record database query
metricsCollector.recordDatabaseQuery(duration, hasError);

// Record AI request
metricsCollector.recordAiRequest(duration, tokensUsed, hasError);

// Get metrics
const apiMetrics = metricsCollector.getApiMetrics();
const dbMetrics = metricsCollector.getDatabaseMetrics();
const aiMetrics = metricsCollector.getAiMetrics();
const health = metricsCollector.getHealth();

// Full summary
const summary = metricsCollector.getSummary();
// { api: {...}, database: {...}, ai: {...}, health: {...} }
```

---

## Server Integration

### Middleware Stack (in order):

1. **Security** - Helmet for security headers
2. **CORS** - Cross-origin resource sharing
3. **Body Parser** - JSON and URL-encoded parsing
4. **Request Interceptor** - Request tracking
5. **Response Interceptor** - Response logging
6. **Performance Monitor** - Performance tracking
7. **Rate Limiting** - API rate limiting
8. **Database Health Check** - Verify DB connectivity
9. **Routes** - API endpoints
10. **Error Handler** - Global error handling

### Health Check Endpoint

```
GET /api/health

Returns:
{
  success: true,
  database: boolean,
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy',
    uptime: number,
    lastChecked: number,
    components: {...}
  },
  cache: {...},
  metrics: {...}
}
```

### Metrics Endpoint

```
GET /api/metrics

Returns comprehensive system metrics including API, database, and AI service metrics.
```

---

## Environment Variables

Required `.env` variables:

```env
# Server
NODE_ENV=production
PORT=3001

# NVIDIA AI API
NVIDIA_API_KEY=your_api_key
NVIDIA_API_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=nvidia/llama2-70b

# Database
DATABASE_URL=your_database_url
DATABASE_POOL_SIZE=10

# Authentication
CLERK_SECRET_KEY=your_clerk_secret

# Payment
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

---

## Error Handling

All errors are caught globally and returned in consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "statusCode": 400,
    "details": {...}
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "unique-request-id",
    "version": "1.0"
  }
}
```

---

## Graceful Shutdown

Server implements graceful shutdown with:
- SIGTERM signal handling
- SIGINT signal handling
- Connection cleanup
- 30-second timeout before forced shutdown
- Metrics reset on shutdown

---

## Performance Optimization

### Caching Strategy
- Job search results cached for 30 minutes
- User data cached indefinitely (invalidated on update)
- Pattern-based cache invalidation

### Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- AI endpoints: 20 requests per minute

### Database
- Connection pooling with configurable pool size
- Query performance tracking
- Slow query detection (> 500ms)

---

## Monitoring

### Metrics Available
```typescript
// API Metrics
- totalRequests: number
- totalErrors: number
- averageResponseTime: number
- errorRate: percentage
- uptimePercentage: percentage

// Database Metrics
- totalQueries: number
- totalErrors: number
- averageQueryTime: number
- slowQueries: number

// AI Metrics
- totalRequests: number
- totalErrors: number
- averageDuration: number
- tokensUsed: number

// Health Status
- status: 'healthy' | 'degraded' | 'unhealthy'
- uptime: number (ms)
- components: {...}
```

---

## Logging

All operations are logged with structured data:

```
INFO: Request completed
{
  statusCode: 200,
  duration: "45ms",
  path: "/api/jobs/search",
  method: "GET"
}

ERROR: Database query failed
{
  error: "Connection timeout",
  duration: "30000ms",
  query: "SELECT * FROM users WHERE id = $1"
}
```

---

## Best Practices Implemented

✅ **Separation of Concerns** - Each layer has specific responsibility
✅ **Error Handling** - Comprehensive error handling with custom classes
✅ **Logging** - Structured logging throughout the application
✅ **Rate Limiting** - Multiple rate limiting strategies
✅ **Caching** - Intelligent caching with TTL and pattern matching
✅ **Metrics** - Complete metrics collection for monitoring
✅ **Security** - Helmet, CORS, input validation
✅ **Performance** - Request/response interceptors, slow query detection
✅ **Graceful Shutdown** - Proper cleanup on server shutdown
✅ **Configuration** - Centralized environment configuration with validation

---

## How to Test

```bash
# Health check
curl http://localhost:3001/api/health

# Get metrics
curl http://localhost:3001/api/metrics

# Cache stats
curl http://localhost:3001/api/cache/stats

# Search jobs
curl "http://localhost:3001/api/jobs/internshala?keyword=developer&location=Delhi"

# Search LinkedIn
curl "http://localhost:3001/api/jobs/linkedin?keyword=developer&location=bangalore"
```

---

This production architecture provides enterprise-grade backend capabilities suitable for deployment to production environments.

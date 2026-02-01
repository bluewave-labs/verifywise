# API Endpoint Checklist

Checklist for creating and reviewing API endpoints in VerifyWise.

## Route Definition

### URL Structure

- [ ] Follows RESTful conventions
- [ ] Uses plural nouns for resources (`/users`, not `/user`)
- [ ] Uses kebab-case for multi-word paths (`/user-profiles`)
- [ ] Nested resources are logical (`/users/:userId/projects`)
- [ ] Version prefix included (`/api/v1/`)

### HTTP Methods

- [ ] GET for reading (idempotent)
- [ ] POST for creating
- [ ] PUT for full update (idempotent)
- [ ] PATCH for partial update
- [ ] DELETE for removing

## Input Validation

### Request Body

- [ ] Schema validation with Zod/Pydantic
- [ ] All required fields validated
- [ ] Type validation (string, number, etc.)
- [ ] Format validation (email, UUID, etc.)
- [ ] Length/range limits defined
- [ ] Sanitization applied

### Query Parameters

- [ ] Pagination validated (page, limit)
- [ ] Sort parameters validated (allowed fields)
- [ ] Filter parameters validated
- [ ] Maximum limits enforced

### Path Parameters

- [ ] UUID format validated
- [ ] Parameter exists (not undefined)

## Authentication & Authorization

### Authentication

- [ ] Endpoint protected (if not public)
- [ ] Token validation middleware applied
- [ ] Invalid token returns 401

### Authorization

- [ ] User can access this resource
- [ ] Role/permission checks performed
- [ ] Resource ownership verified
- [ ] Insufficient permissions returns 403

## Controller Logic

### Structure

- [ ] Controller is thin (delegates to service)
- [ ] Uses async/await with try/catch
- [ ] Errors passed to error middleware

### Response

- [ ] Consistent response format
- [ ] Appropriate status codes
- [ ] No sensitive data exposed (passwords, tokens)
- [ ] Pagination metadata included (for lists)

## Error Handling

### Client Errors (4xx)

- [ ] 400 for validation errors
- [ ] 401 for authentication failures
- [ ] 403 for authorization failures
- [ ] 404 for not found
- [ ] 409 for conflicts
- [ ] 422 for business rule violations

### Server Errors (5xx)

- [ ] 500 for unexpected errors
- [ ] Generic message to client
- [ ] Full error logged server-side
- [ ] No stack traces in production

## Security

### Input

- [ ] SQL injection prevented
- [ ] XSS prevention (if returning HTML)
- [ ] Path traversal prevented (file operations)
- [ ] Request size limits set

### Output

- [ ] Sensitive fields excluded
- [ ] Internal IDs not exposed (if applicable)
- [ ] Error messages don't leak info

### Rate Limiting

- [ ] Rate limits appropriate for endpoint
- [ ] Stricter limits for auth endpoints
- [ ] 429 response for exceeded limits

## Performance

### Database

- [ ] Necessary fields selected (not SELECT *)
- [ ] Indexes exist for query patterns
- [ ] N+1 queries avoided (eager loading)
- [ ] Pagination implemented for lists

### Caching

- [ ] Cache headers set appropriately
- [ ] Cache invalidation considered

## Testing

### Unit Tests

- [ ] Service logic tested
- [ ] Validation tested
- [ ] Error cases tested

### Integration Tests

- [ ] Successful request tested
- [ ] Validation errors tested
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Not found tested

## Documentation

### OpenAPI/Swagger

- [ ] Endpoint documented
- [ ] Parameters documented
- [ ] Request body schema defined
- [ ] Response schemas defined
- [ ] Error responses documented
- [ ] Examples provided

## Checklist by HTTP Method

### GET (Read)

```
GET /api/v1/users/:id

✅ Validation
  ✅ Path param validated (UUID)
  ✅ Query params validated

✅ Authorization
  ✅ User can read this resource

✅ Response
  ✅ 200 with data
  ✅ 404 if not found
  ✅ No sensitive fields

✅ Performance
  ✅ Only needed fields returned
  ✅ Pagination for lists

✅ Tests
  ✅ Success case
  ✅ Not found case
  ✅ Unauthorized case
```

### POST (Create)

```
POST /api/v1/users

✅ Validation
  ✅ Body schema validated
  ✅ Required fields checked
  ✅ Formats validated

✅ Authorization
  ✅ User can create this resource

✅ Business Logic
  ✅ Duplicate check (if unique constraint)
  ✅ Related resources validated

✅ Response
  ✅ 201 with created resource
  ✅ 400 for validation errors
  ✅ 409 for conflicts

✅ Tests
  ✅ Success case
  ✅ Validation errors
  ✅ Duplicate handling
```

### PUT/PATCH (Update)

```
PUT /api/v1/users/:id

✅ Validation
  ✅ Path param validated
  ✅ Body schema validated

✅ Authorization
  ✅ User owns resource or is admin
  ✅ Fields user can update checked

✅ Business Logic
  ✅ Resource exists check
  ✅ Conflict check (if applicable)

✅ Response
  ✅ 200 with updated resource
  ✅ 404 if not found
  ✅ 403 if not authorized

✅ Tests
  ✅ Success case
  ✅ Not found case
  ✅ Partial update (PATCH)
```

### DELETE (Remove)

```
DELETE /api/v1/users/:id

✅ Validation
  ✅ Path param validated

✅ Authorization
  ✅ User can delete this resource

✅ Business Logic
  ✅ Soft delete vs hard delete
  ✅ Cascade considerations

✅ Response
  ✅ 204 on success
  ✅ 404 if not found

✅ Tests
  ✅ Success case
  ✅ Not found case
  ✅ Cascade verified
```

## Response Codes Reference

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable | Business rule violation |
| 429 | Too Many Requests | Rate limited |
| 500 | Internal Error | Server error |

## Related Documents

- [Controller Guidelines](../04-backend/controller-guidelines.md)
- [Express Patterns](../04-backend/express-patterns.md)
- [Security Checklist](./security-review-checklist.md)

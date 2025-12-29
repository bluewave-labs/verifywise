# AI Detection - Authorization Model

This document describes the role-based access control (RBAC) model for the AI Detection feature.

## Roles

The AI Detection feature uses the standard VerifyWise role hierarchy:

| Role     | Description                                      |
|----------|--------------------------------------------------|
| Admin    | Full system access, can manage all resources     |
| Editor   | Can create and modify content, limited admin     |
| Reviewer | Read access with annotation capabilities         |
| Auditor  | Read-only access for compliance and auditing     |

## Authorization Matrix

| Operation                  | Admin | Editor | Reviewer | Auditor |
|---------------------------|-------|--------|----------|---------|
| Start scan                | Yes   | Yes    | No       | No      |
| View scan history         | Yes   | Yes    | Yes      | Yes     |
| View scan details         | Yes   | Yes    | Yes      | Yes     |
| View scan status (poll)   | Yes   | Yes    | Yes      | Yes     |
| View scan findings        | Yes   | Yes    | Yes      | Yes     |
| Cancel scan (any)         | Yes   | No     | No       | No      |
| Cancel scan (own)         | Yes   | Yes    | No       | No      |
| Delete scan               | Yes   | No     | No       | No      |

## Authorization Implementation

### Route-Level Authorization

All routes require JWT authentication via `authenticateJWT` middleware. Role-based authorization is enforced using the `authorize` middleware.

```
POST   /ai-detection/scans              -> Admin, Editor
GET    /ai-detection/scans              -> Admin, Editor, Reviewer, Auditor
GET    /ai-detection/scans/:scanId      -> Admin, Editor, Reviewer, Auditor
GET    /ai-detection/scans/:scanId/status -> Admin, Editor, Reviewer, Auditor
GET    /ai-detection/scans/:scanId/findings -> Admin, Editor, Reviewer, Auditor
POST   /ai-detection/scans/:scanId/cancel -> Admin, Editor (ownership check)
DELETE /ai-detection/scans/:scanId      -> Admin only
```

### Service-Level Authorization

The `cancelScan` function includes an additional ownership check:
- **Admin**: Can cancel any scan
- **Editor**: Can only cancel scans they initiated

This is enforced by comparing `scan.triggered_by` with `ctx.userId`.

## Error Responses

| HTTP Status | Exception            | Description                           |
|-------------|---------------------|---------------------------------------|
| 401         | UnauthorizedException | Missing or invalid JWT token         |
| 403         | ForbiddenException   | User lacks required role/permission   |
| 404         | NotFoundException    | Resource not found                    |

## Security Considerations

1. **Multi-tenancy**: All queries are scoped to the user's tenant via `ctx.tenantId`
2. **Token validation**: JWT tokens are validated for expiry and signature
3. **Ownership verification**: Service-layer checks ensure users can only modify their own resources (where applicable)
4. **SQL injection prevention**: All database queries use parameterized statements

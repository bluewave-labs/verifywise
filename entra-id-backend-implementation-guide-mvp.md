### Entra ID SSO Backend Implementation Guide (MVP)

Product Requirements & Technical Specifications for Development Team

#### Overview

This document provides **MVP backend implementation** requirements for integrating Microsoft Entra ID (Azure AD) SSO with VerifyWise using an **optional, per-organization approach**.

**Authentication Strategy:**
- **By default, all organizations continue using username/password authentication**
- Organizations can **optionally** enable Azure AD SSO through Settings > Entra ID (Admin only)
- When SSO is enabled, username/password login is completely disabled for that organization
- Organizations that never enable SSO continue working exactly as before
- SSO integrates with existing VerifyWise authentication system (JWT tokens, role management)
- **Zero impact on existing organizations** until they explicitly choose to enable SSO

Frontend Integration Points:
- Settings > Entra ID > Single configuration page (simplified from tab design)
- Essential fields: Tenant ID, Client ID, Client Secret, Cloud Environment, Enable/Disable toggle
- Backend needs to provide API endpoints for CRUD operations and authentication flow

### Database Schema Design (Simplified)

#### SSO Configuration Table

Table: `sso_configurations`
- `organization_id` (INTEGER, Primary Key, Foreign Key to organizations) - VerifyWise organization identifier
- `azure_tenant_id` (VARCHAR, NOT NULL) - Azure AD Tenant ID (UUID format)
- `azure_client_id` (VARCHAR, NOT NULL) - Azure AD Application Client ID (UUID format)
- `azure_client_secret` (TEXT, ENCRYPTED, NOT NULL) - Azure AD Client Secret (encrypted at rest)
- `cloud_environment` (ENUM: 'AzurePublic', 'AzureGovernment', DEFAULT 'AzurePublic')
- `is_enabled` (BOOLEAN, DEFAULT false) - Whether SSO is active for this organization
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Note**: Organizations without a record in this table use standard username/password authentication.

**Removed from MVP**: All advanced configuration options (custom claims, scopes, role mapping, security controls, audit logging) to focus on core SSO functionality.

#### Users Table Extensions

Add these columns to existing `users` table:
- `sso_enabled` (BOOLEAN, DEFAULT false) - Whether user uses SSO authentication
- `azure_ad_object_id` (VARCHAR, NULLABLE) - Azure AD user object ID for linking accounts
- `sso_last_login` (TIMESTAMP, NULLABLE) - Last SSO login timestamp

**Backward Compatibility**: These columns default to `false`/`NULL` and don't affect existing functionality.

### Authentication Flow Implementation

#### Backward Compatibility Guarantee

**Existing Organizations**: Continue working exactly as before with zero changes required
- No SSO configuration = username/password authentication
- Existing login flow remains unchanged
- Existing JWT tokens continue working
- No migration required

#### SSO Enable/Disable Logic (Simplified)

**Enabling SSO (Admin Only):**
```javascript
async function enableSSO(req, res) {
  const { organizationId, role } = req;

  // Only admins can enable SSO
  if (role !== 'Admin') {
    return res.status(403).json({ error: "Admin access required" });
  }

  // Validate SSO configuration exists and is complete
  const ssoConfig = await SSOConfiguration.findOne({
    where: { organization_id: organizationId }
  });

  if (!ssoConfig || !ssoConfig.azure_tenant_id || !ssoConfig.azure_client_id || !ssoConfig.azure_client_secret) {
    return res.status(400).json({
      error: "INCOMPLETE_CONFIG",
      message: "SSO configuration must be completed before enabling"
    });
  }

  await sequelize.transaction(async (t) => {
    // Enable SSO configuration
    await SSOConfiguration.update(
      { is_enabled: true },
      { where: { organization_id: organizationId }, transaction: t }
    );

    // Mark all existing users as SSO-enabled
    await UserModel.update(
      { sso_enabled: true },
      { where: { organization_id: organizationId }, transaction: t }
    );
  });

  return res.json({
    success: true,
    message: "SSO enabled. Username/password login is now disabled for this organization."
  });
}
```

**Disabling SSO (Admin Only):**
```javascript
async function disableSSO(req, res) {
  const { organizationId, role } = req;

  // Only admins can disable SSO
  if (role !== 'Admin') {
    return res.status(403).json({ error: "Admin access required" });
  }

  await sequelize.transaction(async (t) => {
    // Disable SSO configuration
    await SSOConfiguration.update(
      { is_enabled: false },
      { where: { organization_id: organizationId }, transaction: t }
    );

    // Mark all users as non-SSO (revert to password auth)
    await UserModel.update(
      {
        sso_enabled: false,
        azure_ad_object_id: null
      },
      { where: { organization_id: organizationId }, transaction: t }
    );
  });

  return res.json({
    success: true,
    message: "SSO disabled. Organization reverted to username/password authentication."
  });
}
```

#### Enhanced Login Flow

**Organization SSO Status Check (for Frontend):**
```javascript
async function getOrganizationAuthMethod(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Find user to get organization
    const userData = await getUserByEmailQuery(email);
    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if organization has SSO enabled
    const ssoConfig = await SSOConfiguration.findOne({
      where: { organization_id: userData.organization_id }
    });

    const authMethod = ssoConfig?.is_enabled ? 'sso' : 'password';

    return res.json({
      auth_method: authMethod,
      organization_id: userData.organization_id,
      sso_login_url: authMethod === 'sso' ? `/api/auth/sso/login/${userData.organization_id}` : null
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

**Modified Regular Login Logic:**
```javascript
async function loginUser(req, res) {
  const { email, password } = req.body;

  try {
    // Find user to get organization
    const userData = await getUserByEmailQuery(email);
    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if organization has SSO enabled
    const ssoConfig = await SSOConfiguration.findOne({
      where: { organization_id: userData.organization_id }
    });

    if (ssoConfig?.is_enabled) {
      return res.status(400).json({
        error: "SSO_REQUIRED",
        message: "This organization uses Azure AD authentication",
        sso_login_url: `/api/auth/sso/login/${userData.organization_id}`
      });
    }

    // Continue with regular username/password login for non-SSO organizations
    // ... existing login logic (unchanged)

    let user = userData instanceof UserModel ? userData : Object.assign(new UserModel(), userData);

    const passwordIsMatched = await user.comparePassword(password);
    if (!passwordIsMatched) {
      return res.status(403).json({ error: 'Password mismatch' });
    }

    user.updateLastLogin();

    const { accessToken } = generateUserTokens({
      id: user.id!,
      email: email,
      roleName: userData.role_name,
      organizationId: userData.organization_id,
    }, res);

    return res.status(202).json({
      success: true,
      token: accessToken,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

### API Endpoints Specification (MVP)

#### Configuration Management APIs

**GET /api/organizations/{organizationId}/sso/configuration**

Purpose: Retrieve current SSO configuration

Response:
```json
{
  "exists": true,
  "azure_tenant_id": "uuid",
  "azure_client_id": "uuid",
  "cloud_environment": "AzurePublic",
  "is_enabled": false
}
```

If no SSO configuration exists:
```json
{
  "exists": false,
  "is_enabled": false
}
```

**POST /api/organizations/{organizationId}/sso/configuration**

Purpose: Create or update SSO configuration (Admin only)

Request Body:
```json
{
  "azure_tenant_id": "uuid",
  "azure_client_id": "uuid",
  "azure_client_secret": "secret",
  "cloud_environment": "AzurePublic"
}
```

Validation:
- azure_tenant_id and azure_client_id must be valid UUIDs
- azure_client_secret minimum 10 characters
- cloud_environment must be 'AzurePublic' or 'AzureGovernment'
- Encrypt client_secret before storing

**POST /api/organizations/{organizationId}/sso/enable**

Purpose: Enable SSO for organization (Admin only)

**POST /api/organizations/{organizationId}/sso/disable**

Purpose: Disable SSO for organization (Admin only)

**POST /api/auth/check-auth-method**

Purpose: Determine authentication method for email (used by login page)

Request Body:
```json
{
  "email": "user@company.com"
}
```

#### Authentication Flow APIs

**GET /api/auth/sso/login/{organizationId}**

Purpose: Initiate SSO login flow

Process:
1. Verify SSO is enabled for organization
2. Retrieve organization SSO configuration
3. Generate state parameter for CSRF protection (include organizationId)
4. Build Azure AD authorization URL
5. Store state in Redis/session cache

Response: Redirect to Azure AD authorization endpoint

**POST /api/auth/sso/callback**

Purpose: Handle Azure AD callback

Process:
1. Validate state parameter and extract organizationId
2. Exchange authorization code for tokens
3. Validate JWT tokens and extract claims
4. Find existing user by email (no auto-creation in MVP)
5. Link user account with azure_ad_object_id
6. Generate VerifyWise JWT token with SSO metadata
7. Update sso_last_login timestamp

Enhanced JWT Token Payload:
```json
{
  "id": 123,
  "email": "user@company.com",
  "roleName": "Admin",
  "organizationId": 456,
  "tenantId": "tenant-hash",
  "sso_enabled": true,
  "azure_ad_object_id": "azure-user-id",
  "expire": 1234567890
}
```

**GET /api/auth/sso/logout**

Purpose: Handle SSO logout

Process:
1. Validate current session
2. Clear VerifyWise session
3. Redirect to Azure AD logout endpoint

### Azure AD Integration Implementation

#### OAuth 2.0 / OpenID Connect Flow

Authorization Endpoint:
`https://login.microsoftonline.com/{azure-tenant-id}/oauth2/v2.0/authorize`

Cloud Environment URLs:
- **Azure Public**: `https://login.microsoftonline.com/`
- **Azure Government**: `https://login.microsoftonline.us/`

Required Parameters:
- `client_id`: Azure AD Application Client ID
- `response_type`: "code"
- `redirect_uri`: "{VERIFYWISE_BASE_URL}/api/auth/sso/callback"
- `scope`: "openid profile email User.Read"
- `state`: CSRF protection token including organizationId
- `response_mode`: "query"

Token Endpoint:
`https://login.microsoftonline.com/{azure-tenant-id}/oauth2/v2.0/token`

#### JWT Token Validation

Token Validation Steps:
1. Verify JWT signature using Azure AD public keys (JWKS endpoint)
2. Validate token expiration (exp claim)
3. Validate audience (aud claim) matches client_id
4. Validate issuer (iss claim) matches expected Azure AD endpoint
5. Extract user claims (email, name)

Required Libraries:
- `jsonwebtoken` or `jose` for JWT validation
- HTTP client for Azure AD API calls
- `node-cache` or Redis for caching JWKS keys

#### User Information Retrieval

Microsoft Graph API Endpoint:
- User Profile: `GET https://graph.microsoft.com/v1.0/me`

Headers:
- `Authorization: Bearer {access_token}`
- `Content-Type: application/json`

### User Management Integration (Simplified)

#### Link Existing Users Only (No Auto-Creation)

```javascript
async function handleSSOUser(email, azureAdObjectId, userInfo, organizationId) {
  const existingUser = await getUserByEmailQuery(email);

  if (!existingUser) {
    throw new Error('User does not exist. Please contact your administrator to create your account.');
  }

  // Verify user belongs to the same organization
  if (existingUser.organization_id !== organizationId) {
    throw new Error('User belongs to different organization');
  }

  // Link existing user to Azure AD
  await UserModel.update({
    sso_enabled: true,
    azure_ad_object_id: azureAdObjectId,
    sso_last_login: new Date()
  }, {
    where: { id: existingUser.id }
  });

  return existingUser;
}
```

### Enhanced Authentication Middleware

Update existing `authenticateJWT` middleware:

```javascript
const authenticateJWT = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(400).json({ message: "Token not found" });
  }

  try {
    const decoded = getTokenPayload(token);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (decoded.expire < Date.now()) {
      return res.status(406).json({ message: "Token expired" });
    }

    // Existing validation logic...
    const belongs = await doesUserBelongsToOrganizationQuery(decoded.id, decoded.organizationId);
    if (!belongs.belongs) {
      return res.status(403).json({ message: 'User does not belong to this organization' });
    }

    const user = await getUserByIdQuery(decoded.id);
    if (decoded.roleName !== roleMap.get(user.role_id)) {
      return res.status(403).json({ message: 'Not allowed to access' });
    }

    // SSO-specific validation (only for SSO users)
    if (decoded.sso_enabled) {
      if (!user.azure_ad_object_id) {
        return res.status(401).json({ message: "SSO account not properly linked" });
      }

      // Check if SSO is still enabled for organization
      const ssoConfig = await SSOConfiguration.findOne({
        where: { organization_id: decoded.organizationId }
      });

      if (!ssoConfig?.is_enabled) {
        return res.status(401).json({ message: "SSO has been disabled for this organization" });
      }
    }

    // Set request context
    req.userId = decoded.id;
    req.role = decoded.roleName;
    req.organizationId = decoded.organizationId;
    req.tenantId = decoded.tenantId;
    req.ssoEnabled = decoded.sso_enabled || false;

    asyncLocalStorage.run({ userId: decoded.id }, () => {
      next();
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
```

### Database Migration Scripts (Simplified)

```sql
-- Migration 1: Create SSO configuration table (simplified)
CREATE TABLE sso_configurations (
  organization_id INTEGER PRIMARY KEY,
  azure_tenant_id VARCHAR(255) NOT NULL,
  azure_client_id VARCHAR(255) NOT NULL,
  azure_client_secret TEXT NOT NULL,
  cloud_environment ENUM('AzurePublic', 'AzureGovernment') DEFAULT 'AzurePublic',
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Migration 2: Add SSO columns to users table
ALTER TABLE users
ADD COLUMN sso_enabled BOOLEAN DEFAULT false,
ADD COLUMN azure_ad_object_id VARCHAR(255) NULL,
ADD COLUMN sso_last_login TIMESTAMP NULL;

-- Indexes for performance
CREATE INDEX idx_users_sso ON users(sso_enabled, azure_ad_object_id);
CREATE INDEX idx_users_org_email ON users(organization_id, email);
```

### Error Handling and Edge Cases

#### SSO-Specific Errors

**Organization SSO Status Conflicts:**
- User tries password login when SSO enabled → Return `SSO_REQUIRED` error with redirect URL
- User tries SSO login when SSO disabled → Return `SSO_DISABLED` error
- Admin tries to enable SSO without completing configuration → Return `INCOMPLETE_CONFIG` error

**User Account Linking Issues:**
- Azure AD email doesn't match existing user → Return error asking admin to create account
- User exists but belongs to different organization → Return permission error

**Azure AD Integration Errors:**
```javascript
const SSO_ERROR_CODES = {
  INVALID_CREDENTIALS: 'Azure AD credentials are invalid',
  NETWORK_ERROR: 'Unable to connect to Azure AD',
  INVALID_TOKEN: 'Received invalid token from Azure AD',
  MISSING_CLAIMS: 'Required user claims missing from Azure AD response',
  USER_NOT_FOUND: 'User account does not exist in VerifyWise'
};
```

### Frontend Integration Notes

The simplified frontend UI expects these API endpoints:
- `GET/POST /api/organizations/{organizationId}/sso/configuration`
- `POST /api/organizations/{organizationId}/sso/enable`
- `POST /api/organizations/{organizationId}/sso/disable`
- `POST /api/auth/check-auth-method` (new)

**Login Page Flow:**
1. User enters email address
2. Frontend calls `/api/auth/check-auth-method` with email
3. If response is `password`: Show password field
4. If response is `sso`: Redirect to SSO login URL

**Settings Page Integration:**
- Single-page SSO configuration (no tabs)
- Only 5 essential fields: Tenant ID, Client ID, Client Secret, Cloud Environment, Enable/Disable toggle
- Clear warnings about switching authentication methods
- User count and current authentication method indicators

### Backward Compatibility Guarantees

1. **Existing Organizations**: Continue working exactly as before
2. **Existing Users**: No changes to login flow unless SSO is enabled
3. **API Compatibility**: All existing endpoints remain unchanged
4. **JWT Tokens**: Existing tokens continue working, new fields optional
5. **Database Changes**: All new columns have safe defaults

### Implementation Timeline (MVP)

**Phase 1 (Week 1): Core Infrastructure**
- Database migrations (safe, zero-impact)
- Basic CRUD endpoints for SSO configuration
- SSO enable/disable functionality

**Phase 2 (Week 2): Authentication Flow**
- New auth method check endpoint
- Azure AD OAuth integration
- Enhanced JWT token generation
- User linking (existing users only)

**Total: 2 weeks for MVP implementation**

### Removed from MVP (Future Enhancements)

The following features were removed to simplify the MVP implementation:
- Custom claims mapping
- Advanced OAuth scopes configuration
- Role mapping from Azure AD groups
- Auto-create users functionality
- Audit logging
- Session management controls (token lifetime, force re-auth, single session)
- Advanced security controls

These can be added as future enhancements once the core SSO functionality is proven.

### Error Response Format

All API endpoints should return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "SSO_REQUIRED|SSO_DISABLED|INCOMPLETE_CONFIG|INVALID_CONFIG",
    "message": "User-friendly error message",
    "details": {
      "sso_login_url": "/api/auth/sso/login/123",
      "auth_method": "sso|password"
    },
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

Success responses:
```json
{
  "success": true,
  "data": {},
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Companies That Prefer Username/Password

**Perfect Solution for Non-SSO Organizations:**
- Zero impact: Organizations continue exactly as before
- No forced migration: SSO is completely optional
- No additional complexity: Standard login flow unchanged
- Future flexibility: Can enable SSO later if business needs change
- Cost considerations: No Azure AD licensing required for organizations using password auth

This MVP implementation provides essential SSO integration while keeping complexity minimal and maintaining full backward compatibility.
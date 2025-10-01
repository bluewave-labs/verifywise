# Entra ID SSO Backend Implementation Overview

## Architecture Summary

The SSO implementation follows an **optional, per-organization** approach where organizations can enable Microsoft Entra ID (Azure AD) authentication while maintaining full backward compatibility for organizations preferring password authentication.

## Key Implementation Components

### 1. Database Schema
- **New table**: `sso_configurations` - Stores Azure AD credentials and settings per organization
- **User table extensions**: Adds `sso_enabled`, `azure_ad_object_id`, and `sso_last_login` columns
- **Migration strategy**: Sequelize migrations with rollback capability

### 2. Authentication Flow

#### Standard Flow (SSO Disabled)
```
User Login → Email/Password → JWT Token → Access Granted
```

#### SSO Flow (SSO Enabled)
```
User Login → Email Check → SSO Required → Redirect to Azure AD →
Azure AD Auth → Callback → Account Linking → JWT Token → Access Granted
```

### 3. Core Features

#### Configuration Management
- **CRUD Operations**: Admin-only endpoints for managing SSO settings
- **Secure Storage**: Client secrets encrypted using Node.js crypto module
- **Environment Variables**: Configuration stored in `.env` for different environments

#### SSO Toggle Logic
- **Enable SSO**: Immediately switches ALL organization users to SSO-only authentication
- **Disable SSO**: Reverts organization back to password authentication
- **Safety Checks**: Validates admin exists in Azure AD before enabling SSO
- **User Notification**: Optional prompt to invalidate existing sessions

#### Azure AD Integration
- **Library**: Official `@azure/msal-node` library from Microsoft
- **OAuth 2.0 Flow**: Standard authorization code flow with PKCE
- **Cloud Support**: Both Azure Public and Azure Government environments
- **Token Validation**: JWT validation with Azure AD public keys

### 4. Security Measures

#### Pre-Enable Validation
```javascript
// Before enabling SSO, verify:
1. Configuration is complete (Tenant ID, Client ID, Secret)
2. Admin user exists in Azure AD
3. Azure AD connection is functional
4. Organization has active users to migrate
```

#### Emergency Access
- **Break Glass**: Admin can disable SSO via database if Azure AD fails
- **Fallback**: Disabling SSO immediately restores password authentication
- **Audit Trail**: All SSO enable/disable events logged for security

#### Session Management
- **Token Invalidation**: Option to invalidate all existing JWT tokens when SSO is enabled
- **Refresh Token Blocking**: SSO-enabled users cannot refresh with old tokens
- **Graceful Expiry**: Existing tokens remain valid until natural expiry

### 5. User Account Linking

#### Linking Strategy
- **Email Matching**: Strict email-based matching between VerifyWise and Azure AD
- **No Auto-Creation**: Users must exist in VerifyWise before SSO login (MVP scope)
- **One-Time Link**: Azure AD Object ID stored permanently for future logins

#### Edge Case Handling
- **Email Mismatch**: Returns clear error message to contact administrator
- **Missing User**: Prompts admin to create user account first
- **Multiple Accounts**: Uses first matching email (logged for review)

### 6. API Endpoints

#### Configuration Endpoints
- `GET /api/organizations/{id}/sso/configuration` - Retrieve SSO settings
- `POST /api/organizations/{id}/sso/configuration` - Create/update SSO settings
- `POST /api/organizations/{id}/sso/enable` - Enable SSO with validation
- `POST /api/organizations/{id}/sso/disable` - Disable SSO and revert to passwords

#### Authentication Endpoints
- `POST /api/auth/check-auth-method` - Determine if email requires SSO
- `GET /api/auth/sso/login/{organizationId}` - Initiate SSO flow
- `POST /api/auth/sso/callback` - Handle Azure AD callback
- `GET /api/auth/sso/logout` - Handle SSO logout

### 7. Implementation Timeline

#### Phase 1: Foundation (Day 1)
- Install `@azure/msal-node` library
- Create database migrations
- Setup environment variables

#### Phase 2: Configuration APIs (Day 2)
- CRUD endpoints for SSO settings
- Encryption utilities
- Admin access controls

#### Phase 3: SSO Toggle (Day 3)
- Enable/disable logic with transactions
- Pre-enable validation checks
- User migration logic

#### Phase 4-5: Azure AD Integration (Days 4-5)
- OAuth flow implementation
- Token validation
- User information retrieval

#### Phase 6: Auth Enhancement (Day 6)
- JWT middleware updates
- Session management
- Error handling

#### Phase 7: Testing & Polish (Day 7)
- End-to-end testing
- Mock implementation for UI testing
- Documentation

### 8. Backward Compatibility Guarantees

- **Zero Impact**: Organizations without SSO configuration continue using passwords
- **No Migration Required**: Existing authentication remains unchanged
- **API Compatibility**: All existing endpoints continue working
- **Database Safety**: New columns have safe defaults (NULL/false)
- **Token Compatibility**: Existing JWT tokens remain valid

### 9. Error Handling

#### User-Facing Errors
- `SSO_REQUIRED`: Organization requires Azure AD authentication
- `SSO_DISABLED`: SSO not available for this organization
- `USER_NOT_FOUND`: Account doesn't exist in VerifyWise
- `AZURE_AD_ERROR`: Azure AD service unavailable

#### Admin-Facing Errors
- `INCOMPLETE_CONFIG`: Missing required SSO configuration
- `ADMIN_NOT_IN_AZURE`: Admin account not found in Azure AD
- `INVALID_CREDENTIALS`: Azure AD credentials invalid
- `NETWORK_ERROR`: Cannot connect to Azure AD

### 10. Testing Strategy

#### Development Testing
- **Mock Mode**: Temporary mock endpoints for UI development
- **Test Credentials**: Hardcoded test values for development
- **Bypass Azure**: Local testing without Azure AD dependency

#### Integration Testing
- **Real Azure AD**: Test tenant for actual OAuth flow
- **Email Scenarios**: Various email matching cases
- **Error Conditions**: Network failures, invalid tokens, etc.

### 11. Deployment Considerations

#### Environment Variables
```bash
# Azure AD Configuration
AZURE_AD_TENANT_ID=<from_database>
AZURE_AD_CLIENT_ID=<from_database>
AZURE_AD_CLIENT_SECRET=<encrypted_in_database>
SSO_REDIRECT_BASE_URL=https://app.verifywise.com

# Encryption
SSO_ENCRYPTION_KEY=<random_32_char_string>
```

#### Migration Sequence
1. Deploy database migrations
2. Add environment variables
3. Deploy backend code
4. Test with single organization
5. Gradual rollout to other organizations

### 12. Future Enhancements (Not in MVP)

- **Auto-Create Users**: Automatically provision new users from Azure AD
- **Role Mapping**: Map Azure AD groups to VerifyWise roles
- **Audit Logging**: Comprehensive SSO event logging
- **Advanced Security**: Session limits, force re-authentication
- **Multiple IDPs**: Support for other identity providers

## Summary

This implementation provides a secure, optional SSO integration that:
- ✅ Maintains full backward compatibility
- ✅ Enables enterprise-grade authentication
- ✅ Supports government cloud environments
- ✅ Provides clear migration path
- ✅ Includes emergency recovery options
- ✅ Follows Microsoft best practices

The system is designed to be **non-disruptive** to existing users while providing **immediate value** to organizations requiring SSO authentication.
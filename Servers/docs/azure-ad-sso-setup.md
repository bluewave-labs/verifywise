# Azure AD SSO Setup Guide

This guide walks you through setting up Single Sign-On (SSO) with Azure Active Directory (Azure AD/Entra ID) for VerifyWise.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Azure AD Application Setup](#azure-ad-application-setup)
3. [VerifyWise Configuration](#verifywise-configuration)
4. [Testing the Integration](#testing-the-integration)
5. [Troubleshooting](#troubleshooting)
6. [Security Considerations](#security-considerations)

## Prerequisites

Before setting up Azure AD SSO, ensure you have:

- **Azure AD tenant** with administrator access
- **VerifyWise organization admin** access
- Access to **Azure Portal** (portal.azure.com)
- Basic understanding of **OAuth 2.0/OpenID Connect**

## Azure AD Application Setup

### Step 1: Create Azure AD Application

1. **Navigate to Azure Portal**
   - Go to [portal.azure.com](https://portal.azure.com)
   - Sign in with your Azure AD administrator account

2. **Access Azure Active Directory**
   - Search for "Azure Active Directory" in the top search bar
   - Select "Azure Active Directory" from the results

3. **Register a New Application**
   - In the left menu, click **"App registrations"**
   - Click **"+ New registration"**
   - Fill in the application details:

   ```
   Name: VerifyWise SSO
   Supported account types: Accounts in this organizational directory only
   Redirect URI: Web
   Redirect URI Value: https://your-verifywise-domain.com/api/auth/azure/callback
   ```

4. **Note Application Details**
   After registration, copy these values (you'll need them later):
   - **Application (client) ID**: `12345678-1234-1234-1234-123456789abc`
   - **Directory (tenant) ID**: `87654321-4321-4321-4321-cba987654321`

### Step 2: Configure Application Settings

1. **Create Client Secret**
   - In your app registration, go to **"Certificates & secrets"**
   - Click **"+ New client secret"**
   - Add description: `VerifyWise SSO Secret`
   - Set expiration: **24 months** (recommended)
   - Click **"Add"**
   - **⚠️ Important**: Copy the secret value immediately - you won't see it again!

2. **Configure API Permissions**
   - Go to **"API permissions"**
   - Click **"+ Add a permission"**
   - Select **"Microsoft Graph"**
   - Choose **"Delegated permissions"**
   - Add these permissions:
     - `openid` (Sign in and read user profile)
     - `profile` (View users' basic profile)
     - `email` (View users' email address)
     - `User.Read` (Sign in and read user profile)

3. **Grant Admin Consent**
   - Click **"Grant admin consent for [Your Organization]"**
   - Confirm by clicking **"Yes"**

### Step 3: Configure Authentication

1. **Set Redirect URIs**
   - Go to **"Authentication"**
   - Under **"Web"** platform, ensure you have:
     ```
     https://your-verifywise-domain.com/api/auth/azure/callback
     ```
   - Add logout URL (optional):
     ```
     https://your-verifywise-domain.com/logout
     ```

2. **Configure Token Settings**
   - Under **"Implicit grant and hybrid flows"**:
     - ✅ **ID tokens** (used for hybrid flows)
   - Under **"Advanced settings"**:
     - ✅ **Allow public client flows**: No

## VerifyWise Configuration

### Step 1: Access SSO Configuration

1. **Login to VerifyWise** as an organization administrator
2. **Navigate to Organization Settings** → **SSO Configuration**
3. **Select Azure AD** as the SSO provider

### Step 2: Configure Azure AD Settings

Fill in the Azure AD configuration form with the values from your Azure AD app registration:

```json
{
  "azure_tenant_id": "87654321-4321-4321-4321-cba987654321",
  "azure_client_id": "12345678-1234-1234-1234-123456789abc",
  "azure_client_secret": "your-client-secret-value",
  "cloud_environment": "AzurePublic",
  "auth_method_policy": "both"
}
```

#### Configuration Fields Explained

| Field | Description | Example |
|-------|-------------|---------|
| `azure_tenant_id` | Your Azure AD tenant/directory ID | `87654321-4321-4321-4321-cba987654321` |
| `azure_client_id` | Your Azure AD application/client ID | `12345678-1234-1234-1234-123456789abc` |
| `azure_client_secret` | Your Azure AD application client secret | `ABC123xyz789...` |
| `cloud_environment` | Azure cloud environment | `AzurePublic` or `AzureGovernment` |
| `auth_method_policy` | Authentication policy | `sso_only`, `password_only`, or `both` |

#### Authentication Policies

- **`sso_only`**: Users can only authenticate via Azure AD SSO
- **`password_only`**: Users can only use password authentication (not recommended)
- **`both`**: Users can choose between SSO and password authentication (recommended for migration)

### Step 3: Validate Configuration

1. **Click "Validate Configuration"**
   - This checks if your Azure AD settings are correctly formatted
   - Verifies tenant ID and client ID are valid GUIDs
   - Validates client secret strength

2. **Click "Test Connection"**
   - This attempts to create an MSAL client with your configuration
   - Verifies that the Azure AD application can be reached
   - Tests the authority URL construction

### Step 4: Enable SSO

1. **Review Configuration Summary**
2. **Click "Enable SSO"**
3. **Confirm the action**

⚠️ **Important**: Test SSO thoroughly before enabling `sso_only` mode to avoid locking out users.

## Testing the Integration

### Step 1: Test SSO Login Flow

1. **Open a new incognito/private browser window**
2. **Navigate to VerifyWise login page**
3. **Click "Sign in with Azure AD"**
4. **Complete Azure AD authentication**
5. **Verify successful login to VerifyWise**

### Step 2: Test User Provisioning

When a user logs in via SSO for the first time:

1. **New User Creation**: VerifyWise automatically creates a user account
2. **Profile Information**: Email, name populated from Azure AD
3. **Organization Assignment**: User assigned to the correct organization
4. **Role Assignment**: User gets default role (typically "User")

### Step 3: Verify API Endpoints

Test the SSO API endpoints using curl or Postman:

```bash
# Test configuration retrieval
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-domain.com/api/sso-configuration/YOUR_ORG_ID

# Test configuration validation
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"azure_tenant_id":"...","azure_client_id":"...","azure_client_secret":"..."}' \
  https://your-domain.com/api/sso-configuration/YOUR_ORG_ID/validate
```

## Troubleshooting

### Common Issues

#### 1. **"Invalid tenant ID" Error**

**Symptoms**: Error during configuration validation
**Cause**: Incorrect tenant ID format or value
**Solution**:
- Verify tenant ID is a valid GUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Check Azure Portal → Azure AD → Overview → Tenant ID
- Ensure no extra spaces or characters

#### 2. **"Invalid client ID" Error**

**Symptoms**: Authentication fails with client ID error
**Cause**: Incorrect application ID
**Solution**:
- Verify client ID in Azure Portal → App registrations → Your App → Overview
- Ensure ID matches exactly (case-sensitive)

#### 3. **"Client Secret Invalid" Error**

**Symptoms**: Authentication fails during token exchange
**Cause**: Expired or incorrect client secret
**Solution**:
- Generate new client secret in Azure Portal
- Update VerifyWise configuration with new secret
- Ensure secret hasn't expired

#### 4. **"Access Denied" Error**

**Symptoms**: Users can't authenticate via SSO
**Cause**: Missing permissions or consent
**Solution**:
- Verify API permissions are granted
- Ensure admin consent is provided
- Check user has access to the Azure AD application

#### 5. **"Redirect URI Mismatch" Error**

**Symptoms**: OAuth error during authentication
**Cause**: Redirect URI doesn't match Azure AD configuration
**Solution**:
- Verify redirect URI in Azure Portal matches your VerifyWise domain
- Ensure HTTPS is used (not HTTP)
- Check for extra slashes or typos

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
# Set environment variable for detailed SSO logging
export SSO_DEBUG=true
npm run start
```

Check logs for detailed error information:

```bash
# Check SSO-specific logs
grep "SSO" logs/application.log
```

### Validation Errors

The SSO validator provides detailed error messages:

```json
{
  "success": false,
  "validation": {
    "isValid": false,
    "errors": [
      "Tenant ID must be a valid GUID format",
      "Client Secret is too short"
    ],
    "warnings": [
      "Client Secret contains unusual characters"
    ]
  }
}
```

## Security Considerations

### Best Practices

1. **Client Secret Management**
   - Store client secrets securely (environment variables, key vault)
   - Rotate secrets regularly (every 6-12 months)
   - Never commit secrets to version control
   - Use strong, unique secrets

2. **Network Security**
   - Always use HTTPS for redirect URIs
   - Implement proper firewall rules
   - Consider IP whitelisting for admin access

3. **User Access Control**
   - Regularly review user access in Azure AD
   - Implement conditional access policies
   - Use multi-factor authentication (MFA)
   - Monitor sign-in logs

4. **Application Security**
   - Keep VerifyWise updated with latest security patches
   - Regularly review SSO audit logs
   - Implement session timeout policies
   - Use secure session management

### Compliance Considerations

- **Data Residency**: Ensure Azure AD tenant location meets compliance requirements
- **Audit Logging**: Enable comprehensive audit logging for SSO events
- **Access Reviews**: Implement regular access reviews for SSO users
- **Data Protection**: Follow GDPR/CCPA guidelines for user data handling

### Monitoring and Alerting

Set up monitoring for:

- **Failed SSO authentication attempts**
- **Configuration changes**
- **Token exchange failures**
- **Unusual access patterns**

## Support

### Documentation Links

- [Microsoft Azure AD Documentation](https://docs.microsoft.com/en-us/azure/active-directory/)
- [MSAL Node.js Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-node-api-ref)
- [OAuth 2.0 and OpenID Connect](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols)

### Getting Help

For VerifyWise SSO issues:

1. **Check this documentation** for common solutions
2. **Review application logs** for detailed error messages
3. **Use the built-in validation tools** in VerifyWise admin panel
4. **Contact VerifyWise support** with configuration details and error logs

### Useful Azure AD PowerShell Commands

```powershell
# Get tenant information
Get-AzureADTenantDetail

# List all app registrations
Get-AzureADApplication

# Get specific app registration
Get-AzureADApplication -Filter "DisplayName eq 'VerifyWise SSO'"

# Check app permissions
Get-AzureADServicePrincipal -Filter "DisplayName eq 'VerifyWise SSO'" | Get-AzureADServicePrincipalOAuth2PermissionGrant
```

---

**Last Updated**: 2025-01-28
**Version**: 1.0
**Tested with**: Azure AD/Entra ID, VerifyWise v2.x
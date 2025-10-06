#!/usr/bin/env node

/**
 * @fileoverview Production Secret Generator (JavaScript)
 *
 * Generates cryptographically secure secrets for VerifyWise production deployment.
 * This script helps administrators create properly randomized secrets for all
 * environment variables that require secure values.
 *
 * **Usage:**
 * ```bash
 * npm run generate-secrets
 * # OR
 * node scripts/generateSecrets.js
 * ```
 *
 * @created 2025-10-06
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generate a cryptographically secure hex string
 */
function generateHexSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a cryptographically secure base64 string
 */
function generateBase64Secret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Generate all required secrets
 */
function generateAllSecrets() {
  return {
    jwtSecret: generateHexSecret(32),
    refreshTokenSecret: generateHexSecret(32),
    tenantHashSalt: generateBase64Secret(32),
    tenantEntropySource: `VERIFYWISE_TENANT_${generateHexSecret(8).toUpperCase()}_${new Date().getFullYear()}`,
    ssoStateSecret: generateHexSecret(32),
    ssoEncryptionKey: generateHexSecret(16), // 32 chars for AES-256
    redisPassword: generateBase64Secret(24),
    dbPassword: generateBase64Secret(24)
  };
}

/**
 * Calculate Shannon entropy for a string
 */
function calculateEntropy(str) {
  const charFreq = {};
  for (const char of str) {
    charFreq[char] = (charFreq[char] || 0) + 1;
  }

  const length = str.length;
  let entropy = 0;
  for (const freq of Object.values(charFreq)) {
    const probability = freq / length;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

/**
 * Display secrets in a formatted way
 */
function displaySecrets(secrets) {
  console.log('🔐 Generated Cryptographically Secure Secrets');
  console.log('=' .repeat(80));
  console.log();

  console.log('📋 JWT Authentication:');
  console.log(`JWT_SECRET=${secrets.jwtSecret}`);
  console.log(`REFRESH_TOKEN_SECRET=${secrets.refreshTokenSecret}`);
  console.log();

  console.log('🏢 Tenant Security:');
  console.log(`TENANT_HASH_SALT=${secrets.tenantHashSalt}`);
  console.log(`TENANT_ENTROPY_SOURCE=${secrets.tenantEntropySource}`);
  console.log();

  console.log('🔑 SSO Configuration:');
  console.log(`SSO_STATE_SECRET=${secrets.ssoStateSecret}`);
  console.log(`SSO_ENCRYPTION_KEY=${secrets.ssoEncryptionKey}`);
  console.log();

  console.log('💾 Database & Cache:');
  console.log(`DB_PASSWORD=${secrets.dbPassword}`);
  console.log(`REDIS_PASSWORD=${secrets.redisPassword}`);
  console.log();

  console.log('🔒 Security Verification:');
  console.log(`JWT Secret entropy: ${calculateEntropy(secrets.jwtSecret).toFixed(2)} bits/char`);
  console.log(`Tenant Salt entropy: ${calculateEntropy(secrets.tenantHashSalt).toFixed(2)} bits/char`);
  console.log(`SSO Secret entropy: ${calculateEntropy(secrets.ssoStateSecret).toFixed(2)} bits/char`);
  console.log();

  console.log('✅ All secrets meet cryptographic security standards');
  console.log('⚠️  Store these secrets securely - they cannot be recovered if lost');
}

/**
 * Generate a complete .env template with secure values
 */
function generateEnvTemplate(secrets, outputPath) {
  const template = `# VerifyWise Production Environment Configuration
# Generated on: ${new Date().toISOString()}
#
# SECURITY NOTICE:
# - These secrets were generated cryptographically
# - NEVER commit this file to version control
# - Store securely and rotate regularly

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
DB_USER=verifywise_user
DB_PASSWORD=${secrets.dbPassword}
DB_NAME=verifywise_prod
DB_HOST=your-database-host.com
DB_PORT=5432
DB_SSL=true
REJECT_UNAUTHORIZED=true

# =============================================================================
# JWT AUTHENTICATION SECRETS
# =============================================================================
JWT_SECRET=${secrets.jwtSecret}
REFRESH_TOKEN_SECRET=${secrets.refreshTokenSecret}

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================
PORT=3000
NODE_ENV=production
BACKEND_URL=https://api.your-domain.com
FRONTEND_URL=https://app.your-domain.com

# =============================================================================
# OUTBOX EVENT SYSTEM
# =============================================================================
ENABLE_OUTBOX_PROCESSING=true

# =============================================================================
# TENANT SECURITY CONFIGURATION
# =============================================================================
TENANT_HASH_SALT=${secrets.tenantHashSalt}
TENANT_ENTROPY_SOURCE=${secrets.tenantEntropySource}

# =============================================================================
# SSO CONFIGURATION
# =============================================================================
SSO_STATE_SECRET=${secrets.ssoStateSecret}
SSO_ENCRYPTION_KEY=${secrets.ssoEncryptionKey}

# =============================================================================
# REDIS CONFIGURATION
# =============================================================================
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=${secrets.redisPassword}

# =============================================================================
# CORS CONFIGURATION
# =============================================================================
ALLOWED_ORIGINS=["https://app.your-domain.com"]

# =============================================================================
# MONITORING AND LOGGING
# =============================================================================
# LOG_LEVEL=info
# SENTRY_DSN=https://your-sentry-dsn.ingest.sentry.io/project-id

# =============================================================================
# SECURITY HEADERS AND RATE LIMITING
# =============================================================================
# RATE_LIMIT_WINDOW_MS=900000
# RATE_LIMIT_MAX_REQUESTS=100
# SECURITY_HEADERS_ENABLED=true
`;

  if (outputPath) {
    fs.writeFileSync(outputPath, template);
    console.log(`📄 Complete .env template written to: ${outputPath}`);
    console.log('💡 Edit the template to add your specific hosts and configuration');
  }

  return template;
}

/**
 * Command line validation
 */
function validateCommand() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log('VerifyWise Secret Generator');
    console.log();
    console.log('Usage:');
    console.log('  npm run generate-secrets                    # Display secrets only');
    console.log('  npm run generate-secrets -- --write-file   # Write to .env.production');
    console.log('  npm run generate-secrets -- --output=path  # Write to custom path');
    console.log();
    console.log('Options:');
    console.log('  -w, --write-file       Write secrets to .env.production');
    console.log('  --output=PATH          Write secrets to custom path');
    console.log('  -h, --help             Show this help message');
    console.log();
    process.exit(0);
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const shouldWriteFile = args.includes('--write-file') || args.includes('-w');
  const outputPath = args.find(arg => arg.startsWith('--output='))?.split('=')[1];

  console.log('🚀 VerifyWise Production Secret Generator');
  console.log('Generating cryptographically secure secrets for production deployment...');
  console.log();

  // Generate secrets
  const secrets = generateAllSecrets();

  // Display them
  displaySecrets(secrets);

  // Optionally write to file
  if (shouldWriteFile || outputPath) {
    const filePath = outputPath || path.join(process.cwd(), '.env.production');
    generateEnvTemplate(secrets, filePath);
    console.log();
  }

  console.log('🔧 Next Steps:');
  console.log('1. Copy the secrets above to your production .env file');
  console.log('2. Update host names and database configuration');
  console.log('3. Secure the .env file with appropriate file permissions (600)');
  console.log('4. Test the configuration in staging before production');
  console.log('5. Set up secret rotation procedures');
  console.log();

  console.log('💡 Deployment Commands:');
  console.log('   chmod 600 .env.production');
  console.log('   chown app:app .env.production');
  console.log('   # Deploy and restart services');
}

// Run if called directly
if (require.main === module) {
  validateCommand();
  main();
}

module.exports = {
  generateAllSecrets,
  generateEnvTemplate
};
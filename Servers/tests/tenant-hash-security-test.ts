/**
 * @fileoverview Comprehensive Security Test for Tenant Hash System
 *
 * Tests all security aspects of the enhanced tenant hash generation:
 * - Collision detection and resolution
 * - Input validation and attack prevention
 * - Uniqueness guarantees
 * - Performance under load
 * - Database integrity
 *
 * @created 2025-01-06
 */

import {
  getTenantHash,
  getTenantHashSync,
  validateTenantHash,
  validateTenantHashSecurity,
  auditExistingTenantHashes,
  getTenantHashStats,
  closeTenantHashDatabase
} from '../tools/getTenantHashSecure';

/**
 * Test Cases for Security Validation
 */
const securityTestCases = [
  // Valid inputs
  { input: 1, shouldSucceed: true, description: 'Valid tenant ID 1' },
  { input: 999999, shouldSucceed: true, description: 'Large valid tenant ID' },
  { input: 42, shouldSucceed: true, description: 'Random valid tenant ID' },

  // Invalid inputs - should throw errors
  { input: 0, shouldSucceed: false, description: 'Zero tenant ID' },
  { input: -1, shouldSucceed: false, description: 'Negative tenant ID' },
  { input: -999, shouldSucceed: false, description: 'Large negative tenant ID' },
  { input: 1.5, shouldSucceed: false, description: 'Decimal tenant ID' },
  { input: NaN, shouldSucceed: false, description: 'NaN tenant ID' },
  { input: Infinity, shouldSucceed: false, description: 'Infinity tenant ID' },
  { input: Number.MAX_SAFE_INTEGER + 1, shouldSucceed: false, description: 'Too large tenant ID' },
];

/**
 * Run input validation tests
 */
async function testInputValidation(): Promise<boolean> {
  console.log('🔍 Testing Input Validation...');
  console.log('=' .repeat(50));

  let passed = 0;
  let failed = 0;

  for (const testCase of securityTestCases) {
    try {
      const hash = getTenantHashSync(testCase.input as number);

      if (testCase.shouldSucceed) {
        console.log(`✅ PASS: ${testCase.description} -> ${hash}`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${testCase.description} - Should have thrown error but got: ${hash}`);
        failed++;
      }
    } catch (error: any) {
      if (!testCase.shouldSucceed) {
        console.log(`✅ PASS: ${testCase.description} - Correctly threw error: ${error.message}`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${testCase.description} - Should have succeeded but threw: ${error.message}`);
        failed++;
      }
    }
  }

  console.log(`Input validation: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

/**
 * Test hash uniqueness and collision detection
 */
async function testHashUniqueness(): Promise<boolean> {
  console.log('🔒 Testing Hash Uniqueness and Collision Detection...');
  console.log('=' .repeat(50));

  const hashes = new Set<string>();
  const tenantIds = Array.from({ length: 1000 }, (_, i) => i + 1);
  let collisions = 0;

  for (const tenantId of tenantIds) {
    try {
      const hash = await getTenantHash(tenantId);

      if (hashes.has(hash)) {
        console.log(`❌ COLLISION: Tenant ${tenantId} generated duplicate hash: ${hash}`);
        collisions++;
      } else {
        hashes.add(hash);
      }

      // Verify hash is correct length
      if (hash.length !== 16) {
        console.log(`❌ LENGTH: Tenant ${tenantId} hash has wrong length: ${hash.length} (expected 16)`);
        collisions++;
      }

      // Verify hash contains only alphanumeric characters
      if (!/^[a-zA-Z0-9]+$/.test(hash)) {
        console.log(`❌ FORMAT: Tenant ${tenantId} hash contains invalid characters: ${hash}`);
        collisions++;
      }

    } catch (error: any) {
      console.log(`❌ ERROR: Failed to generate hash for tenant ${tenantId}: ${error.message}`);
      collisions++;
    }
  }

  console.log(`Generated ${hashes.size} unique hashes for ${tenantIds.length} tenants`);
  console.log(`Collisions detected: ${collisions}`);

  const success = collisions === 0 && hashes.size === tenantIds.length;
  console.log(success ? '✅ Hash uniqueness test passed\n' : '❌ Hash uniqueness test failed\n');

  return success;
}

/**
 * Test hash consistency (same input should produce same output)
 */
async function testHashConsistency(): Promise<boolean> {
  console.log('🔄 Testing Hash Consistency...');
  console.log('=' .repeat(50));

  const testTenants = [1, 42, 999, 12345];
  let inconsistencies = 0;

  for (const tenantId of testTenants) {
    const hashes = [];

    // Generate hash multiple times
    for (let i = 0; i < 10; i++) {
      try {
        const hash = await getTenantHash(tenantId);
        hashes.push(hash);
      } catch (error: any) {
        console.log(`❌ ERROR: Failed to generate hash for tenant ${tenantId}, attempt ${i + 1}: ${error.message}`);
        inconsistencies++;
      }
    }

    // Check all hashes are identical
    const uniqueHashes = new Set(hashes);
    if (uniqueHashes.size !== 1) {
      console.log(`❌ INCONSISTENT: Tenant ${tenantId} produced ${uniqueHashes.size} different hashes: ${Array.from(uniqueHashes)}`);
      inconsistencies++;
    } else {
      console.log(`✅ CONSISTENT: Tenant ${tenantId} -> ${hashes[0]}`);
    }
  }

  const success = inconsistencies === 0;
  console.log(success ? '✅ Hash consistency test passed\n' : '❌ Hash consistency test failed\n');

  return success;
}

/**
 * Test hash validation function
 */
async function testHashValidation(): Promise<boolean> {
  console.log('🛡️ Testing Hash Validation...');
  console.log('=' .repeat(50));

  let validationErrors = 0;

  // Test valid hash validation
  const tenantId = 123;
  const correctHash = await getTenantHash(tenantId);

  if (!validateTenantHash(correctHash, tenantId)) {
    console.log(`❌ Valid hash rejected: ${correctHash} for tenant ${tenantId}`);
    validationErrors++;
  } else {
    console.log(`✅ Valid hash accepted: ${correctHash} for tenant ${tenantId}`);
  }

  // Test invalid hash validation
  const invalidHash = 'maliciousHash123';
  if (validateTenantHash(invalidHash, tenantId)) {
    console.log(`❌ Invalid hash accepted: ${invalidHash} for tenant ${tenantId}`);
    validationErrors++;
  } else {
    console.log(`✅ Invalid hash rejected: ${invalidHash} for tenant ${tenantId}`);
  }

  // Test wrong tenant ID validation
  const anotherTenantId = 456;
  const anotherHash = await getTenantHash(anotherTenantId);
  if (validateTenantHash(anotherHash, tenantId)) {
    console.log(`❌ Wrong tenant hash accepted: ${anotherHash} for tenant ${tenantId} (should be for ${anotherTenantId})`);
    validationErrors++;
  } else {
    console.log(`✅ Wrong tenant hash rejected: ${anotherHash} for tenant ${tenantId}`);
  }

  const success = validationErrors === 0;
  console.log(success ? '✅ Hash validation test passed\n' : '❌ Hash validation test failed\n');

  return success;
}

/**
 * Test performance under load
 */
async function testPerformance(): Promise<boolean> {
  console.log('⚡ Testing Performance Under Load...');
  console.log('=' .repeat(50));

  const startTime = Date.now();
  const promises = [];
  const concurrency = 50;
  const requestsPerWorker = 20;

  // Create concurrent hash generation requests
  for (let worker = 0; worker < concurrency; worker++) {
    const workerPromise = (async () => {
      for (let req = 0; req < requestsPerWorker; req++) {
        const tenantId = worker * requestsPerWorker + req + 1;
        await getTenantHash(tenantId);
      }
    })();
    promises.push(workerPromise);
  }

  try {
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    const totalRequests = concurrency * requestsPerWorker;
    const requestsPerSecond = Math.round((totalRequests / duration) * 1000);

    console.log(`✅ Generated ${totalRequests} hashes in ${duration}ms`);
    console.log(`✅ Performance: ${requestsPerSecond} hashes/second`);
    console.log(`✅ Average time per hash: ${(duration / totalRequests).toFixed(2)}ms`);

    // Performance should be reasonable (at least 10 hashes/second)
    const success = requestsPerSecond >= 10;
    console.log(success ? '✅ Performance test passed\n' : '❌ Performance test failed (too slow)\n');

    return success;
  } catch (error: any) {
    console.log(`❌ Performance test failed with error: ${error.message}\n`);
    return false;
  }
}

/**
 * Test security configuration validation
 */
async function testSecurityConfiguration(): Promise<boolean> {
  console.log('⚙️ Testing Security Configuration...');
  console.log('=' .repeat(50));

  try {
    validateTenantHashSecurity();
    console.log('✅ Security configuration validation passed\n');
    return true;
  } catch (error: any) {
    console.log(`❌ Security configuration validation failed: ${error.message}\n`);
    return false;
  }
}

/**
 * Test existing tenant hash audit
 */
async function testTenantHashAudit(): Promise<boolean> {
  console.log('🔍 Testing Tenant Hash Audit...');
  console.log('=' .repeat(50));

  try {
    const auditResults = await auditExistingTenantHashes();

    console.log(`Audited ${auditResults.totalTenants} tenants`);
    console.log(`Found ${auditResults.collisions.length} collisions`);

    if (auditResults.collisions.length > 0) {
      console.log('❌ Hash collisions found:');
      for (const collision of auditResults.collisions) {
        console.log(`  - Tenants ${collision.tenantId1} and ${collision.tenantId2} both hash to: ${collision.hash}`);
      }
      return false;
    } else {
      console.log('✅ No hash collisions found');
      return true;
    }
  } catch (error: any) {
    console.log(`❌ Tenant hash audit failed: ${error.message}\n`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests(): Promise<void> {
  console.log('🛡️ COMPREHENSIVE TENANT HASH SECURITY TEST SUITE');
  console.log('=' .repeat(60));
  console.log();

  const testResults = [];

  try {
    // Run all test suites
    testResults.push(await testInputValidation());
    testResults.push(await testHashUniqueness());
    testResults.push(await testHashConsistency());
    testResults.push(await testHashValidation());
    testResults.push(await testPerformance());
    testResults.push(await testSecurityConfiguration());
    testResults.push(await testTenantHashAudit());

    // Show statistics
    const stats = getTenantHashStats();
    console.log('📊 Tenant Hash System Statistics:');
    console.log(`   Cache size: ${stats.cacheSize}`);
    console.log(`   Known hashes: ${stats.knownHashesSize}`);
    console.log(`   Hash length: ${stats.config.hashLength}`);
    console.log(`   Max collision attempts: ${stats.config.maxCollisionAttempts}`);
    console.log(`   Salt configured: ${stats.config.saltConfigured ? '✅' : '❌'}`);
    console.log();

    // Final results
    const passed = testResults.filter(Boolean).length;
    const failed = testResults.length - passed;

    console.log('📊 FINAL TEST RESULTS:');
    console.log('=' .repeat(60));
    console.log(`Total test suites: ${testResults.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED - Tenant hash system is secure!');
      console.log('\nSecurity improvements implemented:');
      console.log('✅ Input validation prevents manipulation attacks');
      console.log('✅ Collision detection ensures uniqueness');
      console.log('✅ Increased hash length reduces collision probability');
      console.log('✅ Salt prevents hash prediction attacks');
      console.log('✅ Database verification ensures global uniqueness');
      console.log('✅ Performance is acceptable under load');
      console.log('✅ Configuration validation prevents misuse');
      process.exit(0);
    } else {
      console.log('\n🚨 SOME TESTS FAILED - Security issues remain!');
      console.log('\nPlease address the failed tests before deployment.');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await closeTenantHashDatabase();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export {
  testInputValidation,
  testHashUniqueness,
  testHashConsistency,
  testHashValidation,
  testPerformance,
  testSecurityConfiguration,
  testTenantHashAudit,
  runAllTests
};
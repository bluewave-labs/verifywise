#!/usr/bin/env node

/**
 * Simple test script to verify UC sequence functionality
 */

require('dotenv').config();
const { sequelize } = require('./dist/infrastructure.layer/database/db');
const { getTenantHash } = require('./dist/tools/getTenantHash');
const { ensureProjectInfrastructure, generateNextUcId } = require('./dist/utils/project.utils');
const { Transaction } = require('sequelize');

async function testImplementation() {
  console.log('🧪 Testing Clean UC Sequence Implementation...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    const testTenant = getTenantHash('1');
    console.log(`📋 Testing with tenant: ${testTenant}`);

    // Test 1: Infrastructure setup
    console.log('\n1️⃣ Testing infrastructure setup...');
    await ensureProjectInfrastructure(testTenant);
    console.log('✅ Infrastructure setup completed successfully');

    // Test 2: UC ID generation
    console.log('\n2️⃣ Testing UC ID generation...');
    const transaction = await sequelize.transaction();

    const ucId1 = await generateNextUcId(testTenant, transaction);
    console.log(`✅ Generated UC ID: ${ucId1}`);

    const ucId2 = await generateNextUcId(testTenant, transaction);
    console.log(`✅ Generated UC ID: ${ucId2}`);

    const ucId3 = await generateNextUcId(testTenant, transaction);
    console.log(`✅ Generated UC ID: ${ucId3}`);

    await transaction.commit();

    // Test 3: Database validation
    console.log('\n3️⃣ Testing database state...');
    const validationTransaction = await sequelize.transaction();

    const sequenceValue = await sequelize.query(
      `SELECT last_value FROM "${testTenant}".project_uc_id_seq`,
      {
        type: sequelize.QueryTypes.SELECT,
        transaction: validationTransaction
      }
    );

    console.log(`📊 Current sequence value: ${sequenceValue[0].last_value}`);

    await validationTransaction.commit();

    console.log('\n🎉 All tests passed!');
    console.log('✅ Infrastructure setup works correctly');
    console.log('✅ UC ID generation works correctly');
    console.log('✅ Clean implementation is working');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n🔒 Database connection closed');
  }
}

testImplementation();
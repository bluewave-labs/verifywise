/**
 * Script to create a test user
 * Usage: npx tsx scripts/create-test-user.ts
 */

import { sequelize } from '../database/db';
import { UserModel } from '../domain.layer/models/user/user.model';

async function createTestUser() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected');

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      where: { email: 'sarah.johnson@verifywise.ai' }
    });

    if (existingUser) {
      console.log('User already exists:');
      console.log('Email: sarah.johnson@verifywise.ai');
      console.log('Password: TestPassword123!');
      return;
    }

    // Create new user
    const user = await UserModel.createNewUser(
      'Sarah',
      'Johnson',
      'sarah.johnson@verifywise.ai',
      'TestPassword123!',
      1, // Admin role
      1  // Organization ID 1
    );

    // Save to database
    await user.save();

    console.log('\n✅ Test user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: sarah.johnson@verifywise.ai');
    console.log('Password: TestPassword123!');
    console.log('Role: Admin');
    console.log('Organization ID: 1');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  Save these credentials for testing');

  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

createTestUser();

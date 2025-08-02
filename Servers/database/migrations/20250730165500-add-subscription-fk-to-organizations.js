'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Add subscription-related columns to organizations table
      ALTER TABLE organizations 
      ADD COLUMN subscription_id INTEGER NULL;
      
      -- Add foreign key constraint for subscription_id
      ALTER TABLE organizations 
      ADD CONSTRAINT fk_organizations_subscription
        FOREIGN KEY (subscription_id) 
        REFERENCES subscriptions(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Remove foreign key constraint
      ALTER TABLE organizations 
      DROP CONSTRAINT IF EXISTS fk_organizations_subscription;
      
      -- Remove subscription-related columns
      ALTER TABLE organizations 
      DROP COLUMN IF EXISTS subscription_id,
      DROP COLUMN IF EXISTS is_subscribed;
    `);
  }
};
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Create the subscription_history table
      CREATE TABLE subscription_history (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL,
        subscription_id INTEGER NOT NULL,
        action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'upgraded', 'downgraded', 'canceled')),
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        
        -- Foreign key constraints
        CONSTRAINT fk_subscription_history_organization
          FOREIGN KEY (organization_id) 
          REFERENCES organizations(id) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE,
          
        CONSTRAINT fk_subscription_history_subscription
          FOREIGN KEY (subscription_id) 
          REFERENCES subscriptions(id) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS subscription_history;
    `);
  }
};
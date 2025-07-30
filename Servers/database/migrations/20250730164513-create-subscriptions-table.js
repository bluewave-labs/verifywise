'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Create the subscriptions table
      CREATE TABLE subscriptions (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL,
        tier_id INTEGER NOT NULL,
        stripe_sub_id VARCHAR(255) NOT NULL,
        status VARCHAR(10) NOT NULL CHECK (status IN ('active', 'inactive', 'canceled')),
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        
        -- Foreign key constraints
        CONSTRAINT fk_subscriptions_organization
          FOREIGN KEY (organization_id) 
          REFERENCES organizations(id) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE,
          
        CONSTRAINT fk_subscriptions_tier
          FOREIGN KEY (tier_id) 
          REFERENCES tiers(id) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE
      );

      -- Create the trigger function to auto-update updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Attach the trigger to the subscriptions table
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS set_updated_at ON subscriptions;
      DROP FUNCTION IF EXISTS update_updated_at_column;
      DROP TABLE IF EXISTS subscriptions;
    `);
  }
};
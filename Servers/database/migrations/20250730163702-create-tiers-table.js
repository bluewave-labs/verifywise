'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Create the tiers table
      CREATE TABLE tiers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(10) NOT NULL CHECK (name IN ('Free', 'Team', 'Growth', 'Enterprise')),
        price INTEGER NOT NULL,
        features JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Create the trigger function to auto-update updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Attach the trigger to the tiers table
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON tiers
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS set_updated_at ON tiers;
      DROP FUNCTION IF EXISTS update_updated_at_column;
      DROP TABLE IF EXISTS tiers;
    `);
  }
};
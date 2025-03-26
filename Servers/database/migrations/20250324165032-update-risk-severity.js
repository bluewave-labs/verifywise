'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // migrate projectrisks:severity type
    await queryInterface.sequelize.query(
      "CREATE TYPE enum_projectrisks_severity_temp AS ENUM ('Negligible', 'Minor', 'Moderate', 'Major', 'Critical', 'Catastrophic');"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE projectrisks ALTER COLUMN severity TYPE enum_projectrisks_severity_temp USING severity::text::enum_projectrisks_severity_temp"
    );
    await queryInterface.sequelize.query(
      "UPDATE projectrisks SET severity = 'Catastrophic' WHERE severity = 'Critical';"
    );
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_projectrisks_severity;"
    );
    await queryInterface.sequelize.query(
      "CREATE TYPE enum_projectrisks_severity AS ENUM ('Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic');"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE projectrisks ALTER COLUMN severity TYPE enum_projectrisks_severity USING severity::text::enum_projectrisks_severity"
    );
    await queryInterface.sequelize.query(
      "DROP TYPE enum_projectrisks_severity_temp;"
    );

    // migrate vendorrisks:risk_severity type
    await queryInterface.sequelize.query(
      `CREATE TYPE enum_vendorrisks_risk_severity_temp AS ENUM (
        'Very low risk', 'Low risk', 'Medium risk', 'High risk', 'Very high risk',
        'Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'
      );`
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE vendorrisks ALTER COLUMN risk_severity TYPE enum_vendorrisks_risk_severity_temp USING risk_severity::text::enum_vendorrisks_risk_severity_temp"
    );
    await queryInterface.sequelize.query(
      "UPDATE vendorrisks SET risk_severity = 'Negligible' WHERE risk_severity = 'Very low risk';"
    );
    await queryInterface.sequelize.query(
      "UPDATE vendorrisks SET risk_severity = 'Minor' WHERE risk_severity = 'Low risk';"
    );
    await queryInterface.sequelize.query(
      "UPDATE vendorrisks SET risk_severity = 'Moderate' WHERE risk_severity = 'Medium risk';"
    );
    await queryInterface.sequelize.query(
      "UPDATE vendorrisks SET risk_severity = 'Major' WHERE risk_severity = 'High risk';"
    );
    await queryInterface.sequelize.query(
      "UPDATE vendorrisks SET risk_severity = 'Catastrophic' WHERE risk_severity = 'Very high risk';"
    );
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_vendorrisks_risk_severity;"
    );
    await queryInterface.sequelize.query(
      "CREATE TYPE enum_vendorrisks_risk_severity AS ENUM ('Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic');"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE vendorrisks ALTER COLUMN risk_severity TYPE enum_vendorrisks_risk_severity USING risk_severity::text::enum_vendorrisks_risk_severity"
    );
    await queryInterface.sequelize.query(
      "DROP TYPE enum_vendorrisks_risk_severity_temp;"
    );
  },

  async down(queryInterface, Sequelize) {
    // emigrate projectrisks:severity type
    await queryInterface.sequelize.query(
      "CREATE TYPE enum_projectrisks_severity_temp AS ENUM ('Negligible', 'Minor', 'Moderate', 'Major', 'Critical', 'Catastrophic');"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE projectrisks ALTER COLUMN severity TYPE enum_projectrisks_severity_temp USING severity::text::enum_projectrisks_severity_temp"
    );
    await queryInterface.sequelize.query(
      "UPDATE projectrisks SET severity = 'Critical' WHERE severity = 'Catastrophic';"
    );
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_projectrisks_severity;"
    );
    await queryInterface.sequelize.query(
      "CREATE TYPE enum_projectrisks_severity AS ENUM ('Negligible', 'Minor', 'Moderate', 'Major', 'Critical');"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE projectrisks ALTER COLUMN severity TYPE enum_projectrisks_severity USING severity::text::enum_projectrisks_severity"
    );
    await queryInterface.sequelize.query(
      "DROP TYPE enum_projectrisks_severity_temp;"
    );

    // emigrate vendorrisks:risk_severity type
    await queryInterface.sequelize.query(
      `CREATE TYPE enum_vendorrisks_risk_severity_temp AS ENUM (
        'Very low risk', 'Low risk', 'Medium risk', 'High risk', 'Very high risk',
        'Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'
      );`
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE vendorrisks ALTER COLUMN risk_severity TYPE enum_vendorrisks_risk_severity_temp USING risk_severity::text::enum_vendorrisks_risk_severity_temp"
    );
    await queryInterface.sequelize.query(
      "UPDATE vendorrisks SET risk_severity = 'Very low risk' WHERE risk_severity = 'Negligible';"
    );
    await queryInterface.sequelize.query(
      "UPDATE vendorrisks SET risk_severity = 'Low risk' WHERE risk_severity = 'Minor';"
    );
    await queryInterface.sequelize.query(
      "UPDATE vendorrisks SET risk_severity = 'Medium risk' WHERE risk_severity = 'Moderate';"
    );
    await queryInterface.sequelize.query(
      "UPDATE vendorrisks SET risk_severity = 'High risk' WHERE risk_severity = 'Major';"
    );
    await queryInterface.sequelize.query(
      "UPDATE vendorrisks SET risk_severity = 'Very high risk' WHERE risk_severity = 'Catastrophic';"
    );
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_vendorrisks_risk_severity;"
    );
    await queryInterface.sequelize.query(
      "CREATE TYPE enum_vendorrisks_risk_severity AS ENUM ('Very low risk', 'Low risk', 'Medium risk', 'High risk', 'Very high risk');"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE vendorrisks ALTER COLUMN risk_severity TYPE enum_vendorrisks_risk_severity USING risk_severity::text::enum_vendorrisks_risk_severity"
    );
    await queryInterface.sequelize.query(
      "DROP TYPE enum_vendorrisks_risk_severity_temp;"
    );
  }
};

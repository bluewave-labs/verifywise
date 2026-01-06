"use strict";

/**
 * Migration to update organization slugs to use unique random identifiers
 * instead of organization names (which can change)
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Generate a random alphanumeric string (8 characters)
    const generateUniqueId = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    // Get all organizations
    const [organizations] = await queryInterface.sequelize.query(
      `SELECT id FROM organizations`
    );

    for (const org of organizations) {
      let uniqueId = generateUniqueId();
      let exists = true;

      // Ensure uniqueness
      while (exists) {
        const [existing] = await queryInterface.sequelize.query(
          `SELECT id FROM organizations WHERE slug = :slug AND id != :orgId`,
          {
            replacements: { slug: uniqueId, orgId: org.id },
            type: Sequelize.QueryTypes.SELECT,
          }
        );

        if (!existing || existing.length === 0) {
          exists = false;
        } else {
          uniqueId = generateUniqueId();
        }
      }

      await queryInterface.sequelize.query(
        `UPDATE organizations SET slug = :slug WHERE id = :orgId`,
        {
          replacements: { slug: uniqueId, orgId: org.id },
        }
      );
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert to name-based slugs
    const [organizations] = await queryInterface.sequelize.query(
      `SELECT id, name FROM organizations`
    );

    for (const org of organizations) {
      let slug = org.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      if (!slug) {
        slug = `org-${org.id}`;
      }

      await queryInterface.sequelize.query(
        `UPDATE organizations SET slug = :slug WHERE id = :orgId`,
        {
          replacements: { slug, orgId: org.id },
        }
      );
    }
  },
};

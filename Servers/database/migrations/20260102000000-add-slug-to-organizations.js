"use strict";

/**
 * Migration to add slug column to organizations table for public intake form URLs
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add slug column to organizations
    await queryInterface.addColumn("organizations", "slug", {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true,
    });

    // Generate slugs for existing organizations based on their name
    const [organizations] = await queryInterface.sequelize.query(
      `SELECT id, name FROM organizations`
    );

    for (const org of organizations) {
      // Create slug from name: lowercase, replace spaces/special chars with dashes
      let slug = org.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // If slug is empty, use org id
      if (!slug) {
        slug = `org-${org.id}`;
      }

      // Make slug unique if needed
      let finalSlug = slug;
      let counter = 1;
      let exists = true;

      while (exists) {
        const [existing] = await queryInterface.sequelize.query(
          `SELECT id FROM organizations WHERE slug = :slug AND id != :orgId`,
          {
            replacements: { slug: finalSlug, orgId: org.id },
            type: Sequelize.QueryTypes.SELECT,
          }
        );

        if (!existing || existing.length === 0) {
          exists = false;
        } else {
          finalSlug = `${slug}-${counter}`;
          counter++;
        }
      }

      await queryInterface.sequelize.query(
        `UPDATE organizations SET slug = :slug WHERE id = :orgId`,
        {
          replacements: { slug: finalSlug, orgId: org.id },
        }
      );
    }

    // After populating, make the column not null
    await queryInterface.changeColumn("organizations", "slug", {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true,
    });

    // Add index for faster lookups
    await queryInterface.addIndex("organizations", ["slug"], {
      unique: true,
      name: "organizations_slug_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("organizations", "organizations_slug_unique");
    await queryInterface.removeColumn("organizations", "slug");
  },
};

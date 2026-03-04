'use strict';

/**
 * NO-OP: The struct/impl split is now handled by
 * 20260303123943-migrate-plugin-framework-data-to-shared-schema.js
 * which migrates tenant data directly into struct tables.
 *
 * Fresh installs get the correct schema from
 * 20260226234301-public-schema-tables.js.
 */

module.exports = {
  async up() {
    console.log('ℹ️  Struct/impl split already handled by 20260303123943. Skipping.');
  },

  async down() {
    console.log('ℹ️  No-op migration, nothing to revert.');
  }
};

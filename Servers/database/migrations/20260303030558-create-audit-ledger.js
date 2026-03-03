'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        // Create audit_ledger table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".audit_ledger (
            id           BIGSERIAL PRIMARY KEY,
            entry_type   VARCHAR(20)  NOT NULL,
            user_id      INTEGER      REFERENCES public.users(id) ON DELETE SET NULL,
            occurred_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            event_type   VARCHAR(20),
            entity_type  VARCHAR(60),
            entity_id    INTEGER,
            action       VARCHAR(20),
            field_name   TEXT,
            old_value    TEXT,
            new_value    TEXT,
            description  TEXT,
            entry_hash   CHAR(64)     NOT NULL,
            prev_hash    CHAR(64)     NOT NULL
          );
        `, { transaction });

        // Create indexes
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_audit_ledger_occurred_at
            ON "${tenantHash}".audit_ledger (occurred_at DESC);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_audit_ledger_user_id
            ON "${tenantHash}".audit_ledger (user_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_audit_ledger_entity
            ON "${tenantHash}".audit_ledger (entity_type, entity_id);
        `, { transaction });

        // Delete-prevention trigger function
        await queryInterface.sequelize.query(`
          CREATE OR REPLACE FUNCTION "${tenantHash}".audit_ledger_prevent_delete()
          RETURNS TRIGGER AS $$
          BEGIN
            RAISE EXCEPTION 'DELETE on audit_ledger is prohibited — append-only table';
          END;
          $$ LANGUAGE plpgsql;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP TRIGGER IF EXISTS trg_audit_ledger_no_delete ON "${tenantHash}".audit_ledger;
          CREATE TRIGGER trg_audit_ledger_no_delete
            BEFORE DELETE ON "${tenantHash}".audit_ledger
            FOR EACH ROW
            EXECUTE FUNCTION "${tenantHash}".audit_ledger_prevent_delete();
        `, { transaction });

        // Update-guard trigger function: only allow sentinel→real hash transition
        await queryInterface.sequelize.query(`
          CREATE OR REPLACE FUNCTION "${tenantHash}".audit_ledger_guard_update()
          RETURNS TRIGGER AS $$
          BEGIN
            -- Only allow changing entry_hash from the sentinel to a valid 64-char hex value
            IF OLD.entry_hash = RPAD('pending', 64, '0')
               AND NEW.entry_hash ~ '^[a-f0-9]{64}$'
               AND OLD.entry_type   = NEW.entry_type
               AND OLD.user_id     IS NOT DISTINCT FROM NEW.user_id
               AND OLD.occurred_at  = NEW.occurred_at
               AND OLD.event_type  IS NOT DISTINCT FROM NEW.event_type
               AND OLD.entity_type IS NOT DISTINCT FROM NEW.entity_type
               AND OLD.entity_id   IS NOT DISTINCT FROM NEW.entity_id
               AND OLD.action      IS NOT DISTINCT FROM NEW.action
               AND OLD.field_name  IS NOT DISTINCT FROM NEW.field_name
               AND OLD.old_value   IS NOT DISTINCT FROM NEW.old_value
               AND OLD.new_value   IS NOT DISTINCT FROM NEW.new_value
               AND OLD.description IS NOT DISTINCT FROM NEW.description
               AND OLD.prev_hash    = NEW.prev_hash
            THEN
              RETURN NEW;
            END IF;

            RAISE EXCEPTION 'UPDATE on audit_ledger is prohibited — only sentinel hash finalization is allowed';
          END;
          $$ LANGUAGE plpgsql;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP TRIGGER IF EXISTS trg_audit_ledger_guard_update ON "${tenantHash}".audit_ledger;
          CREATE TRIGGER trg_audit_ledger_guard_update
            BEFORE UPDATE ON "${tenantHash}".audit_ledger
            FOR EACH ROW
            EXECUTE FUNCTION "${tenantHash}".audit_ledger_guard_update();
        `, { transaction });

        console.log(`Created audit_ledger for tenant ${tenantHash}`);
      }

      await transaction.commit();
      console.log('Migration create-audit-ledger completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration create-audit-ledger failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        await queryInterface.sequelize.query(`
          DROP TRIGGER IF EXISTS trg_audit_ledger_guard_update ON "${tenantHash}".audit_ledger;
          DROP TRIGGER IF EXISTS trg_audit_ledger_no_delete ON "${tenantHash}".audit_ledger;
          DROP FUNCTION IF EXISTS "${tenantHash}".audit_ledger_guard_update();
          DROP FUNCTION IF EXISTS "${tenantHash}".audit_ledger_prevent_delete();
          DROP TABLE IF EXISTS "${tenantHash}".audit_ledger;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

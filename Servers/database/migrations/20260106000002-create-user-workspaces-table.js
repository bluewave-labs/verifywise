'use strict';

/**
 * Migration: Create user_workspaces junction table
 *
 * Creates the user_workspaces table for User-Workspace many-to-many relationship.
 * Implements role-based access control within workspaces.
 *
 * Key columns:
 * - id: Primary key
 * - user_id: Foreign key to users
 * - workspace_id: Foreign key to workspaces
 * - role: User's role (owner, admin, member, viewer)
 * - is_default: Whether this is user's default workspace
 * - joined_at: When the user joined
 * - invited_by: Foreign key to inviting user
 *
 * Indexes:
 * - Composite unique index on (user_id, workspace_id)
 * - Index on user_id for finding user's workspaces
 * - Index on workspace_id for finding workspace members
 * - Index on (user_id, is_default) for finding default workspace
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      -- Create enum type for workspace roles
      DO $$ BEGIN
        CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member', 'viewer');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;

      -- Create the user_workspaces junction table
      CREATE TABLE IF NOT EXISTS user_workspaces (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        role workspace_role NOT NULL DEFAULT 'member',
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        invited_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        -- Unique constraint: user can only belong to a workspace once
        CONSTRAINT user_workspaces_user_workspace_unique UNIQUE (user_id, workspace_id)
      );

      -- Create indexes for performance optimization
      -- Primary lookup indexes
      CREATE INDEX IF NOT EXISTS idx_user_workspaces_user_id 
        ON user_workspaces(user_id);
      
      CREATE INDEX IF NOT EXISTS idx_user_workspaces_workspace_id 
        ON user_workspaces(workspace_id);
      
      -- Composite index for finding user's default workspace
      CREATE INDEX IF NOT EXISTS idx_user_workspaces_user_default 
        ON user_workspaces(user_id, is_default) 
        WHERE is_default = TRUE;
      
      -- Index for finding workspace members by role
      CREATE INDEX IF NOT EXISTS idx_user_workspaces_workspace_role 
        ON user_workspaces(workspace_id, role);
      
      -- Index for invitation tracking
      CREATE INDEX IF NOT EXISTS idx_user_workspaces_invited_by 
        ON user_workspaces(invited_by) 
        WHERE invited_by IS NOT NULL;

      -- Create trigger for auto-updating updated_at
      CREATE OR REPLACE FUNCTION update_user_workspaces_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS set_user_workspaces_updated_at ON user_workspaces;
      CREATE TRIGGER set_user_workspaces_updated_at
      BEFORE UPDATE ON user_workspaces
      FOR EACH ROW
      EXECUTE FUNCTION update_user_workspaces_updated_at();

      -- Create function to ensure only one default workspace per user
      CREATE OR REPLACE FUNCTION ensure_single_default_workspace()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.is_default = TRUE THEN
          -- Unset any existing default for this user
          UPDATE user_workspaces 
          SET is_default = FALSE, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = NEW.user_id 
            AND id != COALESCE(NEW.id, 0) 
            AND is_default = TRUE;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS ensure_single_default_workspace_trigger ON user_workspaces;
      CREATE TRIGGER ensure_single_default_workspace_trigger
      BEFORE INSERT OR UPDATE ON user_workspaces
      FOR EACH ROW
      EXECUTE FUNCTION ensure_single_default_workspace();

      -- Add comments for documentation
      COMMENT ON TABLE user_workspaces IS 'Junction table for User-Workspace many-to-many relationship with role-based access control';
      COMMENT ON COLUMN user_workspaces.role IS 'User role in workspace: owner (full control), admin (manage members/settings), member (edit content), viewer (read-only)';
      COMMENT ON COLUMN user_workspaces.is_default IS 'Whether this is the user''s default workspace (only one per user)';
      COMMENT ON COLUMN user_workspaces.invited_by IS 'User who invited this member to the workspace';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      -- Drop triggers first
      DROP TRIGGER IF EXISTS ensure_single_default_workspace_trigger ON user_workspaces;
      DROP TRIGGER IF EXISTS set_user_workspaces_updated_at ON user_workspaces;
      
      -- Drop functions
      DROP FUNCTION IF EXISTS ensure_single_default_workspace();
      DROP FUNCTION IF EXISTS update_user_workspaces_updated_at();
      
      -- Drop indexes
      DROP INDEX IF EXISTS idx_user_workspaces_invited_by;
      DROP INDEX IF EXISTS idx_user_workspaces_workspace_role;
      DROP INDEX IF EXISTS idx_user_workspaces_user_default;
      DROP INDEX IF EXISTS idx_user_workspaces_workspace_id;
      DROP INDEX IF EXISTS idx_user_workspaces_user_id;
      
      -- Drop table
      DROP TABLE IF EXISTS user_workspaces;
      
      -- Drop enum type
      DROP TYPE IF EXISTS workspace_role;
    `);
  }
};

import { sequelize } from "../database/db";

interface InvitationRow {
  id: number;
  email: string;
  name: string;
  surname: string;
  role_id: number;
  organization_id: number;
  status: string;
  invited_by: number;
  created_at: string;
  expires_at: string;
  updated_at: string;
  role_name?: string;
}

/**
 * Create or update an invitation record.
 * Uses ON CONFLICT with partial unique index (email, organization_id) WHERE status='pending'.
 */
export const createInvitationQuery = async (
  email: string,
  name: string,
  surname: string,
  roleId: number,
  organizationId: number,
  invitedBy: number,
  expiresAt: Date
): Promise<InvitationRow> => {
  const result = (await sequelize.query(
    `INSERT INTO invitations (email, name, surname, role_id, organization_id, status, invited_by, expires_at)
     VALUES (:email, :name, :surname, :roleId, :organizationId, 'pending', :invitedBy, :expiresAt)
     ON CONFLICT (email, organization_id) WHERE status = 'pending'
     DO UPDATE SET
       name = EXCLUDED.name,
       surname = EXCLUDED.surname,
       role_id = EXCLUDED.role_id,
       invited_by = EXCLUDED.invited_by,
       expires_at = EXCLUDED.expires_at,
       created_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    {
      replacements: {
        email,
        name,
        surname,
        roleId,
        organizationId,
        invitedBy,
        expiresAt: expiresAt.toISOString(),
      },
    }
  )) as [InvitationRow[], number];

  return result[0][0];
};

/**
 * Get all pending invitations for an organization, joined with role name.
 */
export const getInvitationsByOrgQuery = async (
  organizationId: number
): Promise<InvitationRow[]> => {
  const result = (await sequelize.query(
    `SELECT i.*, r.name AS role_name
     FROM invitations i
     LEFT JOIN roles r ON r.id = i.role_id
     WHERE i.organization_id = :organizationId AND i.status = 'pending'
     ORDER BY i.created_at DESC`,
    { replacements: { organizationId } }
  )) as [InvitationRow[], number];

  return result[0];
};

/**
 * Get a single invitation by id and org.
 */
export const getInvitationByIdQuery = async (
  id: number,
  organizationId: number
): Promise<InvitationRow | null> => {
  const result = (await sequelize.query(
    `SELECT i.*, r.name AS role_name
     FROM invitations i
     LEFT JOIN roles r ON r.id = i.role_id
     WHERE i.id = :id AND i.organization_id = :organizationId AND i.status = 'pending'`,
    { replacements: { id, organizationId } }
  )) as [InvitationRow[], number];

  return result[0][0] || null;
};

/**
 * Revoke (delete) an invitation.
 */
export const revokeInvitationQuery = async (
  id: number,
  organizationId: number
): Promise<boolean> => {
  const result = (await sequelize.query(
    `DELETE FROM invitations
     WHERE id = :id AND organization_id = :organizationId AND status = 'pending'
     RETURNING id`,
    { replacements: { id, organizationId } }
  )) as [InvitationRow[], number];

  return result[0].length > 0;
};

/**
 * Mark invitation as accepted when user registers via invite link.
 */
export const markInvitationAcceptedQuery = async (
  email: string,
  organizationId: number
): Promise<void> => {
  await sequelize.query(
    `UPDATE invitations
     SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
     WHERE email = :email AND organization_id = :organizationId AND status = 'pending'`,
    { replacements: { email, organizationId } }
  );
};

/**
 * Update invitation expiry after resend.
 */
export const updateInvitationExpiryQuery = async (
  id: number,
  expiresAt: Date
): Promise<void> => {
  await sequelize.query(
    `UPDATE invitations
     SET created_at = CURRENT_TIMESTAMP, expires_at = :expiresAt, updated_at = CURRENT_TIMESTAMP
     WHERE id = :id`,
    { replacements: { id, expiresAt: expiresAt.toISOString() } }
  );
};

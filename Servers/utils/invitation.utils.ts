import { sequelize } from "../database/db";

interface InvitationRow {
  id: number;
  email: string;
  name: string;
  surname: string;
  role_id: number;
  status: string;
  invited_by: number;
  created_at: string;
  expires_at: string;
  updated_at: string;
  role_name?: string;
}

/**
 * Create or update an invitation record.
 * Uses ON CONFLICT with partial unique index (email) WHERE status='pending'.
 */
export const createInvitationQuery = async (
  tenant: string,
  email: string,
  name: string,
  surname: string,
  roleId: number,
  invitedBy: number,
  expiresAt: Date
): Promise<InvitationRow> => {
  const result = (await sequelize.query(
    `INSERT INTO "${tenant}".invitations (email, name, surname, role_id, status, invited_by, expires_at)
     VALUES (:email, :name, :surname, :roleId, 'pending', :invitedBy, :expiresAt)
     ON CONFLICT (email) WHERE status = 'pending'
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
        invitedBy,
        expiresAt: expiresAt.toISOString(),
      },
    }
  )) as [InvitationRow[], number];

  return result[0][0];
};

/**
 * Get all pending invitations for a tenant, joined with role name.
 */
export const getInvitationsByTenantQuery = async (
  tenant: string
): Promise<InvitationRow[]> => {
  const result = (await sequelize.query(
    `SELECT i.id, i.email, i.name, i.surname, i.role_id, i.status, i.invited_by,
            to_char(i.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
            to_char(i.expires_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS expires_at,
            i.updated_at,
            r.name AS role_name
     FROM "${tenant}".invitations i
     LEFT JOIN public.roles r ON r.id = i.role_id
     WHERE i.status = 'pending'
     ORDER BY i.created_at DESC`,
  )) as [InvitationRow[], number];

  return result[0];
};

/**
 * Get a single invitation by id.
 */
export const getInvitationByIdQuery = async (
  tenant: string,
  id: number
): Promise<InvitationRow | null> => {
  const result = (await sequelize.query(
    `SELECT i.*, r.name AS role_name
     FROM "${tenant}".invitations i
     LEFT JOIN public.roles r ON r.id = i.role_id
     WHERE i.id = :id AND i.status = 'pending'`,
    { replacements: { id } }
  )) as [InvitationRow[], number];

  return result[0][0] || null;
};

/**
 * Revoke (delete) an invitation.
 */
export const revokeInvitationQuery = async (
  tenant: string,
  id: number
): Promise<boolean> => {
  const result = (await sequelize.query(
    `DELETE FROM "${tenant}".invitations
     WHERE id = :id AND status = 'pending'
     RETURNING id`,
    { replacements: { id } }
  )) as [InvitationRow[], number];

  return result[0].length > 0;
};

/**
 * Mark invitation as accepted when user registers via invite link.
 */
export const markInvitationAcceptedQuery = async (
  tenant: string,
  email: string
): Promise<void> => {
  await sequelize.query(
    `UPDATE "${tenant}".invitations
     SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
     WHERE email = :email AND status = 'pending'`,
    { replacements: { email } }
  );
};

/**
 * Update invitation expiry after resend.
 */
export const updateInvitationExpiryQuery = async (
  tenant: string,
  id: number,
  expiresAt: Date
): Promise<void> => {
  await sequelize.query(
    `UPDATE "${tenant}".invitations
     SET created_at = CURRENT_TIMESTAMP, expires_at = :expiresAt, updated_at = CURRENT_TIMESTAMP
     WHERE id = :id`,
    { replacements: { id, expiresAt: expiresAt.toISOString() } }
  );
};

/**
 * Check if a pending invitation exists for the given email.
 * Used during registration to verify the invitation wasn't revoked.
 */
export const checkPendingInvitationQuery = async (
  tenant: string,
  email: string
): Promise<boolean> => {
  const result = (await sequelize.query(
    `SELECT id FROM "${tenant}".invitations
     WHERE email = :email AND status = 'pending'
     LIMIT 1`,
    { replacements: { email } }
  )) as [InvitationRow[], number];

  return result[0].length > 0;
};

import { apiServices } from "../../infrastructure/api/networkServices";

export interface Invitation {
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

interface InvitationsResponse {
  invitations: Invitation[];
}

export async function getInvitations(): Promise<InvitationsResponse> {
  const response = await apiServices.get("/invitations");
  return response.data;
}

export async function revokeInvitation(id: number) {
  return apiServices.delete(`/invitations/${id}`);
}

export async function resendInvitation(id: number) {
  return apiServices.post(`/invitations/${id}/resend`);
}

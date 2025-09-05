import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

export interface SubscriptionPayload {
  organization_id: number;
  tier_id: number;
  stripe_sub_id: string;
  status: string;
  start_date?: Date;
  end_date?: Date | null;
}

export async function getSubscription({
  authToken = getAuthToken(),
}: {
  authToken?: string;
}) {
  try {
    const response = await apiServices.get("/subscriptions/", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error: any) {
    if (error?.message === "Not Found") {
      return [];
    }
    throw error;
  }
}

export async function createSubscription({
  payload,
  authToken = getAuthToken(),
}: {
  payload: SubscriptionPayload;
  authToken?: string;
}) {
  const response = await apiServices.post("/subscriptions", payload, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response.data;
}

export async function updateSubscription({
  id,
  payload,
  authToken = getAuthToken(),
}: {
  id: number;
  payload: SubscriptionPayload;
  authToken?: string;
}) {
  const response = await apiServices.put(`/subscriptions/${id}`, payload, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response.data;
}

/**
 * Creates or updates a subscription based on whether one already exists
 * @param params - The parameters for subscription management
 * @returns Promise<{ success: boolean; data?: any; error?: string }>
 */
export async function upsertSubscription({
  organizationId,
  tierId,
  sessionId,
  authToken = getAuthToken(),
}: {
  organizationId: number;
  tierId: number;
  sessionId: string;
  authToken?: string;
}): Promise<{ success: boolean; data?: unknown; tierId?: number; error?: string }> {
  try {
    const existingSubscriptions : any = await getSubscription({ authToken });
    
    const subscriptionPayload: SubscriptionPayload = {
      organization_id: organizationId,
      tier_id: tierId,
      stripe_sub_id: sessionId,
      status: "active",
      start_date: new Date(),
      end_date: new Date(new Date().setDate(new Date().getDate() + 30)),
    };

    let result;
    if (existingSubscriptions && existingSubscriptions.data[0]) {
      result = await updateSubscription({
        id: existingSubscriptions.data[0].id,
        payload: subscriptionPayload,
        authToken,
      });
    } else {
      result = await createSubscription({
        payload: subscriptionPayload,
        authToken,
      });
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to upsert subscription:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}
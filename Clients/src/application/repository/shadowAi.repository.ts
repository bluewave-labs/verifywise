import { apiServices } from "../../infrastructure/api/networkServices";

const BASE = "/shadow-ai";

// ==================== Connectors ====================

export async function getConnectors({ signal }: { signal?: AbortSignal } = {}) {
  const response = await apiServices.get(`${BASE}/connectors`, { signal });
  return response.data;
}

export async function getConnectorById({ id, signal }: { id: number; signal?: AbortSignal }) {
  const response = await apiServices.get(`${BASE}/connectors/${id}`, { signal });
  return response.data;
}

export async function createConnector({ body }: { body: any }) {
  const response = await apiServices.post(`${BASE}/connectors`, body);
  return response.data;
}

export async function updateConnector({ id, body }: { id: number; body: any }) {
  const response = await apiServices.patch(`${BASE}/connectors/${id}`, body);
  return response.data;
}

export async function deleteConnector({ id }: { id: number }) {
  const response = await apiServices.delete(`${BASE}/connectors/${id}`);
  return response.data;
}

export async function testConnector({ id }: { id: number }) {
  const response = await apiServices.post(`${BASE}/connectors/${id}/test`, {});
  return response.data;
}

export async function syncConnector({ id }: { id: number }) {
  const response = await apiServices.post(`${BASE}/connectors/${id}/sync`, {});
  return response.data;
}

// ==================== Events ====================

export async function getEvents({ filters, signal }: { filters?: any; signal?: AbortSignal } = {}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
  }
  const response = await apiServices.get(`${BASE}/events?${params.toString()}`, { signal });
  return response.data;
}

export async function ingestEvents({ body }: { body: any }) {
  const response = await apiServices.post(`${BASE}/events/ingest`, body);
  return response.data;
}

// ==================== Inventory ====================

export async function getInventory({ filters, signal }: { filters?: any; signal?: AbortSignal } = {}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
  }
  const response = await apiServices.get(`${BASE}/inventory?${params.toString()}`, { signal });
  return response.data;
}

export async function getInventoryById({ id, signal }: { id: number; signal?: AbortSignal }) {
  const response = await apiServices.get(`${BASE}/inventory/${id}`, { signal });
  return response.data;
}

export async function updateInventoryItem({ id, body }: { id: number; body: any }) {
  const response = await apiServices.patch(`${BASE}/inventory/${id}`, body);
  return response.data;
}

// ==================== Policies ====================

export async function getPolicies({ signal }: { signal?: AbortSignal } = {}) {
  const response = await apiServices.get(`${BASE}/policies`, { signal });
  return response.data;
}

export async function getPolicyById({ id, signal }: { id: number; signal?: AbortSignal }) {
  const response = await apiServices.get(`${BASE}/policies/${id}`, { signal });
  return response.data;
}

export async function createPolicy({ body }: { body: any }) {
  const response = await apiServices.post(`${BASE}/policies`, body);
  return response.data;
}

export async function updatePolicy({ id, body }: { id: number; body: any }) {
  const response = await apiServices.patch(`${BASE}/policies/${id}`, body);
  return response.data;
}

export async function deletePolicyApi({ id }: { id: number }) {
  const response = await apiServices.delete(`${BASE}/policies/${id}`);
  return response.data;
}

// ==================== Violations ====================

export async function getViolations({ filters, signal }: { filters?: any; signal?: AbortSignal } = {}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
  }
  const response = await apiServices.get(`${BASE}/violations?${params.toString()}`, { signal });
  return response.data;
}

export async function updateViolation({ id, body }: { id: number; body: any }) {
  const response = await apiServices.patch(`${BASE}/violations/${id}`, body);
  return response.data;
}

// ==================== Exceptions ====================

export async function getExceptions({ filters, signal }: { filters?: any; signal?: AbortSignal } = {}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
  }
  const response = await apiServices.get(`${BASE}/exceptions?${params.toString()}`, { signal });
  return response.data;
}

export async function createException({ body }: { body: any }) {
  const response = await apiServices.post(`${BASE}/exceptions`, body);
  return response.data;
}

export async function updateException({ id, body }: { id: number; body: any }) {
  const response = await apiServices.patch(`${BASE}/exceptions/${id}`, body);
  return response.data;
}

// ==================== Reviews ====================

export async function getReviews({ filters, signal }: { filters?: any; signal?: AbortSignal } = {}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
  }
  const response = await apiServices.get(`${BASE}/reviews?${params.toString()}`, { signal });
  return response.data;
}

export async function createReview({ body }: { body: any }) {
  const response = await apiServices.post(`${BASE}/reviews`, body);
  return response.data;
}

export async function updateReview({ id, body }: { id: number; body: any }) {
  const response = await apiServices.patch(`${BASE}/reviews/${id}`, body);
  return response.data;
}

// ==================== Evidence ====================

export async function getEvidenceExports({ signal }: { signal?: AbortSignal } = {}) {
  const response = await apiServices.get(`${BASE}/evidence`, { signal });
  return response.data;
}

export async function createEvidenceExport({ body }: { body: any }) {
  const response = await apiServices.post(`${BASE}/evidence/export`, body);
  return response.data;
}

// ==================== Dashboard ====================

export async function getDashboardSummary({ signal }: { signal?: AbortSignal } = {}) {
  const response = await apiServices.get(`${BASE}/dashboard/summary`, { signal });
  return response.data;
}

export async function getDashboardTrends({ days, signal }: { days?: number; signal?: AbortSignal } = {}) {
  const response = await apiServices.get(`${BASE}/dashboard/trends?days=${days || 30}`, { signal });
  return response.data;
}

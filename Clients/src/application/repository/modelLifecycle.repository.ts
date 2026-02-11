/**
 * Model Lifecycle Repository
 *
 * API calls for lifecycle config (phases/items) and per-model lifecycle data.
 */

import { apiServices } from "../../infrastructure/api/networkServices";
import {
  LifecyclePhase,
  LifecycleItem,
  LifecycleValue,
  LifecycleProgress,
  CreatePhaseInput,
  UpdatePhaseInput,
  CreateItemInput,
  UpdateItemInput,
  UpsertValueInput,
} from "../../domain/interfaces/i.modelLifecycle";

// ============================================================================
// Config endpoints (phases & items)
// ============================================================================

export async function getLifecycleConfig(
  includeInactive = false
): Promise<LifecyclePhase[]> {
  try {
    const params = includeInactive ? { includeInactive: "true" } : {};
    const response = await apiServices.get<Record<string, unknown>>("/model-lifecycle/config", { params });
    return (response.data?.data ?? response.data) as LifecyclePhase[];
  } catch (error) {
    console.error("Error fetching lifecycle config:", error);
    throw error;
  }
}

export async function createPhase(data: CreatePhaseInput): Promise<LifecyclePhase> {
  try {
    const response = await apiServices.post<Record<string, unknown>>("/model-lifecycle/phases", data);
    return (response.data?.data ?? response.data) as LifecyclePhase;
  } catch (error) {
    console.error("Error creating lifecycle phase:", error);
    throw error;
  }
}

export async function updatePhase(
  phaseId: number,
  data: UpdatePhaseInput
): Promise<LifecyclePhase> {
  try {
    const response = await apiServices.patch<Record<string, unknown>>(`/model-lifecycle/phases/${phaseId}`, data);
    return (response.data?.data ?? response.data) as LifecyclePhase;
  } catch (error) {
    console.error("Error updating lifecycle phase:", error);
    throw error;
  }
}

export async function deletePhase(phaseId: number): Promise<void> {
  try {
    await apiServices.delete(`/model-lifecycle/phases/${phaseId}`);
  } catch (error) {
    console.error("Error deleting lifecycle phase:", error);
    throw error;
  }
}

export async function reorderPhases(orderedIds: number[]): Promise<void> {
  try {
    await apiServices.patch("/model-lifecycle/phases/reorder", { orderedIds });
  } catch (error) {
    console.error("Error reordering lifecycle phases:", error);
    throw error;
  }
}

export async function createItem(
  phaseId: number,
  data: CreateItemInput
): Promise<any> {
  try {
    const response = await apiServices.post<Record<string, unknown>>(
      `/model-lifecycle/phases/${phaseId}/items`,
      data
    );
    return (response.data?.data ?? response.data) as LifecycleItem;
  } catch (error) {
    console.error("Error creating lifecycle item:", error);
    throw error;
  }
}

export async function updateItem(
  itemId: number,
  data: UpdateItemInput
): Promise<any> {
  try {
    const response = await apiServices.patch<Record<string, unknown>>(`/model-lifecycle/items/${itemId}`, data);
    return (response.data?.data ?? response.data) as LifecycleItem;
  } catch (error) {
    console.error("Error updating lifecycle item:", error);
    throw error;
  }
}

export async function deleteItem(itemId: number): Promise<void> {
  try {
    await apiServices.delete(`/model-lifecycle/items/${itemId}`);
  } catch (error) {
    console.error("Error deleting lifecycle item:", error);
    throw error;
  }
}

export async function reorderItems(
  phaseId: number,
  orderedIds: number[]
): Promise<void> {
  try {
    await apiServices.patch(`/model-lifecycle/phases/${phaseId}/items/reorder`, {
      orderedIds,
    });
  } catch (error) {
    console.error("Error reordering lifecycle items:", error);
    throw error;
  }
}

// ============================================================================
// Per-model lifecycle data endpoints
// ============================================================================

export async function getModelLifecycle(
  modelId: number
): Promise<LifecyclePhase[]> {
  try {
    const response = await apiServices.get<Record<string, unknown>>(`/modelInventory/${modelId}/lifecycle`);
    return (response.data?.data ?? response.data) as LifecyclePhase[];
  } catch (error) {
    console.error("Error fetching model lifecycle:", error);
    throw error;
  }
}

export async function upsertItemValue(
  modelId: number,
  itemId: number,
  data: UpsertValueInput
): Promise<any> {
  try {
    const response = await apiServices.put<Record<string, unknown>>(
      `/modelInventory/${modelId}/lifecycle/items/${itemId}`,
      data
    );
    return (response.data?.data ?? response.data) as LifecycleValue;
  } catch (error) {
    console.error("Error upserting lifecycle value:", error);
    throw error;
  }
}

export async function addFileToItem(
  modelId: number,
  itemId: number,
  fileId: number
): Promise<any> {
  try {
    const response = await apiServices.post<Record<string, unknown>>(
      `/modelInventory/${modelId}/lifecycle/items/${itemId}/files`,
      { fileId }
    );
    return (response.data?.data ?? response.data) as LifecycleValue;
  } catch (error) {
    console.error("Error adding file to lifecycle item:", error);
    throw error;
  }
}

export async function removeFileFromItem(
  modelId: number,
  itemId: number,
  fileId: number
): Promise<void> {
  try {
    await apiServices.delete(
      `/modelInventory/${modelId}/lifecycle/items/${itemId}/files/${fileId}`
    );
  } catch (error) {
    console.error("Error removing file from lifecycle item:", error);
    throw error;
  }
}

export async function getLifecycleProgress(
  modelId: number
): Promise<LifecycleProgress> {
  try {
    const response = await apiServices.get<Record<string, unknown>>(
      `/modelInventory/${modelId}/lifecycle/progress`
    );
    return (response.data?.data ?? response.data) as LifecycleProgress;
  } catch (error) {
    console.error("Error fetching lifecycle progress:", error);
    throw error;
  }
}

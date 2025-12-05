/**
 * @fileoverview Entity Graph User Data Repository
 *
 * Data access layer for Entity Graph user-specific data operations.
 * Handles all API calls for annotations, saved views, and gap rules.
 *
 * @module repository/entityGraphUserData
 */

import { apiServices } from "../../infrastructure/api/networkServices";
import { APIError } from "../tools/error";

// ============================================
// Type Definitions
// ============================================

/**
 * Interface for Entity Graph Annotation
 */
export interface EntityGraphAnnotation {
  id?: number;
  content: string;
  user_id?: number;
  entity_type: string;
  entity_id: string;
  organization_id?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface for Entity Graph View Config
 */
export interface EntityGraphViewConfig {
  visibleEntities?: string[];
  visibleRelationships?: string[];
  showProblemsOnly?: boolean;
  showGapsOnly?: boolean;
  query?: {
    entityType: string;
    condition: string;
    attribute: string;
  } | null;
}

/**
 * Interface for Entity Graph Saved View
 */
export interface EntityGraphView {
  id?: number;
  name: string;
  user_id?: number;
  organization_id?: number;
  config: EntityGraphViewConfig;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface for Gap Rule
 */
export interface GapRule {
  entityType: 'model' | 'risk' | 'control' | 'vendor' | 'useCase';
  requirement: string;
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
}

/**
 * Interface for Entity Graph Gap Rules
 */
export interface EntityGraphGapRules {
  id?: number;
  user_id?: number;
  organization_id?: number;
  rules: GapRule[];
  isDefault?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Extract data from API response
 */
function extractData<T>(response: { data: { data?: T; message?: string } }): T {
  if (response?.data?.data !== undefined) {
    return response.data.data;
  }
  if (response?.data && !response.data.message) {
    return response.data as T;
  }
  return [] as T;
}

// ============================================
// Annotations API
// ============================================

/**
 * Get all annotations for the current user
 */
export async function getAnnotations(): Promise<EntityGraphAnnotation[]> {
  try {
    const response = await apiServices.get<{ message: string; data: EntityGraphAnnotation[] }>(
      "/entity-graph/annotations"
    );
    const annotations = extractData<EntityGraphAnnotation[]>(response);
    return Array.isArray(annotations) ? annotations : [];
  } catch (error: any) {
    if (error?.response?.status === 204) {
      return [];
    }
    throw new APIError(
      "Failed to fetch annotations",
      error?.response?.status,
      error
    );
  }
}

/**
 * Get annotation for a specific entity
 */
export async function getAnnotationByEntity(
  entityType: string,
  entityId: string
): Promise<EntityGraphAnnotation | null> {
  try {
    const response = await apiServices.get<{ message: string; data: EntityGraphAnnotation | null }>(
      `/entity-graph/annotations/${entityType}/${entityId}`
    );
    return extractData<EntityGraphAnnotation | null>(response);
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 204) {
      return null;
    }
    throw new APIError(
      "Failed to fetch annotation",
      error?.response?.status,
      error
    );
  }
}

/**
 * Save (create or update) an annotation
 */
export async function saveAnnotation(
  content: string,
  entityType: string,
  entityId: string
): Promise<EntityGraphAnnotation> {
  try {
    const response = await apiServices.post<{ message: string; data: EntityGraphAnnotation }>(
      "/entity-graph/annotations",
      {
        content,
        entity_type: entityType,
        entity_id: entityId,
      }
    );
    return extractData<EntityGraphAnnotation>(response);
  } catch (error: any) {
    throw new APIError(
      "Failed to save annotation",
      error?.response?.status,
      error
    );
  }
}

/**
 * Delete an annotation by ID
 */
export async function deleteAnnotation(annotationId: number): Promise<void> {
  try {
    await apiServices.delete(`/entity-graph/annotations/${annotationId}`);
  } catch (error: any) {
    throw new APIError(
      "Failed to delete annotation",
      error?.response?.status,
      error
    );
  }
}

/**
 * Delete annotation by entity
 */
export async function deleteAnnotationByEntity(
  entityType: string,
  entityId: string
): Promise<void> {
  try {
    await apiServices.delete(`/entity-graph/annotations/entity/${entityType}/${entityId}`);
  } catch (error: any) {
    throw new APIError(
      "Failed to delete annotation",
      error?.response?.status,
      error
    );
  }
}

// ============================================
// Saved Views API
// ============================================

/**
 * Get all saved views for the current user
 */
export async function getViews(): Promise<EntityGraphView[]> {
  try {
    const response = await apiServices.get<{ message: string; data: EntityGraphView[] }>(
      "/entity-graph/views"
    );
    const views = extractData<EntityGraphView[]>(response);
    return Array.isArray(views) ? views : [];
  } catch (error: any) {
    if (error?.response?.status === 204) {
      return [];
    }
    throw new APIError(
      "Failed to fetch views",
      error?.response?.status,
      error
    );
  }
}

/**
 * Get a specific view by ID
 */
export async function getViewById(viewId: number): Promise<EntityGraphView | null> {
  try {
    const response = await apiServices.get<{ message: string; data: EntityGraphView }>(
      `/entity-graph/views/${viewId}`
    );
    return extractData<EntityGraphView>(response);
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw new APIError(
      "Failed to fetch view",
      error?.response?.status,
      error
    );
  }
}

/**
 * Create a new saved view
 */
export async function createView(
  name: string,
  config: EntityGraphViewConfig
): Promise<EntityGraphView> {
  try {
    const response = await apiServices.post<{ message: string; data: EntityGraphView }>(
      "/entity-graph/views",
      { name, config }
    );
    return extractData<EntityGraphView>(response);
  } catch (error: any) {
    throw new APIError(
      "Failed to create view",
      error?.response?.status,
      error
    );
  }
}

/**
 * Update a saved view
 */
export async function updateView(
  viewId: number,
  name?: string,
  config?: EntityGraphViewConfig
): Promise<EntityGraphView> {
  try {
    const response = await apiServices.put<{ message: string; data: EntityGraphView }>(
      `/entity-graph/views/${viewId}`,
      { name, config }
    );
    return extractData<EntityGraphView>(response);
  } catch (error: any) {
    throw new APIError(
      "Failed to update view",
      error?.response?.status,
      error
    );
  }
}

/**
 * Delete a saved view
 */
export async function deleteView(viewId: number): Promise<void> {
  try {
    await apiServices.delete(`/entity-graph/views/${viewId}`);
  } catch (error: any) {
    throw new APIError(
      "Failed to delete view",
      error?.response?.status,
      error
    );
  }
}

// ============================================
// Gap Rules API
// ============================================

/**
 * Get gap rules for the current user (or defaults if none set)
 */
export async function getGapRules(): Promise<EntityGraphGapRules> {
  try {
    const response = await apiServices.get<{ message: string; data: EntityGraphGapRules }>(
      "/entity-graph/gap-rules"
    );
    return extractData<EntityGraphGapRules>(response);
  } catch (error: any) {
    throw new APIError(
      "Failed to fetch gap rules",
      error?.response?.status,
      error
    );
  }
}

/**
 * Get default gap rules
 */
export async function getDefaultGapRules(): Promise<EntityGraphGapRules> {
  try {
    const response = await apiServices.get<{ message: string; data: EntityGraphGapRules }>(
      "/entity-graph/gap-rules/defaults"
    );
    return extractData<EntityGraphGapRules>(response);
  } catch (error: any) {
    throw new APIError(
      "Failed to fetch default gap rules",
      error?.response?.status,
      error
    );
  }
}

/**
 * Save gap rules
 */
export async function saveGapRules(rules: GapRule[]): Promise<EntityGraphGapRules> {
  try {
    const response = await apiServices.post<{ message: string; data: EntityGraphGapRules }>(
      "/entity-graph/gap-rules",
      { rules }
    );
    return extractData<EntityGraphGapRules>(response);
  } catch (error: any) {
    throw new APIError(
      "Failed to save gap rules",
      error?.response?.status,
      error
    );
  }
}

/**
 * Reset gap rules to defaults
 */
export async function resetGapRules(): Promise<EntityGraphGapRules> {
  try {
    const response = await apiServices.delete<{ message: string; data: EntityGraphGapRules }>(
      "/entity-graph/gap-rules"
    );
    return extractData<EntityGraphGapRules>(response);
  } catch (error: any) {
    throw new APIError(
      "Failed to reset gap rules",
      error?.response?.status,
      error
    );
  }
}

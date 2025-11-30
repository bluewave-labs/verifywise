/**
 * @fileoverview Wise Search Service
 *
 * Provides API integration for the Wise Search feature.
 * Searches across all database entities with multi-tenant isolation.
 *
 * @module infrastructure/api/searchService
 */

import CustomAxios from "./customAxios";

/**
 * Individual search result
 */
export interface SearchResult {
  id: number;
  entityType: string;
  title: string;
  subtitle?: string;
  matchedField: string;
  matchedValue: string;
  route: string;
  icon?: string;
}

/**
 * Grouped search results by entity type
 */
export interface GroupedSearchResults {
  [entityType: string]: {
    results: SearchResult[];
    count: number;
    icon: string;
  };
}

/**
 * Search API response
 */
export interface SearchResponse {
  data: {
    results: GroupedSearchResults;
    totalCount: number;
    query: string;
    message?: string;
  };
}

/**
 * Search API parameters
 */
export interface SearchParams {
  q: string;
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}

/**
 * Perform a Wise Search across all entities
 *
 * @param params - Search parameters
 * @returns Promise resolving to grouped search results
 */
export async function wiseSearch(params: SearchParams): Promise<SearchResponse> {
  const response = await CustomAxios.get<SearchResponse>("/search", {
    params: {
      q: params.q,
      limit: params.limit || 20,
      offset: params.offset || 0,
    },
    signal: params.signal,
  });

  return response.data;
}

/**
 * Entity type to display name mapping
 */
export const ENTITY_DISPLAY_NAMES: Record<string, string> = {
  projects: "Use cases",
  tasks: "Tasks",
  vendors: "Vendors",
  vendor_risks: "Vendor risks",
  model_inventories: "Model inventory",
  evidence_hub: "Evidence hub",
  project_risks: "Risks",
  file_manager: "Files",
  policy_manager: "Policies",
  policy_templates: "Policy templates",
  ai_trust_center_resources: "Trust center resources",
  ai_trust_center_subprocessors: "Subprocessors",
  training_registar: "Training",
  incident_management: "Incidents",
};

/**
 * Get display name for entity type
 */
export function getEntityDisplayName(entityType: string): string {
  return ENTITY_DISPLAY_NAMES[entityType] || entityType.replace(/_/g, " ");
}

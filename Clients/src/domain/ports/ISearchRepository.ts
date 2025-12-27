/**
 * Search Repository Interface
 *
 * Defines the contract for search operations across entities.
 */

/**
 * Individual search result
 */
export interface SearchResult {
  id: number | string;
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
 * Search response
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
 * Search parameters
 */
export interface SearchParams {
  q: string;
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}

/**
 * Search Repository Interface
 */
export interface ISearchRepository {
  /**
   * Perform a wise search across all entities
   */
  search(params: SearchParams): Promise<SearchResponse>;

  /**
   * Get display name for entity type
   */
  getEntityDisplayName(entityType: string): string;
}

/**
 * Organization Repository Interface
 *
 * Defines the contract for organization data access operations.
 */

/**
 * Organization entity
 */
export interface Organization {
  id: number;
  name: string;
  logo?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Data for creating an organization
 */
export interface CreateOrganizationDTO {
  name: string;
  logo?: string;
}

/**
 * Data for updating an organization
 */
export interface UpdateOrganizationDTO {
  name?: string;
  logo?: string;
}

/**
 * Organization Repository Interface
 */
export interface IOrganizationRepository {
  /**
   * Get the current user's organization
   */
  getMyOrganization(options?: {
    routeUrl: string;
    signal?: AbortSignal;
    responseType?: string;
  }): Promise<Organization>;

  /**
   * Create a new organization
   */
  create(data: CreateOrganizationDTO): Promise<Organization>;

  /**
   * Update the current organization
   */
  update(data: UpdateOrganizationDTO, headers?: Record<string, string>): Promise<Organization>;

  /**
   * Check if any organization exists
   */
  checkExists(): Promise<boolean>;
}

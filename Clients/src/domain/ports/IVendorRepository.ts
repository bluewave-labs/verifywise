/**
 * Vendor Repository Interface
 *
 * Defines the contract for vendor data access operations.
 */

/**
 * Vendor entity
 */
export interface Vendor {
  id: number;
  name: string;
  website?: string;
  project_id?: number;
  contact_person?: string;
  review_status?: string;
  reviewer?: number;
  review_result?: string;
  risk_status?: string;
  assignee?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Data for creating a vendor
 */
export interface CreateVendorDTO {
  name: string;
  website?: string;
  project_id?: number;
  contact_person?: string;
  review_status?: string;
  reviewer?: number;
  risk_status?: string;
  assignee?: number;
}

/**
 * Data for updating a vendor
 */
export interface UpdateVendorDTO {
  name?: string;
  website?: string;
  contact_person?: string;
  review_status?: string;
  reviewer?: number;
  review_result?: string;
  risk_status?: string;
  assignee?: number;
}

/**
 * Vendor Repository Interface
 */
export interface IVendorRepository {
  /**
   * Get all vendors
   */
  getAll(options?: { signal?: AbortSignal }): Promise<Vendor[]>;

  /**
   * Get a vendor by ID
   */
  getById(id: number, options?: { signal?: AbortSignal }): Promise<Vendor>;

  /**
   * Get vendors by project ID
   */
  getByProjectId(projectId: number, options?: { signal?: AbortSignal }): Promise<Vendor[]>;

  /**
   * Create a new vendor
   */
  create(data: CreateVendorDTO): Promise<Vendor>;

  /**
   * Update a vendor
   */
  update(id: number, data: UpdateVendorDTO): Promise<Vendor>;

  /**
   * Delete a vendor
   */
  delete(id: number): Promise<void>;
}

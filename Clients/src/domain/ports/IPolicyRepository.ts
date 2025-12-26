/**
 * Policy Repository Interface
 *
 * Defines the contract for policy data access operations.
 */

/**
 * Policy entity
 */
export interface Policy {
  id: number;
  title: string;
  content: string;
  status: string;
  tags?: string[];
  owner?: number;
  approver?: number;
  effective_date?: string;
  next_review_date?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Data for creating a policy
 */
export interface CreatePolicyDTO {
  title: string;
  content: string;
  status?: string;
  tags?: string[];
  owner?: number;
  approver?: number;
  effective_date?: string;
  next_review_date?: string;
}

/**
 * Data for updating a policy
 */
export interface UpdatePolicyDTO {
  title?: string;
  content?: string;
  status?: string;
  tags?: string[];
  owner?: number;
  approver?: number;
  effective_date?: string;
  next_review_date?: string;
}

/**
 * Policy Repository Interface
 */
export interface IPolicyRepository {
  /**
   * Get all policies
   */
  getAll(options?: { signal?: AbortSignal }): Promise<Policy[]>;

  /**
   * Get a policy by ID
   */
  getById(id: number, options?: { signal?: AbortSignal }): Promise<Policy>;

  /**
   * Create a new policy
   */
  create(data: CreatePolicyDTO): Promise<Policy>;

  /**
   * Update a policy
   */
  update(id: number, data: UpdatePolicyDTO): Promise<Policy>;

  /**
   * Delete a policy
   */
  delete(id: number): Promise<void>;

  /**
   * Get all unique tags
   */
  getAllTags(): Promise<string[]>;
}

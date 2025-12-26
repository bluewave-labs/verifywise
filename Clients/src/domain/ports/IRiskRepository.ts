/**
 * Risk Repository Interface
 *
 * Defines the contract for risk data access operations.
 */

/**
 * Risk entity
 */
export interface Risk {
  id: number;
  title: string;
  description?: string;
  risk_level?: string;
  likelihood?: string;
  impact?: string;
  mitigation_status?: string;
  owner?: number;
  project_id?: number;
  control_id?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Risk with mitigation details
 */
export interface RiskWithMitigation extends Risk {
  mitigations?: Mitigation[];
}

/**
 * Mitigation entity
 */
export interface Mitigation {
  id: number;
  title: string;
  description?: string;
  status?: string;
  due_date?: string;
  owner?: number;
  risk_id?: number;
}

/**
 * Data for creating a risk
 */
export interface CreateRiskDTO {
  title: string;
  description?: string;
  risk_level?: string;
  likelihood?: string;
  impact?: string;
  mitigation_status?: string;
  owner?: number;
  project_id?: number;
  control_id?: number;
}

/**
 * Data for updating a risk
 */
export interface UpdateRiskDTO {
  title?: string;
  description?: string;
  risk_level?: string;
  likelihood?: string;
  impact?: string;
  mitigation_status?: string;
  owner?: number;
}

/**
 * Risk Repository Interface
 */
export interface IRiskRepository {
  /**
   * Get all risks
   */
  getAll(options?: { signal?: AbortSignal }): Promise<Risk[]>;

  /**
   * Get a risk by ID
   */
  getById(id: number, options?: { signal?: AbortSignal }): Promise<RiskWithMitigation>;

  /**
   * Get risks by project ID
   */
  getByProjectId(projectId: number, options?: { signal?: AbortSignal }): Promise<Risk[]>;

  /**
   * Get risks by control ID
   */
  getByControlId(controlId: number, options?: { signal?: AbortSignal }): Promise<Risk[]>;

  /**
   * Create a new risk
   */
  create(data: CreateRiskDTO): Promise<Risk>;

  /**
   * Update a risk
   */
  update(id: number, data: UpdateRiskDTO): Promise<Risk>;

  /**
   * Delete a risk
   */
  delete(id: number): Promise<void>;
}

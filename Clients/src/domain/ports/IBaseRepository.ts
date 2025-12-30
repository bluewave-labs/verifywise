/**
 * Base Repository Interface
 *
 * Defines the standard CRUD operations that all repositories should implement.
 * This interface provides a contract for data access abstraction.
 *
 * @template T - The entity type
 * @template CreateDTO - The data transfer object for creation
 * @template UpdateDTO - The data transfer object for updates
 */
export interface IBaseRepository<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  /**
   * Retrieves all entities
   * @param options - Optional parameters like signal for cancellation
   */
  getAll(options?: { signal?: AbortSignal }): Promise<T[]>;

  /**
   * Retrieves a single entity by ID
   * @param id - The entity identifier
   * @param options - Optional parameters like signal for cancellation
   */
  getById(id: number | string, options?: { signal?: AbortSignal }): Promise<T>;

  /**
   * Creates a new entity
   * @param data - The creation data
   */
  create(data: CreateDTO): Promise<T>;

  /**
   * Updates an existing entity
   * @param id - The entity identifier
   * @param data - The update data
   */
  update(id: number | string, data: UpdateDTO): Promise<T>;

  /**
   * Deletes an entity by ID
   * @param id - The entity identifier
   */
  delete(id: number | string): Promise<void>;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Common query options for filtering and pagination
 */
export interface QueryOptions {
  signal?: AbortSignal;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  search?: string;
}

/**
 * API Response wrapper type
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

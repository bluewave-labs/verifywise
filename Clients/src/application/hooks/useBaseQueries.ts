import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllEntities,
  getEntityById,
  createNewUser,
  updateEntityById,
  deleteEntityById,
  archiveIncidentById
} from '../repository/entity.repository';
import { invalidateQueries } from '../config/queryClient';

/**
 * Options for entity fetch hooks.
 */
interface EntityQueryOptions {
  /** Whether the query is enabled */
  enabled?: boolean;
  /** Time in ms before data is considered stale */
  staleTime?: number;
}

/**
 * Base hook for fetching all entities from a given route.
 *
 * @template T - The type of entities being fetched
 * @param {string} routeUrl - The API route URL
 * @param {EntityQueryOptions} options - Optional query configuration
 * @returns {UseQueryResult<T[]>} Query result with entities data
 *
 * @example
 * const { data: users } = useGetAllEntities<User[]>('/users');
 */
export const useGetAllEntities = <T = unknown>(routeUrl: string, options?: EntityQueryOptions) => {
  return useQuery<T>({
    queryKey: ['entities', routeUrl],
    queryFn: async () => {
      const response = await getAllEntities({ routeUrl });
      return response.data as T;
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
};

/**
 * Base hook for fetching a single entity by ID.
 *
 * @template T - The type of entity being fetched
 * @param {string} routeUrl - The API route URL
 * @param {string | number} id - The entity ID
 * @param {EntityQueryOptions} options - Optional query configuration
 * @returns {UseQueryResult<T>} Query result with entity data
 *
 * @example
 * const { data: user } = useGetEntityById<User>('/users', userId);
 */
export const useGetEntityById = <T = unknown>(routeUrl: string, id: string | number, options?: EntityQueryOptions) => {
  return useQuery<T>({
    queryKey: ['entity', routeUrl, id],
    queryFn: async () => {
      const response = await getEntityById({ routeUrl: `${routeUrl}/${id}` });
      return response.data as T;
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
};

/**
 * Base hook for creating entities.
 *
 * @template TInput - The type of data being sent to create the entity
 * @param {string} routeUrl - The API route URL
 * @param {string[][]} invalidateKeys - Optional keys to invalidate on success
 * @returns {UseMutationResult} Mutation result with mutate function
 *
 * @example
 * const { mutate } = useCreateEntity<CreateUserInput>('/users');
 * mutate({ name: 'John', email: 'john@example.com' });
 */
export const useCreateEntity = <TInput = Record<string, unknown>>(routeUrl: string, invalidateKeys?: string[][]) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: TInput) => createNewUser({ routeUrl, body }),
    onSuccess: () => {
      if (invalidateKeys) {
        invalidateQueries(invalidateKeys);
      }
      queryClient.invalidateQueries({ queryKey: ['entities', routeUrl] });
    },
  });
};

/**
 * Base hook for updating entities.
 *
 * @template TInput - The type of data being sent to update the entity
 * @param {string} routeUrl - The API route URL
 * @param {string[][]} invalidateKeys - Optional keys to invalidate on success
 * @returns {UseMutationResult} Mutation result with mutate function
 *
 * @example
 * const { mutate } = useUpdateEntity<UpdateUserInput>('/users');
 * mutate({ id: 1, body: { name: 'Updated Name' } });
 */
export const useUpdateEntity = <TInput = Record<string, unknown>>(routeUrl: string, invalidateKeys?: string[][]) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string | number; body: TInput }) =>
      updateEntityById({ routeUrl: `${routeUrl}/${id}`, body }),
    onSuccess: (_, variables) => {
      if (invalidateKeys) {
        invalidateQueries(invalidateKeys);
      }
      queryClient.invalidateQueries({ queryKey: ['entity', routeUrl, variables.id] });
      queryClient.invalidateQueries({ queryKey: ['entities', routeUrl] });
    },
  });
};

/**
 * Base hook for deleting entities.
 *
 * @param {string} routeUrl - The API route URL
 * @param {string[][]} invalidateKeys - Optional keys to invalidate on success
 * @returns {UseMutationResult} Mutation result with mutate function
 *
 * @example
 * const { mutate } = useDeleteEntity('/users');
 * mutate(userId);
 */
export const useDeleteEntity = (routeUrl: string, invalidateKeys?: string[][]) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) =>
      deleteEntityById({ routeUrl: `${routeUrl}/${id}` }),
    onSuccess: (_, id) => {
      if (invalidateKeys) {
        invalidateQueries(invalidateKeys);
      }
      queryClient.removeQueries({ queryKey: ['entity', routeUrl, id] });
      queryClient.invalidateQueries({ queryKey: ['entities', routeUrl] });
    },
  });
};

/**
 * Base hook for archiving entities.
 *
 * @param {string} routeUrl - The API route URL
 * @param {string[][]} invalidateKeys - Optional keys to invalidate on success
 * @returns {UseMutationResult} Mutation result with mutate function
 *
 * @example
 * const { mutate } = useArchivedEntity('/incidents');
 * mutate(incidentId);
 */
export const useArchivedEntity = (routeUrl: string, invalidateKeys?: string[][]) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) =>
      archiveIncidentById({
        routeUrl: `${routeUrl}/${id}`,
        body: { archived: true },
      }),
    onSuccess: (_, id) => {
      if (invalidateKeys) {
        invalidateQueries(invalidateKeys);
      }
      queryClient.removeQueries({ queryKey: ['entity', routeUrl, id] });
      queryClient.invalidateQueries({ queryKey: ['entities', routeUrl] });
    },
  });
};

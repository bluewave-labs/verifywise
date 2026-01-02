import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  createVendorRisk,
  updateVendorRisk,
  deleteVendorRisk,
  getVendorRiskById
} from '../repository/vendorRisk.repository';
import { vendorRiskQueryKeys } from './useVendorRisks';
import {
  VendorRisk,
  CreateVendorRiskInput,
  UpdateVendorRiskInput
} from '../../domain/types/VendorRisk';

/**
 * Hook to create a new vendor risk.
 *
 * @returns {UseMutationResult} Mutation result with mutate function and status
 *
 * @example
 * const { mutate, isPending } = useCreateVendorRisk();
 * mutate({ risk_description: 'Data breach', impact: 'Major', ... });
 */
export const useCreateVendorRisk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (riskData: CreateVendorRiskInput) => {
      const response = await createVendorRisk({ body: riskData });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorRiskQueryKeys.lists() });
    },
  });
};

/**
 * Hook to update an existing vendor risk.
 *
 * @returns {UseMutationResult} Mutation result with mutate function and status
 *
 * @example
 * const { mutate, isPending } = useUpdateVendorRisk();
 * mutate({ id: 1, data: { risk_description: 'Updated description' } });
 */
export const useUpdateVendorRisk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateVendorRiskInput }) => {
      const response = await updateVendorRisk({ id, body: data });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorRiskQueryKeys.lists() });
    },
  });
};

/**
 * Hook to delete a vendor risk by ID.
 *
 * @returns {UseMutationResult} Mutation result with mutate function and status
 *
 * @example
 * const { mutate, isPending } = useDeleteVendorRisk();
 * mutate(riskId);
 */
export const useDeleteVendorRisk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await deleteVendorRisk({ id });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorRiskQueryKeys.lists() });
    },
  });
};

/**
 * Hook to fetch a single vendor risk by ID.
 *
 * @param {number} id - The ID of the vendor risk to fetch
 * @returns {UseQueryResult<VendorRisk>} Query result with data and status
 *
 * @example
 * const { data: risk, isLoading } = useVendorRisk(riskId);
 */
export const useVendorRisk = (id: number) => {
  return useQuery<VendorRisk>({
    queryKey: [...vendorRiskQueryKeys.all, 'detail', id],
    queryFn: async () => {
      const response = await getVendorRiskById({ id });
      return response?.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};


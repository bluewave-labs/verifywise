import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAllVendors, 
  getVendorById, 
  getVendorsByProjectId, 
  createNewVendor, 
  update as updateVendor, 
  deleteVendor 
} from '../repository/vendor.repository';

export interface VendorDetails {
  id?: number;
  projects: number[];
  vendor_name: string;
  vendor_provides: string;
  website: string;
  vendor_contact_person: string;
  review_result: string;
  review_status: string;
  reviewer: string;
  risk_status: string;
  review_date: string;
  assignee: string;
}

// Query keys for vendors
export const vendorQueryKeys = {
  all: ['vendors'] as const,
  lists: () => [...vendorQueryKeys.all, 'list'] as const,
  list: (filters: { projectId?: string | number }) => [...vendorQueryKeys.lists(), filters] as const,
  details: () => [...vendorQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...vendorQueryKeys.details(), id] as const,
};

// Hook to fetch all vendors
export const useVendors = (filters: { projectId?: string | number } = {}) => {
  return useQuery({
    queryKey: vendorQueryKeys.list(filters),
    queryFn: async () => {
      if (filters.projectId && filters.projectId !== 'all') {
        const response = await getVendorsByProjectId({
          projectId: Number(filters.projectId),
        });
        return response?.data || [];
      } else {
        const response = await getAllVendors();
        return response?.data || [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
};

// Hook to fetch a single vendor by ID
export const useVendor = (id: number) => {
  return useQuery({
    queryKey: vendorQueryKeys.detail(id),
    queryFn: async () => {
      const response = await getVendorById({ id });
      return response?.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook to create a new vendor
export const useCreateVendor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (vendorData: Partial<VendorDetails>) => {
      const response = await createNewVendor({ body: vendorData });
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch vendor lists
      queryClient.invalidateQueries({ queryKey: vendorQueryKeys.lists() });
    },
  });
};

// Hook to update a vendor
export const useUpdateVendor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<VendorDetails> }) => {
      const response = await updateVendor({ id, body: data });
      return response;
    },
    onSuccess: (_, { id }) => {
      // Invalidate and refetch vendor details and lists
      queryClient.invalidateQueries({ queryKey: vendorQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: vendorQueryKeys.lists() });
    },
  });
};

// Hook to delete a vendor
export const useDeleteVendor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await deleteVendor({ id });
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch vendor lists
      queryClient.invalidateQueries({ queryKey: vendorQueryKeys.lists() });
    },
  });
};

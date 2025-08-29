import { useQuery } from '@tanstack/react-query';
import { getAllProjects } from '../repository/project.repository';
import { Project } from '../../domain/types/Project';

// Query keys for projects
export const projectQueryKeys = {
  all: ['projects'] as const,
  lists: () => [...projectQueryKeys.all, 'list'] as const,
  list: () => [...projectQueryKeys.lists()] as const,
  details: () => [...projectQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectQueryKeys.details(), id] as const,
};

// Hook to fetch all projects
export const useProjects = () => {
  return useQuery({
    queryKey: projectQueryKeys.list(),
    queryFn: async (): Promise<Project[]> => {
      const response = await getAllProjects();
      return response?.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
};
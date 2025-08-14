import { useGetAllEntities } from './useBaseQueries';
import { Project } from '../../domain/types/Project';

export const useProjects = () => {
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useGetAllEntities('/projects');

  // Handle different possible response structures
  const projects = data?.data || data || [];

  return { 
    projects: Array.isArray(projects) ? projects as Project[] : [], 
    loading: isLoading, 
    error, 
    fetchProjects: refetch 
  };
};

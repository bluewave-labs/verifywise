import { useEffect, useState } from "react";
import { useCallback } from "react";
import { getAllProjects } from "../repository/project.repository";
import { Project } from "../../domain/types/Project";

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await getAllProjects();
      setProjects(response.data);
    } catch (error) {
      // Handle error
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch projects when the component mounts
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);



  return { projects, loading, fetchProjects };
};

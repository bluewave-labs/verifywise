import { useState } from "react";
import { useCallback } from "react";
import { getAllEntities } from "../repository/entity.repository";
import { Project } from "../../domain/types/Project";

export const useProjectData = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await getAllEntities({ routeUrl: "/projects" });
      setProjects(response.data);
    } catch (error) {
      // Handle error
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { projects, loading, fetchProjects };
};

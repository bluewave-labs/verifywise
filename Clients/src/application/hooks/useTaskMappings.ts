/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo, useCallback } from "react";
import { getAllProjects } from "../repository/project.repository";
import { getAllFrameworks } from "../repository/entity.repository";
import { getAllVendors } from "../repository/vendor.repository";
import { getAllEntities } from "../repository/entity.repository";

/**
 * Mapping structure
 */
export interface MappingOption {
  id: string | number;
  label: string;
}

/**
 * Master data maps
 */
export interface TaskMappingMaps {
  useCaseMap: Map<string, string>;
  modelMap: Map<string, string>;
  frameworkMap: Map<string, string>;
  vendorMap: Map<string, string>;
}

/**
 * Hook to fetch and manage task mapping data
 * Loads all data in parallel with caching
 */
export const useTaskMappings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useCases, setUseCases] = useState<MappingOption[]>([]);
  const [models, setModels] = useState<MappingOption[]>([]);
  const [frameworks, setFrameworks] = useState<MappingOption[]>([]);
  const [vendors, setVendors] = useState<MappingOption[]>([]);

  // Fetch all master data
  const fetchMappingData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch in parallel
      const [projectsRes, frameworksRes, vendorsRes, modelsRes] = await Promise.all([
        getAllProjects(),
        getAllFrameworks(),
        getAllVendors(),
        getAllEntities({ routeUrl: "/modelInventory" }),
      ]);

      // Transform projects → use cases
      const projectsList = (projectsRes?.data?.projects || projectsRes?.data || []).map(
        (p: any) => ({
          id: String(p.id),
          label: p.project_title || "Unknown",
        })
      );

      // Transform frameworks
      const frameworksList = (frameworksRes?.data || []).map((f: any) => ({
        id: String(f.id),
        label: f.name || "Unknown",
      }));

      // Transform vendors
      const vendorsList = (vendorsRes?.data || []).map((v: any) => ({
        id: String(v.id),
        label: v.vendor_name  || "Unknown",
      }));

      // Transform models
      const modelsList = (modelsRes?.data || []).map((m: any) => ({
        id: String(m.id),
        label: m.model || "Unknown",
      }));

      setUseCases(projectsList);
      setModels(modelsList);
      setFrameworks(frameworksList);
      setVendors(vendorsList);
    } catch (err) {
      console.error("Error fetching mapping data:", err);
      setError("Failed to load mapping data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchMappingData();
  }, [fetchMappingData]);

  // Create ID → Name maps
  const maps = useMemo<TaskMappingMaps>(() => {
    const useCaseMap = new Map<string, string>();
    const modelMap = new Map<string, string>();
    const frameworkMap = new Map<string, string>();
    const vendorMap = new Map<string, string>();

    useCases.forEach((uc) => useCaseMap.set(String(uc.id), uc.label));
    models.forEach((m) => modelMap.set(String(m.id), m.label));
    frameworks.forEach((f) => frameworkMap.set(String(f.id), f.label));
    vendors.forEach((v) => vendorMap.set(String(v.id), v.label));

    return { useCaseMap, modelMap, frameworkMap, vendorMap };
  }, [useCases, models, frameworks, vendors]);

  /**
   * Map IDs to their display names
   */
  const mapIdsToNames = useCallback(
    (ids: number[] | undefined, mapType: keyof TaskMappingMaps): string[] => {
      if (!ids || ids.length === 0) return [];
      const map = maps[mapType];
      return ids
        .map((id) => map.get(String(id)) || `Unknown (${id})`)
        .filter(Boolean);
    },
    [maps]
  );

  /**
   * Get single name from ID
   */
  const getNameById = useCallback(
    (id: number | undefined, mapType: keyof TaskMappingMaps): string => {
      if (!id) return "—";
      const map = maps[mapType];
      return map.get(String(id)) || `Unknown (${id})`;
    },
    [maps]
  );

  return {
    // Loading state
    isLoading,
    error,

    // Master data
    useCases,
    models,
    frameworks,
    vendors,

    // Maps
    maps,

    // Utility functions
    mapIdsToNames,
    getNameById,

    // Refetch
    refetch: fetchMappingData,
  };
};
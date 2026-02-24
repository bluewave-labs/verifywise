/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo, useCallback } from "react";
import { getAllProjects } from "../repository/project.repository";
import { getAllFrameworks, getAllEntities } from "../repository/entity.repository";
import { getAllVendors } from "../repository/vendor.repository";

// import type { MappingOption } from "../../domain/types/mapping-option.type";
import type {
  TaskMappingKey,
  TaskMappingMaps,
  TaskMappingsState,
  MappingOption
} from "../../domain/types/task-mappings.type";

const toMappingOptions = <T,>(
  items: T[],
  getId: (item: T) => string,
  getLabel: (item: T) => string
): MappingOption[] =>
  items.map((item) => ({
    id: getId(item),
    label: getLabel(item) || "Unknown",
  }));

const buildMap = (options: MappingOption[]): Map<string, string> => {
  const map = new Map<string, string>();
  options.forEach((o) => map.set(String(o.id), o.label));
  return map;
};

/**
 * Hook to fetch and manage task mapping data
 * Loads all data in parallel with caching
 *
 * NOTE: This hook only owns mapping/master-data + mapping helpers.
 * No UI logic, no domain mutations.
 */
export const useTaskMappings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<TaskMappingsState>({
    useCases: [],
    models: [],
    frameworks: [],
    vendors: [],
  });

  const fetchMappingData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [projectsRes, frameworksRes, vendorsRes, modelsRes] = await Promise.all([
        getAllProjects(),
        getAllFrameworks(),
        getAllVendors(),
        getAllEntities({ routeUrl: "/modelInventory" }),
      ]);

      const projectsRaw = projectsRes?.data?.projects || projectsRes?.data || [];
      const frameworksRaw = frameworksRes?.data || [];
      const vendorsRaw = vendorsRes?.data || [];
      const modelsRaw = modelsRes?.data || [];

      const useCases = toMappingOptions(
        projectsRaw,
        (p: any) => String(p.id),
        (p: any) => String(p.project_title|| "Unknown")
      );

      const frameworks = toMappingOptions(
        frameworksRaw,
        (f: any) => String(f.id),
        (f: any) => String(f.name|| "Unknown")
      );

      const vendors = toMappingOptions(
        vendorsRaw,
        (v: any) => String(v.id),
        (v: any) => String(v.vendor_name || "Unknown")
      );

      const models = toMappingOptions(
        modelsRaw,
        (m: any) => String(m.id),
        (m: any) => String(m.model || "Unknown")
      );

      setState({
        useCases,
        models,
        frameworks,
        vendors,
      });
    } catch (err) {
      console.error("Error fetching mapping data:", err);
      setError("Failed to load mapping data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMappingData();
  }, [fetchMappingData]);

  const maps = useMemo<TaskMappingMaps>(() => {
    return {
      useCaseMap: buildMap(state.useCases),
      modelMap: buildMap(state.models),
      frameworkMap: buildMap(state.frameworks),
      vendorMap: buildMap(state.vendors),
    };
  }, [state.useCases, state.models, state.frameworks, state.vendors]);

  const mapIdsToNames = useCallback(
    (ids: number[] | undefined, mapType: TaskMappingKey): string[] => {
      if (!ids || ids.length === 0) return [];
      const map = maps[mapType];
      return ids.map((id) => map.get(String(id)) || `Unknown (${id})`);
    },
    [maps]
  );

  const getNameById = useCallback(
    (id: number | undefined, mapType: TaskMappingKey): string => {
      if (!id) return "—";
      const map = maps[mapType];
      return map.get(String(id)) || `Unknown (${id})`;
    },
    [maps]
  );

  return {
    isLoading,
    error,

    useCases: state.useCases,
    models: state.models,
    frameworks: state.frameworks,
    vendors: state.vendors,

    maps,

    mapIdsToNames,
    getNameById,

    refetch: fetchMappingData,
  };
};
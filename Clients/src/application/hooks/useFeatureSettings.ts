import { useState, useEffect, useCallback } from "react";
import { IFeatureSettings } from "../../domain/interfaces/i.featureSettings";
import {
  getFeatureSettings as fetchSettings,
  updateFeatureSettings as patchSettings,
} from "../repository/featureSettings.repository";

interface UseFeatureSettingsResult {
  featureSettings: IFeatureSettings | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  updateSettings: (updates: Partial<Pick<IFeatureSettings, "lifecycle_enabled">>) => Promise<IFeatureSettings>;
}

/**
 * @deprecated The `lifecycle_enabled` flag is superseded by the plugin
 * installation system. Use `isPluginInstalled("model-lifecycle")` from
 * the `usePluginRegistry` hook instead.
 */
export function useFeatureSettings(): UseFeatureSettingsResult {
  const [featureSettings, setFeatureSettings] = useState<IFeatureSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSettings();
      setFeatureSettings(data);
    } catch (err) {
      setError((err as Error).message || "Failed to load feature settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateSettings = useCallback(
    async (updates: Partial<Pick<IFeatureSettings, "lifecycle_enabled">>) => {
      const updated = await patchSettings(updates);
      setFeatureSettings(updated);
      return updated;
    },
    []
  );

  return { featureSettings, loading, error, refresh: fetchData, updateSettings };
}

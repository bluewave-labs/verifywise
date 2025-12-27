import { useState, useEffect } from "react";
import { getInstalledPlugins } from "../repository/plugin.repository";
import { PluginInstallationStatus } from "../../domain/types/plugins";

/**
 * Custom hook to check if a specific plugin is installed
 *
 * @param pluginKey - The key of the plugin to check (e.g., "mlflow", "slack")
 * @returns Object containing:
 *   - isInstalled: boolean indicating if the plugin is installed
 *   - loading: boolean indicating if the check is in progress
 *   - error: string | null containing any error message
 *   - installationId: number | null containing the installation ID if installed
 *
 * @example
 * ```tsx
 * const { isInstalled, loading } = useIsPluginInstalled("mlflow");
 *
 * if (loading) return <Spinner />;
 * if (!isInstalled) return null;
 *
 * return <MLFlowComponent />;
 * ```
 */
export function useIsPluginInstalled(pluginKey: string) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installationId, setInstallationId] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const checkPluginInstallation = async () => {
      try {
        setLoading(true);
        setError(null);

        const installedPlugins = await getInstalledPlugins({
          signal: controller.signal,
        });

        // Check if the specified plugin is installed
        const installation = installedPlugins.find(
          (plugin) =>
            (plugin.plugin?.key || plugin.pluginKey) === pluginKey &&
            plugin.status === PluginInstallationStatus.INSTALLED
        );

        setIsInstalled(!!installation);
        setInstallationId(installation?.id || null);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to check plugin installation");
          setIsInstalled(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkPluginInstallation();

    return () => controller.abort();
  }, [pluginKey]);

  return { isInstalled, loading, error, installationId };
}

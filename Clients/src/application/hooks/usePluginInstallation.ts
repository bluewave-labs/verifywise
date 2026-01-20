import { useState } from "react";
import {
  installPlugin as installPluginApi,
  uninstallPlugin as uninstallPluginApi,
} from "../repository/plugin.repository";
import { usePluginRegistry } from "../contexts/PluginRegistry.context";

export function usePluginInstallation() {
  const [installing, setInstalling] = useState<string | null>(null);
  const [uninstalling, setUninstalling] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { refreshPlugins, unloadPlugin } = usePluginRegistry();

  const install = async (pluginKey: string) => {
    setInstalling(pluginKey);
    setError(null);
    try {
      const installation = await installPluginApi({ pluginKey });
      // Refresh plugins to trigger loading the new plugin's UI
      await refreshPlugins();
      return installation;
    } catch (err: any) {
      setError(err.message || "Failed to install plugin");
      throw err;
    } finally {
      setInstalling(null);
    }
  };

  const uninstall = async (installationId: number, pluginKey?: string) => {
    setUninstalling(installationId);
    setError(null);
    try {
      await uninstallPluginApi({ installationId });
      // Unload the plugin's UI components immediately
      if (pluginKey) {
        unloadPlugin(pluginKey);
      }
      // Refresh plugins to update the installed plugins list
      await refreshPlugins();
    } catch (err: any) {
      setError(err.message || "Failed to uninstall plugin");
      throw err;
    } finally {
      setUninstalling(null);
    }
  };

  return {
    install,
    uninstall,
    installing,
    uninstalling,
    error,
  };
}

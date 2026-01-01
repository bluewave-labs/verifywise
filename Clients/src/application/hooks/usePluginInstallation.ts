import { useState } from "react";
import {
  installPlugin as installPluginApi,
  uninstallPlugin as uninstallPluginApi,
} from "../repository/plugin.repository";

export function usePluginInstallation() {
  const [installing, setInstalling] = useState<string | null>(null);
  const [uninstalling, setUninstalling] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const install = async (pluginKey: string) => {
    setInstalling(pluginKey);
    setError(null);
    try {
      const installation = await installPluginApi({ pluginKey });
      return installation;
    } catch (err: any) {
      setError(err.message || "Failed to install plugin");
      throw err;
    } finally {
      setInstalling(null);
    }
  };

  const uninstall = async (installationId: number) => {
    setUninstalling(installationId);
    setError(null);
    try {
      await uninstallPluginApi({ installationId });
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

import { useEffect } from "react";
import {
  usePluginRegistry,
  PluginUIConfig,
} from "../../../application/contexts/PluginRegistry.context";
import { apiServices } from "../../../infrastructure/api/networkServices";

interface MarketplacePlugin {
  key: string;
  ui?: PluginUIConfig;
}

interface MarketplaceResponse {
  data: MarketplacePlugin[];
}

/**
 * PluginLoader component
 *
 * This component runs on app startup and loads all UI bundles for installed plugins.
 * It fetches the marketplace data to get UI configurations and dynamically imports
 * the ESM bundles for each installed plugin.
 */
export function PluginLoader() {
  const { installedPlugins, loadPluginUI, isLoading } = usePluginRegistry();

  useEffect(() => {
    if (isLoading || installedPlugins.length === 0) {
      return;
    }

    async function loadAllPluginUIs() {
      try {
        // Fetch marketplace data to get UI configs
        const response = await apiServices.get<MarketplaceResponse>(
          "/plugins/marketplace"
        );

        const marketplacePlugins: MarketplacePlugin[] =
          (response.data as any)?.data || [];

        console.log("[PluginLoader] Debug - Installed plugins:", installedPlugins.map(p => p.pluginKey));
        console.log("[PluginLoader] Debug - Marketplace plugins with UI:", marketplacePlugins.filter(p => p.ui).map(p => ({ key: p.key, slots: p.ui?.slots })));

        for (const installed of installedPlugins) {
          const marketplacePlugin = marketplacePlugins.find(
            (p) => p.key === installed.pluginKey
          );

          console.log(`[PluginLoader] Debug - Processing ${installed.pluginKey}:`, {
            found: !!marketplacePlugin,
            hasUI: !!marketplacePlugin?.ui,
            slots: marketplacePlugin?.ui?.slots,
          });

          if (marketplacePlugin?.ui) {
            await loadPluginUI(installed.pluginKey, marketplacePlugin.ui);
            console.log(`[PluginLoader] Debug - Loaded UI for ${installed.pluginKey}`);
          }
        }
      } catch (error) {
        console.error("[PluginLoader] Failed to load plugin UIs:", error);
      }
    }

    loadAllPluginUIs();
  }, [installedPlugins, loadPluginUI, isLoading]);

  // This component doesn't render anything
  return null;
}

export default PluginLoader;

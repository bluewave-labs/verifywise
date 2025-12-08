/**
 * Built-in Plugins Registry
 *
 * This file registers all built-in plugins that ship with VerifyWise.
 * Users can install/uninstall and enable/disable these plugins from Settings.
 */

import { Plugin, PluginContext } from "../core";
import { sampleTestPluginIcon } from "./icons";
import activityFeedPlugin from "./activity-feed";

/**
 * Sample Test Plugin
 * A minimal plugin for testing install/uninstall and enable/disable functionality
 */
export const sampleTestPlugin: Plugin = {
  manifest: {
    id: "sample-test-plugin",
    name: "Sample test plugin",
    description:
      "A minimal test plugin that does nothing. Use this to verify plugin install, uninstall, enable, and disable functionality works correctly.",
    version: "1.0.0",
    author: "VerifyWise",
    authorUrl: "https://verifywise.ai",
    type: "feature",
    icon: sampleTestPluginIcon,
    permissions: [],
    config: {},
  },

  async onInstall(context: PluginContext): Promise<void> {
    context.logger.info("Sample Test plugin installed");
  },

  async onUninstall(context: PluginContext): Promise<void> {
    context.logger.info("Sample Test plugin uninstalled");
  },

  async onEnable(context: PluginContext): Promise<void> {
    context.logger.info("Sample Test plugin enabled - doing nothing");
  },

  async onDisable(context: PluginContext): Promise<void> {
    context.logger.info("Sample Test plugin disabled");
  },
};

/**
 * All built-in plugins
 */
export const builtinPlugins: Plugin[] = [sampleTestPlugin, activityFeedPlugin];

export default builtinPlugins;

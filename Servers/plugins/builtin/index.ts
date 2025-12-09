/**
 * Built-in Plugins Registry
 *
 * This file registers all built-in plugins that ship with VerifyWise.
 * These are real, functional plugins - not samples or demos.
 *
 * For plugin development templates, see:
 * https://github.com/bluewave-labs/plugin-marketplace/tree/main/templates
 */

import { Plugin } from "../core";
import activityFeedPlugin from "./activity-feed";

/**
 * All built-in plugins
 */
export const builtinPlugins: Plugin[] = [activityFeedPlugin];

export default builtinPlugins;

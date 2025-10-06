/**
 * Centralized route mapping configuration for breadcrumbs
 * This file contains all the route-to-label mappings used by the Breadcrumbs component
 *
 * @file routeMapping.ts
 * @description Route mapping utilities for breadcrumb navigation
 * @version 2.0.0
 */

/**
 * Static route mappings for exact path matches
 * @type {Record<string, string>}
 */
export const routeMapping: Record<string, string> = {
  // Main pages
  "/": "Dashboard",
  "/test": "Dashboard",

  // Project related
  "/project-view": "Project Overview",
  "/test/project-view": "Project Overview",

  // Vendor management
  "/vendors": "Vendor Management",

  // Settings
  "/setting": "Settings",
  "/organization": "Organization Settings",

  // File management
  "/file-manager": "Evidence",

  // Reporting
  "/reporting": "Reporting Dashboard",

  // AI Trust Center
  "/ai-trust-center": "AI Trust Center",
  "/public": "Public AI Trust Center",

  // Fairness and Bias
  "/fairness-dashboard": "Fairness Dashboard",
  "/fairness-results": "Fairness Results",

  // Training
  "/training": "Training Registry",

  // Event tracking
  "/event-tracker": "Event Tracker",

  // Model inventory
  "/model-inventory": "Model Inventory",

  // Authentication
  "/login": "Sign In",
  "/register": "Create Account",
  "/admin-reg": "Admin Registration",
  "/user-reg": "User Registration",
  "/forgot-password": "Forgot Password",
  "/reset-password": "Reset Password",
  "/set-new-password": "Set New Password",
  "/reset-password-continue": "Continue Password Reset",

  // Playground
  "/playground": "Component Playground",
};

/**
 * Route pattern configuration for dynamic route matching
 * @type {Array<{pattern: RegExp, label: string, description?: string}>}
 */
export const dynamicRoutePatterns = [
  {
    pattern: /\/project-view.*projectId=/,
    label: "Project Details",
    description: "Project view with specific project ID",
  },
  {
    pattern: /\/fairness-results\/\w+/,
    label: "Fairness Results",
    description: "Fairness results for specific analysis",
  },
  {
    pattern: /\/model-inventory\/\d+/,
    label: "Model Details",
    description: "Detailed view of specific model",
  },
  {
    pattern: /\/vendors\/[a-zA-Z0-9-]+/,
    label: "Vendor Details",
    description: "Specific vendor information",
  },
] as const;

/**
 * Dynamic route mapping function for project-specific routes
 * This handles routes with dynamic parameters like project IDs
 *
 * @param {string} pathname - The pathname to match against dynamic patterns
 * @returns {string} The matched label or empty string if no match
 */
export const getDynamicRouteMapping = (pathname: string): string => {
  for (const { pattern, label } of dynamicRoutePatterns) {
    if (pattern.test(pathname)) {
      return label;
    }
  }
  return "";
};

/**
 * Normalize and convert path segments to readable labels
 *
 * @param {string} segment - The path segment to normalize
 * @returns {string} The normalized label
 */
export const normalizePathSegment = (segment: string): string => {
  return segment
    .replace(/[-_]/g, " ") // Convert kebab-case and snake_case to spaces
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Handle camelCase
    .replace(/\b\w/g, (char) => char.toUpperCase()) // Title case
    .trim();
};

/**
 * Convert a full path to a readable breadcrumb label
 *
 * @param {string} path - The full path to convert
 * @returns {string} The converted breadcrumb label
 */
export const pathToLabel = (path: string): string => {
  return path.split("/").filter(Boolean).map(normalizePathSegment).join(" / ");
};

/**
 * Get the appropriate route mapping for a given path
 *
 * @param {string} path - The path to get mapping for
 * @returns {string} The appropriate breadcrumb label
 */
export const getRouteMapping = (path: string): string => {
  // Check static mapping first
  if (routeMapping[path]) {
    return routeMapping[path];
  }

  // Check dynamic mapping
  const dynamicMapping = getDynamicRouteMapping(path);
  if (dynamicMapping) {
    return dynamicMapping;
  }

  // Fallback to path conversion
  return pathToLabel(path);
};

/**
 * Get all available route mappings for debugging/documentation purposes
 *
 * @returns {Object} Object containing static and dynamic mappings info
 */
export const getAllRouteMappings = () => {
  return {
    static: routeMapping,
    dynamic: dynamicRoutePatterns,
    totalStaticRoutes: Object.keys(routeMapping).length,
    totalDynamicPatterns: dynamicRoutePatterns.length,
  };
};

/**
 * Centralized route mapping configuration for breadcrumbs
 * This file contains all the route-to-label mappings used by the Breadcrumbs component
 *
 * @file routeMapping.ts
 * @description Route mapping utilities for breadcrumb navigation
 * @version 2.0.0
 */

import React from "react";
import {
  Home,
  Flag,
  BarChart3,
  AlertTriangle,
  Building,
  Settings,
  FileText,
  Scale,
  Brain,
  Shield,
  GraduationCap,
  Telescope,
  List as ListIcon,
  FolderTree,
  Layers,
  Puzzle,
  Zap,
  Activity,
} from "lucide-react";

/**
 * Static route mappings for exact path matches
 * @type {Record<string, string>}
 */
export const routeMapping: Record<string, string> = {
  // Main pages
  "/": "Dashboard",
  "/test": "Dashboard",
  "/overview": "Use cases",

  // Project related
  "/project-view": "Project overview",
  "/test/project-view": "Project overview",

  // Vendor management
  "/vendors": "Vendor Management",

  // Settings
  "/settings": "Settings",
  "/organization": "Organization Settings",

  // File management
  "/file-manager": "Evidence",

  // Integrations
  "/integrations": "Integrations",
  "/integrations/mlflow": "MLFlow",

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

  // Automations
  "/automations": "Automations",

  // Model inventory
  "/model-inventory": "Model Inventory",

  // Incident management
  "/ai-incident-managements": "Incident Management",

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
 * Icon mapping functions for breadcrumb items based on paths
 * @type {Record<string, () => React.ReactNode>}
 */
export const routeIconMapping: Record<string, () => React.ReactNode> = {
  // Main pages
  "/": () => React.createElement(Home, { size: 14, strokeWidth: 1.5 }),
  "/test": () => React.createElement(Home, { size: 14, strokeWidth: 1.5 }),

  // Project related
  "/project-view": () => React.createElement(FolderTree, { size: 14, strokeWidth: 1.5 }),
  "/test/project-view": () => React.createElement(FolderTree, { size: 14, strokeWidth: 1.5 }),
  "/overview": () => React.createElement(FolderTree, { size: 14, strokeWidth: 1.5 }),

  // Tasks
  "/tasks": () => React.createElement(Flag, { size: 14, strokeWidth: 1.5 }),

  // Framework/Organizational
  "/framework": () => React.createElement(Layers, { size: 14, strokeWidth: 1.5 }),

  // Vendor management
  "/vendors": () => React.createElement(Building, { size: 14, strokeWidth: 1.5 }),

  // Model inventory
  "/model-inventory": () => React.createElement(ListIcon, { size: 14, strokeWidth: 1.5 }),

  // Risk management
  "/risk-management": () => React.createElement(AlertTriangle, { size: 14, strokeWidth: 1.5 }),

  // Settings
  "/settings": () => React.createElement(Settings, { size: 14, strokeWidth: 1.5 }),
  "/organization": () => React.createElement(Settings, { size: 14, strokeWidth: 1.5 }),

  // File management
  "/file-manager": () => React.createElement(FileText, { size: 14, strokeWidth: 1.5 }),

  // Integrations
  "/integrations": () => React.createElement(Puzzle, { size: 14, strokeWidth: 1.5 }),

  // Reporting
  "/reporting": () => React.createElement(BarChart3, { size: 14, strokeWidth: 1.5 }),

  // AI Trust Center
  "/ai-trust-center": () => React.createElement(Brain, { size: 14, strokeWidth: 1.5 }),
  "/public": () => React.createElement(Brain, { size: 14, strokeWidth: 1.5 }),

  // Fairness and Bias
  "/fairness-dashboard": () => React.createElement(Scale, { size: 14, strokeWidth: 1.5 }),
  "/fairness-results": () => React.createElement(Scale, { size: 14, strokeWidth: 1.5 }),

  // Training
  "/training": () => React.createElement(GraduationCap, { size: 14, strokeWidth: 1.5 }),

  // Event tracking
  "/event-tracker": () => React.createElement(Telescope, { size: 14, strokeWidth: 1.5 }),

  // Policy Manager
  "/policies": () => React.createElement(Shield, { size: 14, strokeWidth: 1.5 }),

  // Automations
  "/automations": () => React.createElement(Zap, { size: 14, strokeWidth: 1.5 }),

  // MLFlow
  "/integrations/mlflow": () => React.createElement(Activity, { size: 14, strokeWidth: 1.5 }),
};

/**
 * Route pattern configuration for dynamic route matching
 * @type {Array<{pattern: RegExp, label: string, description?: string}>}
 */
export const dynamicRoutePatterns = [
  {
    pattern: /\/project-view.*projectId=/,
    label: "Project details",
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
  {
    pattern: /\/ai-incident-managements\/\d+/,
    label: "Incident Management Details",
    description: "Specific incident management information",
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
 * Get the appropriate icon for a given path
 *
 * @param {string} path - The path to get icon for
 * @returns {React.ReactNode | null} The appropriate icon or null if no match
 */
export const getRouteIcon = (path: string): React.ReactNode | null => {
  const iconFunction = routeIconMapping[path];

  // Debug logging to help troubleshoot icon matching
  if (process.env.NODE_ENV === 'development') {
    console.log('getRouteIcon - path:', path, 'has icon:', !!iconFunction);
  }

  return iconFunction ? iconFunction() : null;
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

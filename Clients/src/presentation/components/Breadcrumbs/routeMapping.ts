/**
 * Centralized route mapping configuration for breadcrumbs
 * This file contains all the route-to-label mappings used by the Breadcrumbs component
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
  "/file-manager": "File Manager",

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
 * Dynamic route mapping function for project-specific routes
 * This handles routes with dynamic parameters like project IDs
 */
export const getDynamicRouteMapping = (pathname: string): string => {
  // Project view with project ID
  if (pathname.includes("/project-view") && pathname.includes("projectId=")) {
    return "Project Details";
  }

  // Fairness results with ID
  if (pathname.includes("/fairness-results/")) {
    return "Fairness Results";
  }

  // Default fallback
  return "";
};

/**
 * Get the appropriate route mapping for a given path
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
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      // Convert kebab-case or snake_case to Title Case
      return segment
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    })
    .join(" / ");
};

interface DashboardState {
  dashboard: Record<string, unknown>;
  projects: Record<string, unknown>;
  compliance: Record<string, unknown>;
  assessments: Record<string, unknown>;
  vendors: unknown[];
}

interface AppState {
  ui: {
    mode: "light" | "dark";
  };
  auth: {
    authToken: string;
  };
  dashboard: {
    users: Array<{
      id: number;
      email: string;
      name: string;
      surname: string;
    }>;
  };
}

interface AlertState {
  variant: "success" | "info" | "warning" | "error";
  title?: string;
  body: string;
}

// UI state values for theme, layout, and other UI preferences
interface UIValues {
  mode?: "light" | "dark";
  sidebarOpen?: boolean;
  selectedTheme?: string;
  layout?: Record<string, unknown>;
}

// Authentication state values
interface AuthValues {
  authToken?: string;
  refreshToken?: string;
  userRole?: string;
  permissions?: string[];
  loginTime?: number;
  expiresAt?: number;
}

// Input state values for forms and dynamic data entry
interface InputValues {
  id?: string | number;
  [key: string]: unknown;
}

export type { DashboardState, AppState, AlertState, UIValues, AuthValues, InputValues };

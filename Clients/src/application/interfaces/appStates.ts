interface DashboardState {
  dashboard: Record<string, unknown>;
  projects: Record<string, unknown>;
  compliance: Record<string, unknown>;
  assessments: Record<string, unknown>;
  vendors: unknown[];
}

// Add proper interfaces for better type safety
interface UIValues {
  sidebarCollapsed?: boolean;
  activeTab?: string;
  filters?: Record<string, any>;
}

interface AuthValues {
  isAuthenticated: boolean;
  permissions?: string[];
  lastLoginTime?: Date;
}

interface InputValues {
  formData?: Record<string, any>;
  validationErrors?: Record<string, string>;
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

export type { DashboardState, AppState, AlertState };
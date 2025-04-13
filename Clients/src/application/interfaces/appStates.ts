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
}

export type { DashboardState, AppState };

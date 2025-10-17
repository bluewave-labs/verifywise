interface DashboardState {
  dashboard: Record<string, unknown>;
  projects: Record<string, unknown>;
  compliance: Record<string, unknown>;
  assessments: Record<string, unknown>;
  vendors: unknown[];
  users?: unknown[];
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
interface InputValues extends Record<string, unknown> {
  id?: string | number;
  risk_name?: string;
  risk_owner?: number;
  risk_description?: string;
  ai_lifecycle_phase?: string;
  risk_category?: string[] | unknown;
  impact?: string;
  assessment_mapping?: number;
  controlsMapping?: number;
  likelihood?: string;
  severity?: string;
  riskLevel?: number | string;
  review_notes?: string;
  projects?: number[] | unknown;
  frameworks?: number[] | unknown;
  mitigation_status?: string;
  mitigation_plan?: string;
  current_risk_level?: string;
  implementation_strategy?: string;
  deadline?: string | Date | unknown;
  mitigation_evidence_document?: string;
  likelihood_mitigation?: string;
  risk_severity?: string;
  risk_approval?: number;
  approval_status?: string;
  date_of_assessment?: string | Date | unknown;
  [key: string]: unknown;
}

export type { DashboardState, AppState, AlertState, UIValues, AuthValues, InputValues };

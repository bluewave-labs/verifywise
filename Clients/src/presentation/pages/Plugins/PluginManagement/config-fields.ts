export interface ConfigField {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "url" | "password" | "number" | "select" | "multiselect" | "checkbox";
  options?: { value: string; label: string }[];
  showIf?: (data: Record<string, string>) => boolean;
}

const BASE_CONFIG_FIELDS: ConfigField[] = [
  {
    key: "server_url",
    label: "Server URL",
    placeholder: "https://example.com",
    type: "url",
  },
  {
    key: "api_key",
    label: "API Key",
    placeholder: "Enter your API key",
    type: "password",
  },
];

const MLFLOW_CONFIG_FIELDS: ConfigField[] = [
  {
    key: "tracking_server_url",
    label: "Tracking Server URL",
    placeholder: "http://localhost:5000",
    type: "url",
  },
  {
    key: "auth_method",
    label: "Authentication Method",
    placeholder: "none",
    type: "select",
    options: [
      { value: "none", label: "None" },
      { value: "basic", label: "Basic Auth" },
      { value: "token", label: "Token" },
    ],
  },
  {
    key: "username",
    label: "Username",
    placeholder: "Enter username",
    type: "text",
    showIf: (data) => data.auth_method === "basic",
  },
  {
    key: "password",
    label: "Password",
    placeholder: "Enter password",
    type: "password",
    showIf: (data) => data.auth_method === "basic",
  },
  {
    key: "api_token",
    label: "API Token",
    placeholder: "Enter API token",
    type: "password",
    showIf: (data) => data.auth_method === "token",
  },
  {
    key: "verify_ssl",
    label: "Verify SSL",
    placeholder: "true",
    type: "checkbox",
  },
  {
    key: "timeout",
    label: "Request Timeout (seconds)",
    placeholder: "30",
    type: "number",
  },
];

export const MLFLOW_DEFAULT_CONFIG: Record<string, string> = {
  auth_method: "none",
  verify_ssl: "true",
  timeout: "30",
};

export function getConfigFields(pluginKey: string | undefined): ConfigField[] {
  if (pluginKey === "mlflow") {
    return MLFLOW_CONFIG_FIELDS;
  }
  return BASE_CONFIG_FIELDS;
}

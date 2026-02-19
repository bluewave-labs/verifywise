export interface ConfigField {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "url" | "password" | "number" | "select" | "multiselect" | "checkbox";
  options?: { value: string; label: string }[];
  showIf?: (data: Record<string, string>) => boolean;
}

// Base config fields used as fallback when plugin doesn't provide its own configuration UI
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

// Plugins should provide their own configuration UI via slots
// This function returns base fields as a fallback
export function getConfigFields(_pluginKey: string | undefined): ConfigField[] {
  return BASE_CONFIG_FIELDS;
}

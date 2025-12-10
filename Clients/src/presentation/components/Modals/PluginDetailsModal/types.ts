/**
 * Shared types for PluginDetailsModal components
 */

import {
  PluginDTO,
  PluginFAQItem,
  PluginChangelogEntry,
} from "../../../../application/repository/plugin.repository";

// Re-export for convenience
export type { PluginFAQItem, PluginChangelogEntry };

export type TabType = "about" | "settings" | "faq" | "changelog";

export interface ConfigSchema {
  type: "string" | "number" | "boolean" | "object" | "array" | "select";
  label?: string;
  required?: boolean;
  default?: unknown;
  secret?: boolean;
  description?: string;
  enum?: string[];
  options?: string[];  // Alternative to enum for select fields
  min?: number;
  max?: number;
}

export interface PluginDetailsModalProps {
  /** The plugin to display details for */
  plugin: PluginDTO | null;
  /** Controls whether the modal is visible */
  isOpen: boolean;
  /** Callback function called when modal should close */
  onClose: () => void;
  /** Callback when settings are saved successfully */
  onSettingsSaved?: () => void;
}

export interface AboutTabProps {
  plugin: PluginDTO;
}

export interface SettingsTabProps {
  configSchema: Record<string, ConfigSchema> | null;
  configValues: Record<string, unknown>;
  isLoading: boolean;
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  onConfigChange: (key: string, value: unknown) => void;
  onSave: () => void;
}

export interface FAQTabProps {
  plugin: PluginDTO;
}

export interface ChangelogTabProps {
  plugin: PluginDTO;
}

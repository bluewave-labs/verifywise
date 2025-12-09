/**
 * PluginDetailsModal - Displays detailed information about a plugin with settings
 *
 * Uses StandardModal as its base and provides tabs:
 * - About: Plugin metadata, status, permissions
 * - Settings: Editable configuration based on plugin's config schema
 * - FAQ: Frequently asked questions (if available)
 * - Changelog: Version history (if available)
 */

import React, { useState, useEffect, useCallback } from "react";
import { Box } from "@mui/material";
import StandardModal from "../StandardModal";
import TabBar from "../../TabBar";
import TabContext from "@mui/lab/TabContext";
import {
  getPluginConfig,
  updatePluginConfig,
} from "../../../../application/repository/plugin.repository";

// Tab components
import AboutTab from "./AboutTab";
import SettingsTab from "./SettingsTab";
import FAQTab from "./FAQTab";
import ChangelogTab from "./ChangelogTab";

// Types
import { PluginDetailsModalProps, TabType, ConfigSchema } from "./types";

// Theme
import { spacing } from "../../UserGuide/styles/theme";

const PluginDetailsModal: React.FC<PluginDetailsModalProps> = ({
  plugin,
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("about");
  const [configValues, setConfigValues] = useState<Record<string, unknown>>({});
  const [configSchema, setConfigSchema] = useState<Record<string, ConfigSchema> | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load config and schema when plugin changes or modal opens
  const loadConfig = useCallback(async () => {
    if (!plugin || !isOpen) return;

    setIsLoadingConfig(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await getPluginConfig(plugin.id);
      if (response.success && response.data) {
        setConfigValues(response.data.config || {});
        setConfigSchema(response.data.schema as Record<string, ConfigSchema> || null);
      }
    } catch {
      setSaveError("Failed to load plugin configuration");
    } finally {
      setIsLoadingConfig(false);
    }
  }, [plugin, isOpen]);

  useEffect(() => {
    if (isOpen && plugin) {
      loadConfig();
      setActiveTab("about");
    }
  }, [isOpen, plugin, loadConfig]);

  // Clear success message after a delay
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [saveSuccess]);

  const handleConfigChange = (key: string, value: unknown) => {
    setConfigValues((prev) => ({ ...prev, [key]: value }));
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSaveConfig = async () => {
    if (!plugin) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await updatePluginConfig(plugin.id, configValues);
      if (response.success) {
        setSaveSuccess(true);
        onSettingsSaved?.();
      } else {
        setSaveError(response.error || "Failed to save configuration");
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  if (!plugin) return null;

  // Determine which tabs to show
  const hasSettings = configSchema && Object.keys(configSchema).length > 0;
  const hasFAQ = plugin.faq && plugin.faq.length > 0;
  const hasChangelog = plugin.changelog && plugin.changelog.length > 0;

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={plugin.name}
      description="Plugin information and configuration"
      cancelButtonText="Close"
      maxWidth="600px"
    >
      <TabContext value={activeTab}>
        <TabBar
          tabs={[
            { label: "About", value: "about", icon: "Info" as const },
            ...(hasSettings || !isLoadingConfig
              ? [{ label: "Settings", value: "settings", icon: "Settings" as const }]
              : []),
            ...(hasFAQ ? [{ label: "FAQ", value: "faq", icon: "HelpCircle" as const }] : []),
            ...(hasChangelog ? [{ label: "Changelog", value: "changelog", icon: "History" as const }] : []),
          ]}
          activeTab={activeTab}
          onChange={(_e, value) => setActiveTab(value as TabType)}
        />

        <Box sx={{ mt: spacing.lg }}>
          {activeTab === "about" && <AboutTab plugin={plugin} />}
          {activeTab === "settings" && (
            <SettingsTab
              configSchema={configSchema}
              configValues={configValues}
              isLoading={isLoadingConfig}
              isSaving={isSaving}
              saveError={saveError}
              saveSuccess={saveSuccess}
              onConfigChange={handleConfigChange}
              onSave={handleSaveConfig}
            />
          )}
          {activeTab === "faq" && <FAQTab plugin={plugin} />}
          {activeTab === "changelog" && <ChangelogTab plugin={plugin} />}
        </Box>
      </TabContext>
    </StandardModal>
  );
};

export default PluginDetailsModal;

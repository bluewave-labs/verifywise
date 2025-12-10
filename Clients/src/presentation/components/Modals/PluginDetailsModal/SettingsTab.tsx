/**
 * SettingsTab - Dynamic form for plugin configuration
 * Uses VerifyWise components and theme variables for consistent styling
 */

import React from "react";
import { Stack, Box, Typography, CircularProgress } from "@mui/material";
import Field from "../../Inputs/Field";
import Toggle from "../../Inputs/Toggle";
import Select from "../../Inputs/Select";
import CustomizableButton from "../../Button/CustomizableButton";
import { SettingsTabProps, ConfigSchema } from "./types";
import {
  colors,
  spacing,
  typography,
} from "../../UserGuide/styles/theme";

const SettingsTab: React.FC<SettingsTabProps> = ({
  configSchema,
  configValues,
  isLoading,
  isSaving,
  saveError,
  saveSuccess,
  onConfigChange,
  onSave,
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} sx={{ color: colors.brand.primary }} />
      </Box>
    );
  }

  if (!configSchema || Object.keys(configSchema).length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography sx={{ fontSize: typography.fontSize.md, color: colors.text.muted }}>
          This plugin has no configurable settings.
        </Typography>
      </Box>
    );
  }

  const renderField = (key: string, schema: ConfigSchema) => {
    const value = configValues[key] ?? schema.default ?? "";
    const label = schema.label || key;

    // Boolean field - use Toggle component
    if (schema.type === "boolean") {
      return (
        <Box key={key}>
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            sx={{ gap: spacing.sm }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.secondary,
                  mb: spacing.xs,
                }}
              >
                {label}
              </Typography>
              {schema.description && (
                <Typography
                  sx={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.muted,
                    lineHeight: typography.lineHeight.relaxed,
                  }}
                >
                  {schema.description}
                </Typography>
              )}
            </Box>
            <Toggle
              checked={Boolean(value)}
              onChange={(e) => onConfigChange(key, e.target.checked)}
            />
          </Stack>
        </Box>
      );
    }

    // Enum/Select field - use Select component
    // Support both schema.enum and schema.options (from manifest.json "select" type)
    const selectOptions = schema.enum || schema.options;
    if (schema.type === "select" || (selectOptions && selectOptions.length > 0)) {
      const items = (selectOptions || []).map((option) => ({
        _id: option,
        name: option.charAt(0).toUpperCase() + option.slice(1), // Capitalize first letter
      }));

      return (
        <Box key={key}>
          <Select
            id={`config-${key}`}
            label={label}
            value={value as string}
            items={items}
            onChange={(e) => onConfigChange(key, e.target.value)}
            getOptionValue={(item) => item._id}
          />
          {schema.description && (
            <Typography
              sx={{
                fontSize: typography.fontSize.xs,
                color: colors.text.muted,
                mt: spacing.xs,
              }}
            >
              {schema.description}
            </Typography>
          )}
        </Box>
      );
    }

    // Number field - use Field component
    if (schema.type === "number") {
      return (
        <Field
          key={key}
          id={`config-${key}`}
          type="number"
          label={label}
          value={String(value)}
          onChange={(e) => onConfigChange(key, Number(e.target.value))}
          helperText={schema.description}
          min={schema.min}
          max={schema.max}
        />
      );
    }

    // String field (default) - use Field component
    return (
      <Field
        key={key}
        id={`config-${key}`}
        type={schema.secret ? "password" : "text"}
        label={label}
        value={String(value)}
        onChange={(e) => onConfigChange(key, e.target.value)}
        helperText={schema.description}
        isRequired={schema.required}
      />
    );
  };

  return (
    <Stack sx={{ gap: spacing.lg }}>
      {Object.entries(configSchema).map(([key, schema]) => renderField(key, schema))}

      {/* Save button and status */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{ gap: spacing.lg, pt: spacing.xs }}
      >
        <CustomizableButton
          variant="contained"
          text={isSaving ? "Saving..." : "Save settings"}
          onClick={onSave}
          isDisabled={isSaving}
          sx={{
            height: 34,
            fontSize: typography.fontSize.base,
            backgroundColor: colors.brand.primary,
            "&:hover": { backgroundColor: colors.brand.primaryDark },
          }}
        />
        {saveSuccess && (
          <Typography
            sx={{
              fontSize: typography.fontSize.base,
              color: colors.brand.success,
            }}
          >
            Settings saved successfully
          </Typography>
        )}
        {saveError && (
          <Typography
            sx={{
              fontSize: typography.fontSize.base,
              color: colors.brand.error,
            }}
          >
            {saveError}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};

export default SettingsTab;

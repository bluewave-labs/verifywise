import React, { useState } from "react";
import { Box, Stack, Typography, useTheme, Divider, Snackbar, FormControlLabel } from "@mui/material";
import { Copy, LayoutGrid, List, Square, CheckSquare2 } from "lucide-react";
import CodeBlock from "../CodeBlock";

// Mock Checkbox Component
interface MockCheckboxProps {
  id?: string;
  isChecked: boolean;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  size?: "small" | "medium" | "large";
  isDisabled?: boolean;
}

const MockCheckbox: React.FC<MockCheckboxProps> = ({
  isChecked,
  onChange,
  label,
  size = "medium",
  isDisabled = false,
}) => {
  const theme = useTheme();

  const sizeMap = {
    small: 20,
    medium: 24,
    large: 28,
  };

  const iconSizeMap = {
    small: 14,
    medium: 16,
    large: 18,
  };

  const checkboxSize = sizeMap[size];
  const iconSize = iconSizeMap[size];

  const checkboxElement = (
    <Box
      onClick={() => !isDisabled && onChange({ target: { checked: !isChecked } } as any)}
      sx={{
        width: checkboxSize,
        height: checkboxSize,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isDisabled ? "default" : "pointer",
        borderRadius: `${theme.shape.borderRadius}px`,
        opacity: isDisabled ? 0.4 : 1,
        transition: "all 150ms ease",
        "&:hover": !isDisabled ? {
          opacity: 0.8,
        } : {},
      }}
    >
      {isChecked ? (
        <CheckSquare2 size={iconSize} color={theme.palette.primary.main} />
      ) : (
        <Square size={iconSize} color={theme.palette.text.tertiary} />
      )}
    </Box>
  );

  if (label) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {checkboxElement}
        <Typography
          sx={{
            fontSize: 13,
            color: isDisabled ? theme.palette.text.accent : theme.palette.text.tertiary,
            cursor: isDisabled ? "default" : "pointer",
          }}
          onClick={() => !isDisabled && onChange({ target: { checked: !isChecked } } as any)}
        >
          {label}
        </Typography>
      </Box>
    );
  }

  return checkboxElement;
};

// Mock Toggle Component
interface MockToggleProps {
  checked: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const MockToggle: React.FC<MockToggleProps> = ({ checked, onChange, disabled = false }) => {
  const theme = useTheme();

  return (
    <Box
      onClick={() => !disabled && onChange?.({ target: { checked: !checked } } as any)}
      sx={{
        width: 36,
        height: 22,
        borderRadius: "4px",
        backgroundColor: checked ? "#13715B" : theme.palette.border?.light || "#d0d5dd",
        position: "relative",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 200ms ease",
        display: "inline-flex",
        alignItems: "center",
        padding: "0 4px",
      }}
    >
      <Box
        sx={{
          width: 14,
          height: 14,
          borderRadius: "4px",
          backgroundColor: "#fff",
          transition: "transform 200ms ease",
          transform: checked ? "translateX(14px)" : "translateX(0)",
        }}
      />
    </Box>
  );
};

// Mock ViewToggle Component
interface MockViewToggleProps {
  viewMode: "card" | "table";
  onViewChange: (mode: "card" | "table") => void;
  disabled?: boolean;
}

const MockViewToggle: React.FC<MockViewToggleProps> = ({ viewMode, onViewChange, disabled = false }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "inline-flex",
        border: `1px solid ${theme.palette.border?.dark || "#d0d5dd"}`,
        borderRadius: "4px",
        overflow: "hidden",
        height: 34,
      }}
    >
      {["card", "table"].map((mode) => (
        <Box
          key={mode}
          onClick={() => !disabled && onViewChange(mode as "card" | "table")}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px 12px",
            backgroundColor: viewMode === mode ? "#13715B" : "transparent",
            color: viewMode === mode ? theme.palette.background.paper : theme.palette.text.tertiary,
            cursor: disabled ? "default" : "pointer",
            opacity: disabled ? 0.4 : 1,
            transition: "all 150ms ease",
            "&:hover": !disabled ? {
              backgroundColor: viewMode === mode ? "#13715B" : theme.palette.background?.accent || "#f5f5f5",
            } : {},
          }}
        >
          {mode === "card" ? (
            <LayoutGrid size={16} />
          ) : (
            <List size={16} />
          )}
        </Box>
      ))}
    </Box>
  );
};

// Mock ButtonToggle Component
interface ButtonToggleOption {
  label: string;
  value: string;
}

interface MockButtonToggleProps {
  options: ButtonToggleOption[];
  value: string;
  onChange: (value: string) => void;
  height?: number;
}

const MockButtonToggle: React.FC<MockButtonToggleProps> = ({
  options,
  value,
  onChange,
  height = 34
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "inline-flex",
        backgroundColor: theme.palette.action?.hover || "#f5f5f5",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "4px",
        padding: "2px",
        height: height,
        position: "relative",
      }}
    >
      {options.map((option) => (
        <Box
          key={option.value}
          onClick={() => onChange(option.value)}
          sx={{
            minWidth: 120,
            padding: "0 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: value === option.value ? 500 : 400,
            color: theme.palette.text.primary,
            backgroundColor: value === option.value ? theme.palette.background.paper : "transparent",
            border: value === option.value ? "1px solid rgba(0,0,0,0.08)" : "1px solid transparent",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              backgroundColor: value === option.value
                ? theme.palette.background.paper
                : "rgba(0,0,0,0.04)",
            },
          }}
        >
          {option.label}
        </Box>
      ))}
    </Box>
  );
};

// Code snippets
const checkboxSnippets = {
  basic: `<Checkbox
  id="checkbox-1"
  isChecked={isChecked}
  value="option1"
  onChange={(e) => setIsChecked(e.target.checked)}
/>`,
  withLabel: `<Checkbox
  id="checkbox-2"
  label="Accept terms and conditions"
  isChecked={isChecked}
  value="terms"
  onChange={(e) => setIsChecked(e.target.checked)}
/>`,
  sizes: `// Small (20px)
<Checkbox id="sm" size="small" isChecked={checked} value="sm" onChange={...} />

// Medium (24px) - default
<Checkbox id="md" size="medium" isChecked={checked} value="md" onChange={...} />

// Large (28px)
<Checkbox id="lg" size="large" isChecked={checked} value="lg" onChange={...} />`,
  disabled: `<Checkbox
  id="disabled"
  label="Disabled option"
  isChecked={false}
  value="disabled"
  onChange={() => {}}
  isDisabled={true}
/>`,
};

const toggleSnippets = {
  basic: `<Toggle
  checked={isEnabled}
  onChange={(e) => setIsEnabled(e.target.checked)}
/>`,
  withLabel: `<FormControlLabel
  control={
    <Toggle
      checked={isEnabled}
      onChange={(e) => setIsEnabled(e.target.checked)}
    />
  }
  label="Enable notifications"
/>`,
  disabled: `<Toggle
  checked={false}
  disabled={true}
/>`,
};

const viewToggleSnippets = {
  basic: `<ViewToggle
  viewMode={viewMode}
  onViewChange={setViewMode}
/>`,
  disabled: `<ViewToggle
  viewMode="card"
  onViewChange={() => {}}
  disabled={true}
/>`,
};

const buttonToggleSnippets = {
  twoOptions: `<ButtonToggle
  options={[
    { label: "List", value: "list" },
    { label: "Grid", value: "grid" },
  ]}
  value={view}
  onChange={setView}
  height={34}
/>`,
  threeOptions: `<ButtonToggle
  options={[
    { label: "Day", value: "day" },
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
  ]}
  value={period}
  onChange={setPeriod}
/>`,
};

const TogglesSection: React.FC = () => {
  const theme = useTheme();
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Checkbox states
  const [basicChecked, setBasicChecked] = useState(false);
  const [labelChecked, setLabelChecked] = useState(true);
  const [smallChecked, setSmallChecked] = useState(true);
  const [mediumChecked, setMediumChecked] = useState(true);
  const [largeChecked, setLargeChecked] = useState(false);

  // Toggle states
  const [toggleEnabled, setToggleEnabled] = useState(true);
  const [toggleWithLabel, setToggleWithLabel] = useState(false);

  // ViewToggle state
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  // ButtonToggle states
  const [twoOptionValue, setTwoOptionValue] = useState("list");
  const [threeOptionValue, setThreeOptionValue] = useState("week");

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <Box sx={{ p: "32px 40px" }}>
      <Snackbar
        open={!!copiedText}
        autoHideDuration={2000}
        onClose={() => setCopiedText(null)}
        message="Copied to clipboard"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />

      {/* Page Header */}
      <Box sx={{ mb: "32px" }}>
        <Typography
          sx={{
            fontSize: 24,
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: "8px",
          }}
        >
          Toggles & checkboxes
        </Typography>
        <Typography
          sx={{
            fontSize: 14,
            color: theme.palette.text.tertiary,
            maxWidth: 600,
          }}
        >
          Selection controls for binary choices and view switching.
          Includes Checkbox, Toggle (Switch), ViewToggle, and ButtonToggle components.
        </Typography>
      </Box>

      {/* Checkbox */}
      <SpecSection title="Checkbox">
        <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary, mb: "24px" }}>
          Custom checkbox using lucide-react icons (Square, CheckSquare2) with MUI Checkbox.
          Supports optional labels via FormControlLabel wrapper.
        </Typography>

        <Box sx={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
          {/* Live Examples */}
          <Box sx={{ flex: "1 1 400px", minWidth: 320 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Basic usage
            </Typography>
            <Stack spacing="24px">
              <ExampleWithCode
                label="Without label (for tables)"
                code={checkboxSnippets.basic}
                onCopy={handleCopy}
              >
                <Box sx={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <MockCheckbox
                    id="basic-demo"
                    isChecked={basicChecked}
                    value="basic"
                    onChange={(e) => setBasicChecked(e.target.checked)}
                  />
                  <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary }}>
                    {basicChecked ? "Checked" : "Unchecked"}
                  </Typography>
                </Box>
              </ExampleWithCode>

              <ExampleWithCode
                label="With label"
                code={checkboxSnippets.withLabel}
                onCopy={handleCopy}
              >
                <MockCheckbox
                  id="label-demo"
                  label="Accept terms and conditions"
                  isChecked={labelChecked}
                  value="terms"
                  onChange={(e) => setLabelChecked(e.target.checked)}
                />
              </ExampleWithCode>
            </Stack>

            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", mt: "32px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Sizes
            </Typography>
            <Stack spacing="24px">
              <ExampleWithCode
                label="Size variants"
                code={checkboxSnippets.sizes}
                onCopy={handleCopy}
              >
                <Box sx={{ display: "flex", gap: "24px", alignItems: "center" }}>
                  <Box sx={{ textAlign: "center" }}>
                    <MockCheckbox
                      id="small-demo"
                      size="small"
                      isChecked={smallChecked}
                      value="small"
                      onChange={(e) => setSmallChecked(e.target.checked)}
                    />
                    <Typography sx={{ fontSize: 11, color: theme.palette.text.accent, mt: "4px" }}>
                      Small
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <MockCheckbox
                      id="medium-demo"
                      size="medium"
                      isChecked={mediumChecked}
                      value="medium"
                      onChange={(e) => setMediumChecked(e.target.checked)}
                    />
                    <Typography sx={{ fontSize: 11, color: theme.palette.text.accent, mt: "4px" }}>
                      Medium
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <MockCheckbox
                      id="large-demo"
                      size="large"
                      isChecked={largeChecked}
                      value="large"
                      onChange={(e) => setLargeChecked(e.target.checked)}
                    />
                    <Typography sx={{ fontSize: 11, color: theme.palette.text.accent, mt: "4px" }}>
                      Large
                    </Typography>
                  </Box>
                </Box>
              </ExampleWithCode>

              <ExampleWithCode
                label="Disabled state"
                code={checkboxSnippets.disabled}
                onCopy={handleCopy}
              >
                <MockCheckbox
                  id="disabled-demo"
                  label="Disabled option"
                  isChecked={false}
                  value="disabled"
                  onChange={() => {}}
                  isDisabled={true}
                />
              </ExampleWithCode>
            </Stack>
          </Box>

          {/* Specifications */}
          <Box sx={{ flex: "1 1 300px", minWidth: 280 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Component specifications
            </Typography>
            <SpecTable
              onCopy={handleCopy}
              specs={[
                { property: "Icon library", value: "lucide-react" },
                { property: "Unchecked icon", value: "Square" },
                { property: "Checked icon", value: "CheckSquare2" },
                { property: "Icon base size", value: "16px" },
                { property: "Small size", value: "20px" },
                { property: "Medium size", value: "24px" },
                { property: "Large size", value: "28px" },
                { property: "Border radius", value: "theme.shape.borderRadius" },
                { property: "Ripple effect", value: "disabled" },
                { property: "Label font size", value: "13px" },
                { property: "Label color", value: "text.tertiary" },
              ]}
            />
          </Box>
        </Box>
      </SpecSection>

      <Divider sx={{ my: "32px" }} />

      {/* Toggle (Switch) */}
      <SpecSection title="Toggle (Switch)">
        <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary, mb: "24px" }}>
          Custom styled MUI Switch component. Uses square corners to match checkbox style.
          Green when active, border.light color when inactive.
        </Typography>

        <Box sx={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
          {/* Live Examples */}
          <Box sx={{ flex: "1 1 400px", minWidth: 320 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Usage examples
            </Typography>
            <Stack spacing="24px">
              <ExampleWithCode
                label="Basic toggle"
                code={toggleSnippets.basic}
                onCopy={handleCopy}
              >
                <Box sx={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <MockToggle
                    checked={toggleEnabled}
                    onChange={(e) => setToggleEnabled(e.target.checked)}
                  />
                  <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary }}>
                    {toggleEnabled ? "Enabled" : "Disabled"}
                  </Typography>
                </Box>
              </ExampleWithCode>

              <ExampleWithCode
                label="With FormControlLabel"
                code={toggleSnippets.withLabel}
                onCopy={handleCopy}
              >
                <FormControlLabel
                  control={
                    <MockToggle
                      checked={toggleWithLabel}
                      onChange={(e) => setToggleWithLabel(e.target.checked)}
                    />
                  }
                  label="Enable notifications"
                  sx={{
                    "& .MuiFormControlLabel-label": {
                      fontSize: 13,
                      color: theme.palette.text.secondary,
                    },
                  }}
                />
              </ExampleWithCode>

              <ExampleWithCode
                label="Disabled state"
                code={toggleSnippets.disabled}
                onCopy={handleCopy}
              >
                <Box sx={{ display: "flex", gap: "24px" }}>
                  <Box sx={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <MockToggle checked={false} disabled={true} />
                    <Typography sx={{ fontSize: 12, color: theme.palette.text.accent }}>
                      Off (disabled)
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <MockToggle checked={true} disabled={true} />
                    <Typography sx={{ fontSize: 12, color: theme.palette.text.accent }}>
                      On (disabled)
                    </Typography>
                  </Box>
                </Box>
              </ExampleWithCode>
            </Stack>
          </Box>

          {/* Specifications */}
          <Box sx={{ flex: "1 1 300px", minWidth: 280 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Component specifications
            </Typography>
            <SpecTable
              onCopy={handleCopy}
              specs={[
                { property: "Width", value: "36px" },
                { property: "Height", value: "22px" },
                { property: "Thumb size", value: "14px" },
                { property: "Thumb color", value: "#fff" },
                { property: "Track radius", value: "4px" },
                { property: "Thumb radius", value: "4px" },
                { property: "Active color", value: "#13715B" },
                { property: "Inactive color", value: "border.light" },
                { property: "Transition", value: "200ms" },
                { property: "Ripple effect", value: "disabled" },
              ]}
            />
          </Box>
        </Box>
      </SpecSection>

      <Divider sx={{ my: "32px" }} />

      {/* ViewToggle */}
      <SpecSection title="ViewToggle">
        <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary, mb: "24px" }}>
          Toggle button group for switching between card and table views.
          Uses lucide-react icons (LayoutGrid, List) with MUI ToggleButtonGroup.
        </Typography>

        <Box sx={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
          {/* Live Examples */}
          <Box sx={{ flex: "1 1 400px", minWidth: 320 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Usage examples
            </Typography>
            <Stack spacing="24px">
              <ExampleWithCode
                label="View mode toggle"
                code={viewToggleSnippets.basic}
                onCopy={handleCopy}
              >
                <Box sx={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <MockViewToggle
                    viewMode={viewMode}
                    onViewChange={setViewMode}
                  />
                  <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary }}>
                    Current: {viewMode} view
                  </Typography>
                </Box>
              </ExampleWithCode>

              <ExampleWithCode
                label="Disabled state"
                code={viewToggleSnippets.disabled}
                onCopy={handleCopy}
              >
                <MockViewToggle
                  viewMode="card"
                  onViewChange={() => {}}
                  disabled={true}
                />
              </ExampleWithCode>
            </Stack>
          </Box>

          {/* Specifications */}
          <Box sx={{ flex: "1 1 300px", minWidth: 280 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Component specifications
            </Typography>
            <SpecTable
              onCopy={handleCopy}
              specs={[
                { property: "Height", value: "34px" },
                { property: "Button padding", value: "6px 12px" },
                { property: "Icon size", value: "16px" },
                { property: "Border", value: "1px solid border.dark" },
                { property: "Selected bg", value: "#13715B" },
                { property: "Selected color", value: "background.main" },
                { property: "Unselected color", value: "text.tertiary" },
                { property: "Hover bg", value: "background.accent" },
                { property: "Options", value: "card | table" },
              ]}
            />
          </Box>
        </Box>
      </SpecSection>

      <Divider sx={{ my: "32px" }} />

      {/* ButtonToggle */}
      <SpecSection title="ButtonToggle">
        <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary, mb: "24px" }}>
          Segmented control with sliding indicator. Supports any number of options.
          Used for switching between related views or time periods.
        </Typography>

        <Box sx={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
          {/* Live Examples */}
          <Box sx={{ flex: "1 1 400px", minWidth: 320 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Usage examples
            </Typography>
            <Stack spacing="24px">
              <ExampleWithCode
                label="Two options"
                code={buttonToggleSnippets.twoOptions}
                onCopy={handleCopy}
              >
                <MockButtonToggle
                  options={[
                    { label: "List", value: "list" },
                    { label: "Grid", value: "grid" },
                  ]}
                  value={twoOptionValue}
                  onChange={setTwoOptionValue}
                  height={34}
                />
              </ExampleWithCode>

              <ExampleWithCode
                label="Three options"
                code={buttonToggleSnippets.threeOptions}
                onCopy={handleCopy}
              >
                <MockButtonToggle
                  options={[
                    { label: "Day", value: "day" },
                    { label: "Week", value: "week" },
                    { label: "Month", value: "month" },
                  ]}
                  value={threeOptionValue}
                  onChange={setThreeOptionValue}
                />
              </ExampleWithCode>
            </Stack>
          </Box>

          {/* Specifications */}
          <Box sx={{ flex: "1 1 300px", minWidth: 280 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Component specifications
            </Typography>
            <SpecTable
              onCopy={handleCopy}
              specs={[
                { property: "Height", value: "34px (default)" },
                { property: "Border radius", value: "4px" },
                { property: "Border", value: "1px solid divider" },
                { property: "Container bg", value: "action.hover" },
                { property: "Container padding", value: "2px" },
                { property: "Option min-width", value: "120px" },
                { property: "Option padding", value: "0 10px" },
                { property: "Font size", value: "13px" },
                { property: "Active bg", value: "background.paper" },
                { property: "Active border", value: "1px solid rgba(0,0,0,0.08)" },
                { property: "Slider transition", value: "0.3s cubic-bezier" },
              ]}
            />
          </Box>
        </Box>
      </SpecSection>

      {/* Developer Checklist */}
      <Box
        sx={{
          mt: "40px",
          p: "24px",
          backgroundColor: theme.palette.background.accent,
          borderRadius: "4px",
          border: `1px solid ${theme.palette.border.light}`,
        }}
      >
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: "16px",
          }}
        >
          Developer checklist
        </Typography>
        <Stack spacing="8px">
          {[
            "Use Checkbox component for selection lists and table rows (not MUI Checkbox directly)",
            "Use Toggle component for on/off settings (not MUI Switch directly)",
            "Use ViewToggle for card/table view switching on list pages",
            "Use ButtonToggle for segmented controls with 2+ text options",
            "All components have ripple disabled for consistent feel",
            "Checkbox without label prop returns just the checkbox element (for tables)",
            "Toggle uses square corners (4px radius) to match checkbox style",
            "Always provide unique id prop for Checkbox (required for accessibility)",
          ].map((item, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: theme.palette.primary.main,
                  mt: "6px",
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>
                {item}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

// Helper Components

const SpecSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  const theme = useTheme();
  return (
    <Box sx={{ mb: "16px" }}>
      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 600,
          color: theme.palette.text.primary,
          mb: "16px",
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
};

const SpecTable: React.FC<{
  specs: { property: string; value: string }[];
  onCopy: (text: string) => void;
}> = ({ specs, onCopy }) => {
  const theme = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.alt,
        borderRadius: "4px",
        border: `1px solid ${theme.palette.border.light}`,
        overflow: "hidden",
      }}
    >
      {specs.map((spec, index) => (
        <Box
          key={index}
          onClick={() => onCopy(spec.value)}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: "10px 14px",
            borderBottom:
              index < specs.length - 1
                ? `1px solid ${theme.palette.border.light}`
                : "none",
            cursor: "pointer",
            transition: "background-color 150ms ease",
            "&:hover": {
              backgroundColor: theme.palette.background.fill,
            },
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              color: theme.palette.text.secondary,
            }}
          >
            {spec.property}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 500,
                color: theme.palette.text.primary,
                fontFamily: "monospace",
              }}
            >
              {spec.value}
            </Typography>
            {hoveredIndex === index && (
              <Copy size={12} color={theme.palette.primary.main} />
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const ExampleWithCode: React.FC<{
  label: string;
  code: string;
  onCopy: (text: string) => void;
  children: React.ReactNode;
}> = ({ label, code, onCopy, children }) => {
  const theme = useTheme();
  const [showCode, setShowCode] = useState(true);

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.border.light}`,
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: "8px 12px",
          backgroundColor: theme.palette.background.alt,
          borderBottom: `1px solid ${theme.palette.border.light}`,
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 500,
            color: theme.palette.text.secondary,
          }}
        >
          {label}
        </Typography>
        <Box
          onClick={() => setShowCode(!showCode)}
          sx={{
            fontSize: 11,
            color: showCode ? theme.palette.primary.main : theme.palette.text.tertiary,
            cursor: "pointer",
            "&:hover": {
              color: theme.palette.primary.main,
            },
          }}
        >
          {showCode ? "Hide code" : "Show code"}
        </Box>
      </Box>

      <Box sx={{ p: "16px", backgroundColor: theme.palette.background.main }}>
        {children}
      </Box>

      {showCode && (
        <Box sx={{ borderTop: `1px solid ${theme.palette.border.light}` }}>
          <CodeBlock code={code} language="tsx" onCopy={onCopy} />
        </Box>
      )}
    </Box>
  );
};

export default TogglesSection;

import React, { useState } from "react";
import { Drawer, Box, Typography, Stack, IconButton } from "@mui/material";
import { X as CloseIcon } from "lucide-react";
import ModelInventoryHistoryChart from "../Charts/ModelInventoryHistoryChart";
import RiskHistoryChart from "../Charts/RiskHistoryChart";
import ButtonToggle from "../ButtonToggle";

interface ParameterOption {
  value: string;
  label: string;
}

interface AnalyticsDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  entityName: string; // e.g., "Model", "Risk", "Vendor"
  availableParameters: ParameterOption[];
  defaultParameter?: string;
  chartType?: "model" | "risk"; // Type of chart to display
}

/**
 * Generic Analytics Drawer Component
 *
 * This component can be reused across different entities (Model Inventory, Risks, Vendors, etc.)
 * to display historical trends and analytics.
 *
 * @example
 * // For Model Inventory
 * <AnalyticsDrawer
 *   open={isOpen}
 *   onClose={handleClose}
 *   title="Analytics & Trends"
 *   description="Track your model inventory history over time"
 *   entityName="Model"
 *   availableParameters={[{ value: "status", label: "Status" }]}
 * />
 *
 * @example
 * // For Project Risks
 * <AnalyticsDrawer
 *   open={isOpen}
 *   onClose={handleClose}
 *   title="Risk Analytics"
 *   description="Monitor risk trends and patterns"
 *   entityName="Risk"
 *   availableParameters={[
 *     { value: "risk_level", label: "Risk Level" },
 *     { value: "category", label: "Category" }
 *   ]}
 * />
 */
const AnalyticsDrawer: React.FC<AnalyticsDrawerProps> = ({
  open,
  onClose,
  title,
  description,
  entityName,
  availableParameters,
  defaultParameter,
  chartType = "model", // Default to model chart for backward compatibility
}) => {
  const [selectedParameter, setSelectedParameter] = useState<string>(
    defaultParameter || availableParameters[0]?.value || ""
  );

  const handleParameterChange = (newParameter: string) => {
    setSelectedParameter(newParameter);
  };

  // Get the label for the selected parameter
  const selectedParameterLabel = availableParameters.find(
    (p) => p.value === selectedParameter
  )?.label || "Parameter";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "100%", sm: "600px", md: "800px" },
          padding: "24px",
        },
      }}
    >
      <Box>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#2D3748" }}>
              {title}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#8594AC", mt: 0.5 }}>
              {description}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              color: "#6B7280",
              "&:hover": {
                backgroundColor: "#F3F4F6",
              },
            }}
          >
            <CloseIcon size={20} />
          </IconButton>
        </Stack>

        {/* Parameter Selection */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#2D3748" }}>
            Historical Trends
          </Typography>
          <ButtonToggle
            options={availableParameters}
            value={selectedParameter}
            onChange={handleParameterChange}
          />
        </Box>

        {/* Chart */}
        {chartType === "model" ? (
          <ModelInventoryHistoryChart
            parameter={selectedParameter}
            title={`${entityName} ${selectedParameterLabel} Over Time`}
            height={400}
          />
        ) : (
          <RiskHistoryChart
            parameter={selectedParameter}
            title={`${entityName} ${selectedParameterLabel} Over Time`}
            height={400}
          />
        )}
      </Box>
    </Drawer>
  );
};

export default AnalyticsDrawer;

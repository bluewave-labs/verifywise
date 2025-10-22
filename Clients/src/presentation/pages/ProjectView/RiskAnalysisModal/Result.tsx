import React from "react";
import { Stack, Typography, Box, useTheme } from "@mui/material";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  RotateCcw,
  Save,
} from "lucide-react";
import { ResultsDisplayProps } from "./iQuestion";
import CustomizableButton from "../../../components/Button/CustomizableButton";

const Results: React.FC<ResultsDisplayProps> = ({
  classification,
  onRestart,
  onSave,
}) => {
  const theme = useTheme();

  // Get styling based on risk level
  const getLevelConfig = () => {
    switch (classification.level) {
      case "PROHIBITED":
        return {
          color: "#D32F2F",
          bgColor: "#FFEBEE",
          icon: <AlertCircle size={32} />,
          title: "Prohibited Practice",
          description:
            "This AI system falls under prohibited practices and cannot be deployed under the EU AI Act.",
        };
      case "HIGH_RISK":
        return {
          color: "#F57C00",
          bgColor: "#FFF3E0",
          icon: <AlertTriangle size={32} />,
          title: "High-Risk AI System",
          description:
            "This AI system is classified as high-risk and must comply with strict regulatory requirements.",
        };
      case "LIMITED_RISK":
        return {
          color: "#FBC02D",
          bgColor: "#FFFDE7",
          icon: <Info size={32} />,
          title: "Limited Risk - Transparency Requirements",
          description:
            "This AI system has limited risk but requires specific transparency obligations.",
        };
      case "MINIMAL_RISK":
        return {
          color: "#388E3C",
          bgColor: "#E8F5E9",
          icon: <CheckCircle size={32} />,
          title: "Minimal Risk",
          description:
            "This AI system is classified as minimal risk with no specific regulatory obligations under the EU AI Act.",
        };
      default:
        return {
          color: theme.palette.text.secondary,
          bgColor: theme.palette.background.paper,
          icon: <Info size={32} />,
          title: "Assessment Pending",
          description:
            "Complete the questionnaire to receive your classification.",
        };
    }
  };

  const config = getLevelConfig();

  return (
    <Stack spacing={3}>
      {/* Classification Header */}
      <Box
        sx={{
          bgcolor: config.bgColor,
          border: 2,
          borderColor: config.color,
          borderRadius: 2,
          p: 3,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ color: config.color }}>{config.icon}</Box>
          <Stack flex={1}>
            <Typography
              fontSize={20}
              fontWeight={700}
              color={config.color}
              mb={0.5}
            >
              {config.title}
            </Typography>
            <Typography fontSize={14} color="text.secondary">
              {config.description}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        {onRestart && (
          <CustomizableButton
            variant="outlined"
            text="Start New Assessment"
            icon={<RotateCcw size={16} />}
            onClick={onRestart}
          />
        )}
        {onSave && (
          <CustomizableButton
            variant="contained"
            text="Save Results"
            icon={<Save size={16} />}
            onClick={onSave}
            sx={{
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              "&:hover": {
                backgroundColor: "#0F5A48",
              },
            }}
          />
        )}
      </Stack>
    </Stack>
  );
};

export default Results;

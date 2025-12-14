import { lazy, Suspense, useState } from "react";
import {
  Box,
  Popover,
  Typography,
  useTheme,
} from "@mui/material";
import { ChevronDown, FileText, Building2 } from "lucide-react";
import CustomizableButton from "../../../components/Button/CustomizableButton";
const GenerateReportPopup = lazy(
  () => import("../../../components/Reporting/GenerateReport")
);
const ReportStatus = lazy(() => import("./ReportStatus"));
import { styles } from "./styles";
import { useProjects } from "../../../../application/hooks/useProjects";

interface ReportTypeOption {
  id: "project" | "organization";
  label: string;
  description: string;
  icon: React.ReactNode;
}

const REPORT_TYPE_OPTIONS: ReportTypeOption[] = [
  {
    id: "project",
    label: "Use case report",
    description: "Generate a report for a specific AI use case with its associated risks, compliance status, and assessments.",
    icon: <FileText size={20} strokeWidth={1.5} />,
  },
  {
    id: "organization",
    label: "Organization report",
    description: "Generate a comprehensive report across all use cases, vendors, models, and organization-wide metrics.",
    icon: <Building2 size={20} strokeWidth={1.5} />,
  },
];

interface GenerateReportProps {
  onReportGenerated?: () => void;
}

const GenerateReport: React.FC<GenerateReportProps> = ({
  onReportGenerated,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedReportType, setSelectedReportType] = useState<
    "project" | "organization" | null
  >(null);
  const { data: projects } = useProjects();
  const isDisabled = projects?.length && projects?.length > 0 ? false : true;

  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOptionSelect = (option: ReportTypeOption) => {
    setSelectedReportType(option.id);
    setIsModalOpen(true);
    handleClose();
  };

  const open = Boolean(anchorEl);
  const popoverId = open ? "generate-report-popover" : undefined;

  return (
    <>
      <Box sx={styles.container}>
        <span data-joyride-id="generate-report-button">
          <CustomizableButton
            variant="contained"
            onClick={handleButtonClick}
            isDisabled={isDisabled}
            endIcon={<ChevronDown size={16} />}
            sx={{
              ...styles.buttonStyle,
              width: "fit-content",
              border: isDisabled ? "1px solid #dddddd" : "1px solid #13715B",
            }}
          >
            Generate report
          </CustomizableButton>
        </span>

        <Popover
          id={popoverId}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          sx={{
            mt: 0.5,
            "& .MuiPopover-paper": {
              borderRadius: "4px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
              border: `1px solid ${theme.palette.border.light}`,
              overflow: "hidden",
              minWidth: "320px",
              maxWidth: "380px",
            },
          }}
        >
          <Box sx={{ p: 1 }}>
            {REPORT_TYPE_OPTIONS.map((option) => (
              <Box
                key={option.id}
                onClick={() => handleOptionSelect(option)}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "background-color 0.15s ease",
                  "&:hover": {
                    backgroundColor: theme.palette.background.alt,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "4px",
                    backgroundColor: theme.palette.background.alt,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "#13715B",
                  }}
                >
                  {option.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      mb: 0.25,
                    }}
                  >
                    {option.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: theme.palette.text.secondary,
                      lineHeight: 1.4,
                    }}
                  >
                    {option.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Popover>

        {/* Render generate report status */}
        <Suspense fallback={"loading..."}>
          <ReportStatus isDisabled={isDisabled} />
        </Suspense>
      </Box>

      {isModalOpen && (
        <Suspense fallback={"loading..."}>
          <GenerateReportPopup
            onClose={() => {
              setIsModalOpen(false);
              setSelectedReportType(null);
            }}
            onReportGenerated={onReportGenerated}
            reportType={selectedReportType}
          />
        </Suspense>
      )}
    </>
  );
};

export default GenerateReport;

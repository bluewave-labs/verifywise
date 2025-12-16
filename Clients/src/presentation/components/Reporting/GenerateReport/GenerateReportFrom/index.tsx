import React, {
  useState,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useEffect,
} from "react";
import {
  Stack,
  useTheme,
  SelectChangeEvent,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
const Field = lazy(() => import("../../../Inputs/Field"));
import { fieldStyle } from "./styles";
const Select = lazy(() => import("../../../../components/Inputs/Select"));
import { VerifyWiseContext } from "../../../../../application/contexts/VerifyWise.context";
import {
  Project,
  FrameworkValues,
} from "../../../../../application/interfaces/appStates";
import { FileText, FileType } from "lucide-react";
import { ReportFormat } from "../../../../../domain/interfaces/i.widget";

interface BasicFormValues {
  project: number | null;
  framework: number;
  projectFrameworkId: number;
  reportName: string;
  format: ReportFormat;
}

interface FormErrors {
  project?: string;
  framework?: string;
}

const initialFrameworkValue: FrameworkValues = {
  project_framework_id: 1,
  framework_id: 1,
  name: "EU AI Act",
};

interface ReportProps {
  reportType: "project" | "organization" | null;
  values: BasicFormValues;
  onValuesChange: (values: BasicFormValues) => void;
  onValidateRef?: React.MutableRefObject<(() => boolean) | null>;
}

const GenerateReportFrom: React.FC<ReportProps> = ({
  reportType,
  values,
  onValuesChange,
  onValidateRef,
}) => {
  const { dashboardValues } = useContext(VerifyWiseContext);
  const [errors, setErrors] = useState<FormErrors>({});
  const theme = useTheme();

  const isOrganizational = reportType === "organization";

  // Get projects based on report type
  const availableProjects = useMemo(() => {
    const projects = Array.isArray(dashboardValues.projects)
      ? dashboardValues.projects
      : [];

    if (isOrganizational) {
      // For organizational reports, show only organizational projects
      return projects.filter((p: Project) => p.is_organizational === true);
    } else {
      // For use case reports, show non-organizational projects
      return projects.filter((p: Project) => !p.is_organizational);
    }
  }, [dashboardValues.projects, isOrganizational]);

  // Get frameworks for organizational reports
  const organizationFrameworks = useMemo<FrameworkValues[]>(() => {
    const projects = Array.isArray(dashboardValues.projects)
      ? dashboardValues.projects
      : [];
    const allFrameworks: FrameworkValues[] = projects
      .flatMap((p: Project) => (Array.isArray(p.framework) ? p.framework : []))
      .filter(
        (f: FrameworkValues) =>
          typeof f?.framework_id === "number" && !!f?.name && f.framework_id !== 1
      );

    const deduped = new Map<number, FrameworkValues>();
    for (const f of allFrameworks) {
      if (!deduped.has(f.framework_id)) deduped.set(f.framework_id, f);
    }
    const list = Array.from(deduped.values());
    return list.length > 0 ? list : [initialFrameworkValue];
  }, [dashboardValues.projects]);

  // Get frameworks for selected project (use case reports)
  const projectFrameworks = useMemo<FrameworkValues[]>(() => {
    const projects = Array.isArray(dashboardValues.projects)
      ? dashboardValues.projects
      : [];
    const selectedProject = projects.find(
      (project: Project) => project.id === values.project
    );

    const frameworks = selectedProject?.framework;

    return Array.isArray(frameworks) && frameworks.length > 0
      ? frameworks
      : [initialFrameworkValue];
  }, [dashboardValues.projects, values.project]);

  // Update projectFrameworkId when project or framework changes
  useEffect(() => {
    const frameworks = isOrganizational ? organizationFrameworks : projectFrameworks;
    const matchingFramework = frameworks.find(
      (pf) => pf.framework_id === values.framework
    );
    if (matchingFramework) {
      onValuesChange({
        ...values,
        projectFrameworkId: matchingFramework.project_framework_id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.project, values.framework, isOrganizational]);

  // Auto-select first framework when project changes (for use case reports)
  useEffect(() => {
    if (!isOrganizational && values.project && projectFrameworks.length > 0) {
      const firstFramework = projectFrameworks[0];
      onValuesChange({
        ...values,
        framework: firstFramework.framework_id,
        projectFrameworkId: firstFramework.project_framework_id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.project, isOrganizational]);

  const handleOnTextFieldChange = useCallback(
    (prop: keyof BasicFormValues) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        onValuesChange({ ...values, [prop]: event.target.value });
        setErrors({ ...errors, [prop]: "" });
      },
    [values, errors, onValuesChange]
  );

  const handleOnSelectChange = useCallback(
    (prop: keyof BasicFormValues) =>
      (event: SelectChangeEvent<string | number>) => {
        const value = event.target.value;
        onValuesChange({
          ...values,
          [prop]: typeof value === "string" ? parseInt(value, 10) : value,
        });
        setErrors({ ...errors, [prop]: "" });
      },
    [values, errors, onValuesChange]
  );

  const handleFormatChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newFormat: ReportFormat | null) => {
      if (newFormat !== null) {
        onValuesChange({ ...values, format: newFormat });
      }
    },
    [values, onValuesChange]
  );

  // Validation function
  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};

    if (!values.project) {
      newErrors.project = isOrganizational
        ? "Please select an organizational project"
        : "Please select a use case";
    }

    if (isOrganizational && !values.framework) {
      newErrors.framework = "Please select a framework";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, isOrganizational]);

  // Expose validation function to parent
  useEffect(() => {
    if (onValidateRef) {
      onValidateRef.current = validateForm;
    }
  }, [onValidateRef, validateForm]);

  return (
    <Stack spacing={6}>
      {/* Use Case / Organizational Project Selection */}
      <Suspense fallback={<div>Loading...</div>}>
        <Select
          id="project-input"
          label={isOrganizational ? "Organizational project" : "Use case"}
          placeholder={
            isOrganizational
              ? "Select organizational project"
              : "Select use case"
          }
          value={values.project?.toString() ?? ""}
          onChange={handleOnSelectChange("project")}
          items={
            availableProjects?.map((project: Project) => ({
              _id: project.id,
              name: project.project_title || `Project ${project.id}`,
            })) || []
          }
          sx={{
            width: "100%",
            backgroundColor: theme.palette.background.main,
          }}
          error={errors.project}
          isRequired
        />
      </Suspense>

      {/* Framework Selection - Only for organizational reports */}
      {isOrganizational && (
        <Suspense fallback={<div>Loading...</div>}>
          <Select
            id="framework-input"
            label="Framework"
            placeholder="Select framework"
            value={values.framework}
            onChange={handleOnSelectChange("framework")}
            items={
              organizationFrameworks?.map((framework) => ({
                _id: framework.framework_id,
                name: framework.name,
              })) || []
            }
            sx={{
              width: "100%",
              backgroundColor: theme.palette.background.main,
            }}
            error={errors.framework}
            isRequired
          />
        </Suspense>
      )}

      {/* Report Name */}
      <Suspense fallback={<div>Loading...</div>}>
        <Field
          id="report-name"
          label="Report name"
          placeholder="Enter a name for your report"
          width="100%"
          value={values.reportName}
          onChange={handleOnTextFieldChange("reportName")}
          sx={fieldStyle}
        />
      </Suspense>

      {/* Export Format */}
      <Stack>
        <Typography sx={{ fontSize: "13px", fontWeight: 500, mb: 2 }}>
          Export format
        </Typography>
        <ToggleButtonGroup
          value={values.format}
          exclusive
          onChange={handleFormatChange}
          aria-label="report format"
          sx={{
            width: "100%",
            "& .MuiToggleButtonGroup-grouped": {
              flex: 1,
              border: `1px solid ${theme.palette.border.dark}`,
              borderRadius: "4px !important",
              "&:not(:first-of-type)": {
                marginLeft: "8px",
                borderLeft: `1px solid ${theme.palette.border.dark}`,
              },
              "&.Mui-selected": {
                backgroundColor: theme.palette.background.accent,
                borderColor: "#13715B",
                color: "#13715B",
                "&:hover": {
                  backgroundColor: theme.palette.background.accent,
                },
              },
              "&:hover": {
                backgroundColor: theme.palette.background.alt,
              },
            },
          }}
        >
          <ToggleButton
            value="pdf"
            aria-label="PDF document"
            sx={{
              textTransform: "none",
              fontSize: "13px",
              fontWeight: 500,
              height: "34px",
              gap: 1,
            }}
          >
            <FileType size={16} />
            PDF
          </ToggleButton>
          <ToggleButton
            value="docx"
            aria-label="Word document"
            sx={{
              textTransform: "none",
              fontSize: "13px",
              fontWeight: 500,
              height: "34px",
              gap: 1,
            }}
          >
            <FileText size={16} />
            Word (.docx)
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </Stack>
  );
};

export default GenerateReportFrom;

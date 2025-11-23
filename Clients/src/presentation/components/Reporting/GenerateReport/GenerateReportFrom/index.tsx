import React, {
  useState,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useEffect,
} from "react";
import { Stack, useTheme, SelectChangeEvent, Autocomplete, TextField, Typography, Box } from "@mui/material";
const Field = lazy(() => import("../../../Inputs/Field"));
import { fieldStyle } from "./styles";
import { EUAI_REPORT_TYPES, ISO_REPORT_TYPES } from "../constants";
const Select = lazy(() => import("../../../../components/Inputs/Select"));
import { VerifyWiseContext } from "../../../../../application/contexts/VerifyWise.context";
import { Project, FrameworkValues } from "../../../../../application/interfaces/appStates";
import { ChevronDown } from "lucide-react";
import { getAutocompleteStyles } from "../../../../utils/inputStyles";

/**
 * Set form values
 */
interface FormValues {
  report_type: string[] | string;
  report_name: string;
  project: number | null;
  framework: number;
  projectFrameworkId: number;
  reportType?: 'project' | 'organization' | null;
}

interface FormErrors {
  report_type?: string;
  report_name?: string;
  project?: string;
  framework?: string;
  projectFrameworkId?: string;
}

const initialState: FormValues = {
  report_type: ["Project risks report"],
  report_name: "",
  project: null,
  framework: 1,
  projectFrameworkId: 1,
};

const initialFrameworkValue: FrameworkValues = {
  project_framework_id: 1,
  framework_id: 1,
  name: "EU AI Act",
};

interface ReportProps {
  onGenerate: (formValues: FormValues & { reportType?: 'project' | 'organization' | null }) => void;
  reportType: 'project' | 'organization' | null;
  onSubmitRef?: React.MutableRefObject<(() => void) | null>;
}

const GenerateReportFrom: React.FC<ReportProps> = ({ onGenerate, reportType, onSubmitRef }) => {
  const { dashboardValues } = useContext(VerifyWiseContext);
  const [values, setValues] = useState<FormValues>({
    ...initialState,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const theme = useTheme();

  useEffect(() => {
    const availableTypes =
      values.framework === 1 ? EUAI_REPORT_TYPES : ISO_REPORT_TYPES;

    if (!availableTypes.includes(values.report_type as unknown as string)) {
      setValues((prev) => ({
        ...prev,
        report_type: [availableTypes[0]],
      }));

      setErrors((prev) => ({
        ...prev,
        report_type: undefined,
      }));
    }
  }, [values.framework]);

  const handleOnTextFieldChange = useCallback(
    (prop: keyof FormValues) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setValues({ ...values, [prop]: event.target.value });
        setErrors({ ...errors, [prop]: "" });
      },
    [values, errors]
  );

  const handleOnSelectChange = useCallback(
    (prop: keyof FormValues) => (event: SelectChangeEvent<string | number>) => {
      setValues({ ...values, [prop]: event.target.value });
      setErrors({ ...errors, [prop]: "" });
    },
    [values, errors]
  );

  const projectFrameworks = useMemo<FrameworkValues[]>(() => {
    const projects = Array.isArray(dashboardValues.projects) ? dashboardValues.projects : [];
    const selectedProject = projects.find(
      (project: Project) => project.id === values.project
    );

    const frameworks = selectedProject?.framework;

    return Array.isArray(frameworks) && frameworks.length > 0
      ? frameworks
      : [initialFrameworkValue];
  }, [dashboardValues.projects, values.project]);

  const organizationalProjects = useMemo(() => {
    const projects = Array.isArray(dashboardValues.projects) ? dashboardValues.projects : [];
    return projects.filter((p: Project) => p.is_organizational === true);
  }, [dashboardValues.projects]);

  const organizationFrameworks = useMemo<FrameworkValues[]>(() => {
    const projects = Array.isArray(dashboardValues.projects) ? dashboardValues.projects : [];
    const allFrameworks: FrameworkValues[] = projects
      .flatMap((p: Project) => Array.isArray(p.framework) ? p.framework : [])
      .filter((f: FrameworkValues) => typeof f?.framework_id === "number" && !!f?.name && f.framework_id !== 1);

    const deduped = new Map<number, FrameworkValues>();
    for (const f of allFrameworks) {
      if (!deduped.has(f.framework_id)) deduped.set(f.framework_id, f);
    }
    const list = Array.from(deduped.values());
    return list.length > 0 ? list : [initialFrameworkValue];
  }, [dashboardValues.projects]);

  const projectFrameworkId = useMemo(() => {
    return (
      projectFrameworks.find((pf) => pf.framework_id === values.framework)
        ?.project_framework_id ?? 1
    );
  }, [projectFrameworks, values.framework]);

  const handleFormSubmit = () => {
    const normalizedReportType = Array.isArray(values.report_type)
      ? values.report_type.length === 1
        ? values.report_type[0]
        : values.report_type
      : values.report_type;

    const finalValues = {
      ...values,
      report_type: normalizedReportType,
      projectFrameworkId: projectFrameworkId,
      reportType: reportType,
    };

    onGenerate(finalValues);
  };

  const euActProjects = Array.isArray(dashboardValues.projects) ? dashboardValues.projects?.filter(
    (project: Project) => project.framework?.some(f => f.framework_id === 1)
  ) : [];

  useEffect(() => {
    if (onSubmitRef) {
      onSubmitRef.current = handleFormSubmit;
    }
  }, [onSubmitRef, values, projectFrameworkId]);

  return (
    <Stack spacing={6}>
        {reportType === 'project' && (
          <Suspense fallback={<div>Loading...</div>}>
            <Select
              id="project-input"
              label="Project"
              placeholder="Select project"
              value={values.project?.toString() ?? ""}
              onChange={handleOnSelectChange("project")}
              items={
                euActProjects?.map(
                  (project: Project) => ({
                    _id: project.id,
                    name: project.project_title || `Project ${project.id}`,
                  })
                ) || []
              }
              sx={{
                width: "100%",
                backgroundColor: theme.palette.background.main,
              }}
              error={errors.project}
              isRequired
            />
          </Suspense>
        )}

        {reportType === 'organization' && (
          <>
            <Suspense fallback={<div>Loading...</div>}>
              <Select
                id="org-project-input"
                label="Organizational project"
                placeholder="Select organizational project"
                value={values.project?.toString() ?? ""}
                onChange={handleOnSelectChange("project")}
                items={
                  organizationalProjects?.map(
                    (project: Project) => ({
                      _id: project.id,
                      name: project.project_title || `Project ${project.id}`,
                    })
                  ) || []
                }
                sx={{
                  width: "100%",
                  backgroundColor: theme.palette.background.main,
                }}
                error={errors.project}
                isRequired
              />
            </Suspense>
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
                    projectFrameworkId: framework.project_framework_id,
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
          </>
        )}

        <Stack>
          <Typography sx={{ fontSize: "13px", fontWeight: 500, mb: 2 }}>
            Report type *
          </Typography>
          <Autocomplete
            multiple
            id="report-type"
            size="small"
            value={Array.isArray(values.report_type) ? values.report_type : []}
            options={values.framework === 1 ? EUAI_REPORT_TYPES : ISO_REPORT_TYPES}
            onChange={(_event, newValue) => {
              // Handle "All reports combined in one file" selection
              let finalValue = newValue;

              // If "All reports combined in one file" was just selected
              if (newValue.includes("All reports combined in one file") &&
                  !values.report_type.includes("All reports combined in one file")) {
                // Only keep "All reports combined in one file", remove all others
                finalValue = ["All reports combined in one file"];
              }
              // If "All reports combined in one file" is already selected and user adds something else
              else if (values.report_type.includes("All reports combined in one file") &&
                       newValue.length > 1) {
                // Remove "All reports combined in one file" to allow multiple selections
                finalValue = newValue.filter(item => item !== "All reports combined in one file");
              }

              setValues({ ...values, report_type: finalValue });
              setErrors({ ...errors, report_type: "" });
            }}
            getOptionLabel={(option: string) => option}
            filterSelectedOptions
            popupIcon={
              <ChevronDown
                size={16}
                color={theme.palette.text.tertiary}
              />
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select report types"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    minHeight: "34px",
                    padding: "4px 10px",
                    display: "flex",
                    alignItems: "center",
                  },
                  "& .MuiInputBase-root": {
                    minHeight: "34px !important",
                    height: "auto !important",
                    padding: "4px 10px !important",
                    display: "flex !important",
                    alignItems: "center !important",
                    justifyContent: "flex-start !important",
                  },
                  "& .MuiInputBase-input": {
                    padding: "0 !important",
                    margin: "0 !important",
                    fontSize: "13px",
                    lineHeight: "1 !important",
                  },
                  "& ::placeholder": {
                    fontSize: "13px",
                  },
                }}
              />
            )}
            sx={{
              ...getAutocompleteStyles(theme, { hasError: !!errors.report_type }),
              width: "100%",
              backgroundColor: theme.palette.background.main,
              "& .MuiOutlinedInput-root": {
                ...getAutocompleteStyles(theme, { hasError: !!errors.report_type })["& .MuiOutlinedInput-root"],
                borderRadius: "4px",
              },
              "& .MuiChip-root": {
                borderRadius: "4px",
              },
            }}
            slotProps={{
              paper: {
                sx: {
                  "& .MuiAutocomplete-listbox": {
                    "& .MuiAutocomplete-option": {
                      fontSize: "13px",
                      color: "#1c2130",
                      paddingLeft: "9px",
                      paddingRight: "9px",
                    },
                    "& .MuiAutocomplete-option.Mui-focused": {
                      background: "#f9fafb",
                    },
                  },
                  "& .MuiAutocomplete-noOptions": {
                    fontSize: "13px",
                    paddingLeft: "9px",
                    paddingRight: "9px",
                  },
                },
              },
            }}
          />
          {errors.report_type && (
            <Typography
              color="error"
              variant="caption"
              sx={{ mt: 0.5, ml: 1, color: "#f04438", opacity: 0.8 }}
            >
              {errors.report_type}
            </Typography>
          )}
        </Stack>

        <Suspense fallback={<div>Loading...</div>}>
          <Field
            id="report-name"
            label="What should we call your report?"
            width="100%"
            value={values.report_name}
            onChange={handleOnTextFieldChange("report_name")}
            error={errors.report_name}
            sx={fieldStyle}
          />
        </Suspense>
    </Stack>
  );
};

export default GenerateReportFrom;

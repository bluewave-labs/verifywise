import React, {
  useState,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useEffect,
} from "react";
import { Autocomplete, Stack, Typography, useTheme, SelectChangeEvent, TextField } from "@mui/material";
import CustomizableButton from "../../../Button/CustomizableButton";
const Field = lazy(() => import("../../../Inputs/Field"));
import { styles, fieldStyle } from "./styles";
import { EUAI_REPORT_TYPES, ISO_REPORT_TYPES } from "../constants";
const Select = lazy(() => import("../../../../components/Inputs/Select"));
import { VerifyWiseContext } from "../../../../../application/contexts/VerifyWise.context";

/**
 * Set form values
 */
interface FormValues {
  report_type: string[];
  report_name: string;
  project: number;
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
  project: 1,
  framework: 1,
  projectFrameworkId: 1,
};

/**
 * Set framework type and initial value
 */
interface FrameworkValues {
  project_framework_id: number;
  framework_id: number;
  name: string;
}

const initialFrameworkValue: FrameworkValues = {
  project_framework_id: 1,
  framework_id: 1,
  name: "EU AI Act",
};

interface ReportProps {
  onGenerate: (formValues: any) => void;
  reportType: 'project' | 'organization' | null;
}

const GenerateReportFrom: React.FC<ReportProps> = ({ onGenerate, reportType }) => {
  const { dashboardValues } = useContext(VerifyWiseContext);
  const [values, setValues] = useState<FormValues>({
    ...initialState,
    project: dashboardValues.projects[0].id,
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
    const selectedProject = dashboardValues.projects.find(
      (project: { id: string | number }) => project.id === values.project
    );

    const frameworks = selectedProject?.framework;

    return Array.isArray(frameworks) && frameworks.length > 0
      ? frameworks
      : [initialFrameworkValue];
  }, [dashboardValues.projects, values.project]);

  const projectFrameworkId = useMemo(() => {
    return (
      projectFrameworks.find((pf) => pf.framework_id === values.framework)
        ?.project_framework_id ?? 1
    );
  }, [projectFrameworks, values.framework]);

  // Force EU AI Act framework for filtered projects
  useEffect(() => {
    setValues((prev) => ({ ...prev, framework: 1 }));
  }, [values.project]);

  const handleFormSubmit = () => {
    const normalizedReportType = Array.isArray(values.report_type)
      ? values.report_type.length === 1
        ? values.report_type[0]
        : values.report_type
      : values.report_type;

    const newValues = {
      ...values,
      report_type: normalizedReportType,
      projectFrameworkId: projectFrameworkId,
      reportType: reportType,
    };
    onGenerate(newValues);
  };

  const euActProjects = dashboardValues.projects?.filter(
    (project: { framework: [{ framework_id: number }] }) => project.framework.some(f => f.framework_id === 1)
  );

  return (
    <Stack sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Stack>
        <Typography sx={styles.titleText}>
          Generate {reportType === 'organization' ? 'Organization' : 'Project'} Report
        </Typography>
        <Typography sx={styles.baseText}>
          {reportType === 'organization' 
            ? 'Generate a comprehensive report for your entire organization.'
            : 'Pick the project you want to generate a report for.'
          }
        </Typography>
        {reportType === 'project' && (
          <Stack sx={{ paddingTop: theme.spacing(8) }}>
            <Suspense fallback={<div>Loading...</div>}>
              <Select
                id="project-input"
                label="Project"
                placeholder="Select project"
                value={values.project}
                onChange={handleOnSelectChange("project")}
                items={
                  euActProjects?.map(
                    (project: { id: any; project_title: any }) => ({
                      _id: project.id,
                      name: project.project_title,
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
          </Stack>
        )}

        {reportType === 'organization' && (
          <Stack sx={{ paddingTop: theme.spacing(8) }}>
            <Suspense fallback={<div>Loading...</div>}>
            <Select 
              id="framework-input"
              label="Framework"
              placeholder="Select Framework"
              value={values.framework}
              onChange={handleOnSelectChange("framework")}
              items={
                projectFrameworks?.map((framework) => ({
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
          </Stack>
        )}

        <Stack sx={{ paddingTop: theme.spacing(8) }}>
          <Suspense fallback={<div>Loading...</div>}>
          <Typography sx={{ fontSize: "12px", fontWeight: 500, mb: 2 }}>
            Report Type *
          </Typography>
            <Autocomplete
              multiple
              id="report-type"
              options={values.framework === 1 ? EUAI_REPORT_TYPES : ISO_REPORT_TYPES}
              value={Array.isArray(values.report_type) ? values.report_type : []}
              onChange={(_event, newValue) => {
                setValues({ ...values, report_type: newValue });
                setErrors({ ...errors, report_type: "" });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                />
              )}
            />
          </Suspense>
        </Stack>

        <Stack sx={{ paddingTop: theme.spacing(8) }}>
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
      </Stack>
      <Stack sx={styles.btnWrap}>
        <CustomizableButton
          sx={styles.CustomizableButton}
          variant="contained"
          text="Generate report"
          onClick={handleFormSubmit}
        />
      </Stack>
    </Stack>
  );
};

export default GenerateReportFrom;

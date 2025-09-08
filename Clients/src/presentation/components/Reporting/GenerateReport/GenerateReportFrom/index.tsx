import React, {
  useState,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useEffect,
} from "react";
import { Stack, Typography, useTheme, SelectChangeEvent } from "@mui/material";
import CustomizableButton from "../../../Button/CustomizableButton";
const Field = lazy(() => import("../../../Inputs/Field"));
import { styles, fieldStyle, selectReportStyle } from "./styles";
import { EUAI_REPORT_TYPES, ISO_REPORT_TYPES } from "../constants";
const Select = lazy(() => import("../../../../components/Inputs/Select"));
import { VerifyWiseContext } from "../../../../../application/contexts/VerifyWise.context";

/**
 * Set form values
 */
interface FormValues {
  report_type: string;
  report_name: string;
  project: number;
  framework: number;
  projectFrameworkId: number;
}

interface FormErrors {
  report_type?: string;
  report_name?: string;
  project?: string;
  framework?: string;
  projectFrameworkId?: string;
}

const initialState: FormValues = {
  report_type: "Project risks report",
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
}

const GenerateReportFrom: React.FC<ReportProps> = ({ onGenerate }) => {
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

    if (!availableTypes.includes(values.report_type)) {
      setValues((prev) => ({
        ...prev,
        report_type: availableTypes[0], // reset to the first valid type
      }));

      setErrors((prev) => ({
        ...prev,
        report_type: undefined, // clear any error
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

  const handleFormSubmit = () => {
    const newValues = {
      ...values,
      projectFrameworkId: projectFrameworkId,
    };
    onGenerate(newValues);
  };

  return (
    <Stack sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Stack>
        <Typography sx={styles.titleText}>Generate Report</Typography>
        <Typography sx={styles.baseText}>
          Pick the kind of report you want to create.
        </Typography>
        <Stack sx={{ paddingTop: theme.spacing(8) }}>
          <Suspense fallback={<div>Loading...</div>}>
            <Select
              id="project-input"
              label="Project"
              placeholder="Select project"
              value={values.project}
              onChange={handleOnSelectChange("project")}
              items={
                dashboardValues.projects?.map(
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
        <Stack sx={{ paddingTop: theme.spacing(8) }}>
          <Suspense fallback={<div>Loading...</div>}>
            <Select
              id="framework-input"
              label="Framework"
              placeholder="Select framework"
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

        <Stack sx={{ paddingTop: theme.spacing(8) }}>
          <Suspense fallback={<div>Loading...</div>}>
            <Select
              id="report-type-input"
              label="Report Type"
              placeholder="Select report type"
              value={values.report_type}
              onChange={handleOnSelectChange("report_type")}
              items={(values.framework === 1
                ? EUAI_REPORT_TYPES
                : ISO_REPORT_TYPES
              ).map((type) => ({
                _id: type, // unique key / value
                name: type, // display name
              }))}
              sx={selectReportStyle}
              error={errors.report_type}
              isRequired
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

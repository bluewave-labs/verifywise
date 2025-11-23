import React, {
  useState,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useEffect,
} from "react";
import { Stack, useTheme, SelectChangeEvent } from "@mui/material";
const Field = lazy(() => import("../../../Inputs/Field"));
import { fieldStyle } from "./styles";
import { EUAI_REPORT_TYPES, ISO_REPORT_TYPES } from "../constants";
const Select = lazy(() => import("../../../../components/Inputs/Select"));
const AutoCompleteField = lazy(() => import("../../../Inputs/Autocomplete"));
import { VerifyWiseContext } from "../../../../../application/contexts/VerifyWise.context";
import { Project, FrameworkValues } from "../../../../../application/interfaces/appStates";

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

    if (reportType === 'organization' && organizationalProjects.length > 0) {
      finalValues.project = typeof organizationalProjects[0].id === 'number' ? organizationalProjects[0].id : parseInt(String(organizationalProjects[0].id));
    }

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
        )}

        <Suspense fallback={<div>Loading...</div>}>
          <AutoCompleteField
            id="report-type"
            type="text"
            label="Report type"
            isRequired
            multiple
            options={values.framework === 1 ? EUAI_REPORT_TYPES : ISO_REPORT_TYPES}
            value={Array.isArray(values.report_type) ? values.report_type : []}
            onChange={(newValue) => {
              setValues({ ...values, report_type: newValue as string[] });
              setErrors({ ...errors, report_type: "" });
            }}
            placeholder="Select report types"
            error={errors.report_type}
            sx={{
              width: "100%",
              backgroundColor: theme.palette.background.main,
            }}
          />
        </Suspense>

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

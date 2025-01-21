import {
  Button,
  SelectChangeEvent,
  Link,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import React, { FC, useState, useCallback, useMemo } from "react";
import Field from "../../../components/Inputs/Field";
import DatePicker from "../../../components/Inputs/Datepicker";
import dayjs, { Dayjs } from "dayjs";
import Select from "../../../components/Inputs/Select";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import selectValidation from "../../../../application/validations/selectValidation";
import Alert from "../../../components/Alert";
import VWMultiSelect from "../../../vw-v2-components/Selects/Multi"
import DualButtonModal from "../../../vw-v2-components/Dialogs/DualButtonModal";
import { deleteEntityById } from "../../../../application/repository/entity.repository";
import { logEngine } from "../../../../application/tools/log.engine";
import { useNavigate, useSearchParams } from "react-router-dom";
import useProjectData from "../../../../application/hooks/useProjectData";

interface ProjectSettingsProps {
  setTabValue: (value: string) => void;
}

interface FormValues {
  projectTitle: string;
  goal: string;
  owner: number;
  startDate: string;
  addUsers: [];
  riskClassification: number;
  typeOfHighRiskRole: number;
}

interface FormErrors {
  projectTitle?: string;
  goal?: string;
  owner?: string;
  startDate?: string;
  addUsers?: string;
  riskClassification?: string;
  typeOfHighRiskRole?: string;
}

const initialState: FormValues = {
  projectTitle: "",
  goal: "",
  owner: 0,
  startDate: "",
  addUsers: [],
  riskClassification: 0,
  typeOfHighRiskRole: 0,
};

const ProjectSettings: FC<ProjectSettingsProps> = React.memo(
  ({ setTabValue }) => {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get("projectId") ?? "2"; // default project ID is 2
    const theme = useTheme();
    const { project, error, isLoading } = useProjectData({ projectId });
    const navigate = useNavigate();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [values, setValues] = useState<FormValues>(initialState);
    const [errors, setErrors] = useState<FormErrors>({});
    const [alert, setAlert] = useState<{
      variant: "success" | "info" | "warning" | "error";
      title?: string;
      body: string;
      isToast: boolean;
      visible: boolean;
    } | null>(null);

    const handleDateChange = useCallback((newDate: Dayjs | null) => {
      setValues((prevValues) => ({
        ...prevValues,
        startDate: newDate ? newDate.toISOString() : "",
      }));
    }, []);

    const handleOnSelectChange = useCallback(
      (prop: keyof FormValues) =>
        (event: SelectChangeEvent<string | number>) => {
          setValues((prevValues) => ({
            ...prevValues,
            [prop]: event.target.value,
          }));
          setErrors((prevErrors) => ({ ...prevErrors, [prop]: "" }));
        },
      []
    );

    const handleMultiSelectChange = useCallback(
      (prop: keyof FormValues) =>
        (event: SelectChangeEvent<string | number | (string | number)[]>) => {
          setValues((prevValues) => ({
            ...prevValues,
            [prop]: event.target.value as number[],
          }));
          setErrors((prevErrors) => ({ ...prevErrors, [prop]: "" }));
        },
      []
    );

    const handleOnTextFieldChange = useCallback(
      (prop: keyof FormValues) =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
          setValues((prevValues) => ({
            ...prevValues,
            [prop]: event.target.value,
          }));
          setErrors((prevErrors) => ({ ...prevErrors, [prop]: "" }));
        },
      []
    );

    const validateForm = useCallback((): boolean => {
      const newErrors: FormErrors = {};

      const projectTitle = checkStringValidation(
        "Project title",
        values.projectTitle,
        1,
        64
      );
      if (!projectTitle.accepted) {
        newErrors.projectTitle = projectTitle.message;
      }
      const goal = checkStringValidation("Goal", values.goal, 1, 256);
      if (!goal.accepted) {
        newErrors.goal = goal.message;
      }
      const startDate = checkStringValidation(
        "Start date",
        values.startDate,
        1
      );
      if (!startDate.accepted) {
        newErrors.startDate = startDate.message;
      }

      const addUsers = selectValidation("Team members", values.addUsers.length);
      if (!addUsers.accepted) {
        newErrors.addUsers = addUsers.message;
      }

      const owner = selectValidation("Owner", values.owner);
      if (!owner.accepted) {
        newErrors.owner = owner.message;
      }
      const riskClassification = selectValidation(
        "AI risk classification",
        values.riskClassification
      );
      if (!riskClassification.accepted) {
        newErrors.riskClassification = riskClassification.message;
      }
      const typeOfHighRiskRole = selectValidation(
        "Type of high risk role",
        values.typeOfHighRiskRole
      );
      if (!typeOfHighRiskRole.accepted) {
        newErrors.typeOfHighRiskRole = typeOfHighRiskRole.message;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }, [values]);

    const handleSubmit = useCallback(
      async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (validateForm()) {
          //request to the backend
          setTabValue("overview");
        }
      },
      [validateForm, setTabValue]
    );

    const fieldStyle = useMemo(
      () => ({
        backgroundColor: theme.palette.background.main,
        "& input": {
          padding: "0 14px",
        },
      }),
      [theme.palette.background.main]
    );

    const handleOpenDeleteDialog = useCallback((): void => {
      setIsDeleteModalOpen(true);
    }, []);

    const handleCloseDeleteDialog = useCallback((): void => {
      setIsDeleteModalOpen(false);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
      try {
        const response = await deleteEntityById({ routeUrl: `/projects/${projectId}` });
        console.log(response);
        const isError = response.status === 404 || response.status === 500;
        setAlert({
          variant: isError ? "error" : "success",
          title: isError ? "Error" : "Success",
          body: isError ? "Failed to delete project. Please try again." : "Project deleted successfully.",
          isToast: true,
          visible: true,
        });
        setTimeout(() => {
          setAlert(null);
          if (!isError) {
            navigate('/');
          }
        }, 3000);
      } catch (error) {
        logEngine({
          type: "error",
          message: "An error occured while deleting the project.",
          user: {
            id: String(localStorage.getItem("userId")) || "N/A",
            firstname: "N/A",
            lastname: "N/A"
          },
        });
        setAlert({
          variant: "error",
          title: "Error",
          body: "Failed to delete project. Please try again.",
          isToast: true,
          visible: true,
        });
      } finally {
        setIsDeleteModalOpen(false);
      }
    }, [navigate]);

    return (
      <Stack>
        {alert && (
          <Alert
            variant={alert.variant}
            title={alert.title}
            body={alert.body}
            isToast={true}
            onClick={() => setAlert(null)}
          />
        )}
        <Stack component="form" onSubmit={handleSubmit} rowGap="15px">
          <Field
            id="project-title-input"
            label="Project title"
            width={458}
            value={project?.project_title}
            onChange={handleOnTextFieldChange("projectTitle")}
            sx={fieldStyle}
            error={errors.projectTitle}
            isRequired
          />
          <Field
            id="goal-input"
            label="Goal"
            width={458}
            type="description"
            value={project?.goal}
            onChange={handleOnTextFieldChange("goal")}
            sx={{ height: 101, backgroundColor: theme.palette.background.main }}
            error={errors.goal}
            isRequired
          />
          <Select
            id="owner"
            label="Owner"
            placeholder="Add owner"
            value={values.owner}
            onChange={handleOnSelectChange("owner")}
            items={[
              { _id: 1, name: "Some value 1" },
              { _id: 2, name: "Some value 2" },
              { _id: 3, name: "Some value 3" },
            ]}
            sx={{ width: 357, backgroundColor: theme.palette.background.main }}
            error={errors.owner}
            isRequired
          />
          <DatePicker
            label="Start date"
            date={values.startDate ? dayjs(values.startDate) : null}
            handleDateChange={handleDateChange}
            sx={{
              width: "130px",
              "& input": { width: "85px" },
            }}
            isRequired
            error={errors.startDate}
          />
          <Stack gap="5px" sx={{ mt: "6px" }}>
            <Typography
              sx={{ fontSize: theme.typography.fontSize, fontWeight: 600 }}
            >
              Team members
            </Typography>
            <Typography sx={{ fontSize: theme.typography.fontSize }}>
              Add all team members of the project. Only those who are added will
              be able to see the project.
            </Typography>
          </Stack>
          <VWMultiSelect
            label="Team members"
            onChange={handleMultiSelectChange("addUsers")}
            value={values.addUsers}
            items={[
              { _id: 1, name: "Some value 1" },
              { _id: 2, name: "Some value 2" },
              { _id: 3, name: "Some value 3" },
            ]}
            sx={{ width: 357, backgroundColor: theme.palette.background.main }}
          // error={errors.addUsers}
          // required
          />
          <Stack gap="5px" sx={{ mt: "6px" }}>
            <Typography
              sx={{ fontSize: theme.typography.fontSize, fontWeight: 600 }}
            >
              AI risk classification
            </Typography>
            <Typography sx={{ fontSize: theme.typography.fontSize }}>
              To define the AI risk classification,&nbsp;
              <Link
                href="https://artificialintelligenceact.eu/high-level-summary/"
                target="_blank"
                rel="noopener"
                color={theme.palette.text.secondary}
              >
                please see this link
              </Link>
            </Typography>
          </Stack>
          <Select
            id="risk-classification-input"
            placeholder="Select an option"
            value={values.riskClassification}
            onChange={handleOnSelectChange("riskClassification")}
            items={[
              { _id: 1, name: "Some value 1" },
              { _id: 2, name: "Some value 2" },
              { _id: 3, name: "Some value 3" },
            ]}
            sx={{ width: 357, backgroundColor: theme.palette.background.main }}
            error={errors.riskClassification}
            isRequired
          />
          <Stack gap="5px" sx={{ mt: "6px" }}>
            <Typography
              sx={{ fontSize: theme.typography.fontSize, fontWeight: 600 }}
            >
              Type of high risk role
            </Typography>
            <Typography sx={{ fontSize: theme.typography.fontSize }}>
              If you are not sure about the high risk role,&nbsp;
              <Link
                href="https://artificialintelligenceact.eu/high-level-summary/"
                target="_blank"
                rel="noopener"
                color={theme.palette.text.secondary}
              >
                please see this link
              </Link>
            </Typography>
          </Stack>
          <Stack gap="5px" sx={{ mt: "6px" }}>
            <Typography
              sx={{ fontSize: theme.typography.fontSize, fontWeight: 600 }}>
              Delete project
            </Typography>
            <Typography sx={{ fontSize: theme.typography.fontSize, color: '#667085' }}>
              Note that deleting a project will remove all data related to that project from our system. This is permanent and non-recoverable.
            </Typography>
          </Stack>
          <Button
            disableRipple
            variant="contained"
            onClick={handleOpenDeleteDialog}
            sx={{
              width: { xs: "100%", sm: theme.spacing(80) },
              mb: theme.spacing(4),
              backgroundColor: "#DB504A",
              color: "#fff",
            }}
          >
            Delete project
          </Button>
          <Button
            variant="contained"
            type="submit"
            sx={{
              width: 60,
              height: 34,
              fontSize: theme.typography.fontSize,
              textTransform: "inherit",
              backgroundColor: "#4C7DE7",
              boxShadow: "none",
              borderRadius: 2,
              border: "1px solid #175CD3",
              ml: "auto",
              mr: 0,
              "&:hover": { boxShadow: "none", backgroundColor: "#175CD3 " },
            }}
          >
            Save
          </Button>
        </Stack>
        {isDeleteModalOpen && (
          <DualButtonModal
            title="Confirm Delete"
            body={
              <Typography fontSize={13}>
                Are you sure you want to delete the project?
              </Typography>
            }
            cancelText="Cancel"
            proceedText="Delete"
            onCancel={handleCloseDeleteDialog}
            onProceed={handleConfirmDelete}
            proceedButtonColor="error"
            proceedButtonVariant="contained"
          />
        )}
      </Stack>
    );
  }
);

export default ProjectSettings;

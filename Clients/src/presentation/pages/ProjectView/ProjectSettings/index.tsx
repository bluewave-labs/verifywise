import {
  SelectChangeEvent,
  Link,
  Stack,
  Typography,
  useTheme,
  Autocomplete,
  TextField,
  Box
} from "@mui/material";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Field from "../../../components/Inputs/Field";
import DatePicker from "../../../components/Inputs/Datepicker";
import dayjs, { Dayjs } from "dayjs";
import Select from "../../../components/Inputs/Select";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import selectValidation from "../../../../application/validations/selectValidation";
import Alert from "../../../components/Alert";
import DualButtonModal from "../../../vw-v2-components/Dialogs/DualButtonModal";
import {
  deleteEntityById,
  updateEntityById,
} from "../../../../application/repository/entity.repository";
import { logEngine } from "../../../../application/tools/log.engine";
import { useNavigate, useSearchParams } from "react-router-dom";
import useProjectData from "../../../../application/hooks/useProjectData";
import useUsers from "../../../../application/hooks/useUsers";
import VWButton from "../../../vw-v2-components/Buttons";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import VWToast from "../../../vw-v2-components/Toast";
import VWSkeleton from "../../../vw-v2-components/Skeletons";

enum RiskClassificationEnum {
  HighRisk = "High risk",
  LimitedRisk = "Limited risk",
  MinimalRisk = "Minimal risk",
}

const riskClassificationItems = [
  { _id: 1, name: RiskClassificationEnum.HighRisk },
  { _id: 2, name: RiskClassificationEnum.LimitedRisk },
  { _id: 3, name: RiskClassificationEnum.MinimalRisk },
];

enum HighRiskRoleEnum {
  Deployer = "Deployer",
  Provider = "Provider",
  Distributor = "Distributor",
  Importer = "Importer",
  ProductManufacturer = "Product manufacturer",
  AuthorizedRepresentative = "Authorized representative",
}

const highRiskRoleItems = [
  { _id: 1, name: HighRiskRoleEnum.Deployer },
  { _id: 2, name: HighRiskRoleEnum.Provider },
  { _id: 3, name: HighRiskRoleEnum.Distributor },
  { _id: 4, name: HighRiskRoleEnum.Importer },
  { _id: 5, name: HighRiskRoleEnum.ProductManufacturer },
  { _id: 6, name: HighRiskRoleEnum.AuthorizedRepresentative },
];

interface FormValues {
  projectTitle: string;
  goal: string;
  owner: number;
  members: number[];
  startDate: string;
  riskClassification: number;
  typeOfHighRiskRole: number;
}

interface FormErrors {
  projectTitle?: string;
  goal?: string;
  owner?: string;
  startDate?: string;
  members?: string;
  riskClassification?: string;
  typeOfHighRiskRole?: string;
}

const initialState: FormValues = {
  projectTitle: "",
  goal: "",
  owner: 0,
  members: [],
  startDate: "",
  riskClassification: 0,
  typeOfHighRiskRole: 0,
};

const ProjectSettings = React.memo(({ triggerRefresh = () => {} }: { triggerRefresh?: (isUpdate: boolean) => void }) => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "1"; // default project ID is 2
  const theme = useTheme();
  
  const { project } = useProjectData({ projectId });
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
  const [memberRequired, setMemberRequired] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVWSkeleton, setShowVWSkeleton] = useState<boolean>(false);
  const initialValuesRef = useRef<FormValues>({ ...initialState });
  const isModified = useMemo(() => {
    if (!initialValuesRef.current.projectTitle) return false;
    return (
      values.projectTitle !== initialValuesRef.current.projectTitle ||
      values.goal !== initialValuesRef.current.goal ||
      values.owner !== initialValuesRef.current.owner ||
      JSON.stringify(values.members) !== JSON.stringify(initialValuesRef.current.members) ||
      values.startDate !== initialValuesRef.current.startDate ||
      values.riskClassification !== initialValuesRef.current.riskClassification ||
      values.typeOfHighRiskRole !== initialValuesRef.current.typeOfHighRiskRole
    );
  }, [values]);

  const isSaveDisabled = useMemo(() => {
    if (showVWSkeleton) return true;

    if (!isModified) return true;
    
    const hasErrors = Object.values(errors).some(error => error && error.length > 0);
    
    return hasErrors;
  }, [isModified, errors, showVWSkeleton]);

  useEffect(() => {
    if (project) {
      initialState.projectTitle = project?.project_title ?? "";
      setValues(initialState);
    }
  }, [project]);

  const { users } = useUsers();

  useEffect(() => {
    setShowVWSkeleton(true)
    if (project) {
      const returnedData: FormValues = {
        ...initialState,
        projectTitle: project.project_title ?? "",
        goal: project.goal ?? "",
        owner: project.owner ?? 0,
        startDate: project.start_date
          ? dayjs(project.start_date).toISOString()
          : "",
        members: project.members ? project.members.map(Number) : [],
        riskClassification:
          riskClassificationItems.find(
            (item) =>
              item.name.toLowerCase() ===
              project.ai_risk_classification.toLowerCase()
          )?._id || 0,
        typeOfHighRiskRole:
          highRiskRoleItems.find(
            (item) =>
              item.name.toLowerCase() ===
              project.type_of_high_risk_role.toLowerCase()
          )?._id || 0,
      };
      initialValuesRef.current = returnedData;
      setShowVWSkeleton(false)
      setValues(returnedData);
    }
  }, [project]);

  const handleDateChange = useCallback((newDate: Dayjs | null) => {
    if (newDate?.isValid()) {
      setValues((prevValues) => ({
        ...prevValues,
        startDate: newDate ? newDate.toISOString() : "",
      }));
    }
  }, []);

  const handleOnSelectChange = useCallback(
    (prop: keyof FormValues) => (event: SelectChangeEvent<string | number>) => {
      setValues((prevValues) => ({
        ...prevValues,
        [prop]: event.target.value,
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

  const handleOnMultiSelect = useCallback(
    (prop: keyof FormValues) =>
      (_event: React.SyntheticEvent, newValue: any[]) => {
        setValues((prevValues) => ({
          ...prevValues,
          [prop]: newValue.map((user) => user.id),
        }));
        setMemberRequired(false);
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
    const startDate = checkStringValidation("Start date", values.startDate, 1);
    if (!startDate.accepted) {
      newErrors.startDate = startDate.message;
    }

    const addTeamMember = selectValidation(
      "Team members",
      values.members.length
    );
    if (!addTeamMember.accepted) {
      newErrors.members = addTeamMember.message;
      setMemberRequired(true);
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validateForm()) {
      handleSaveConfirm();
    } else {
      setAlert({
        variant: "error",
        body: "Form validation fails.",
        isToast: true,
        visible: true,
      });
      setTimeout(() => {
        setAlert(null);
      }, 1500);
    }
  }

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
  // saves the project
  const handleSaveConfirm = useCallback(async () => {    
    const selectedRiskClass =
      riskClassificationItems.find(
        (item) => item._id === values.riskClassification
      )?.name || "";
    const selectedHighRiskRole =
      highRiskRoleItems.find((item) => item._id === values.typeOfHighRiskRole)
        ?.name || "";

    await updateEntityById({
      routeUrl: `/projects/${projectId}`,
      body: {
        id: projectId,
        project_title: values.projectTitle,
        owner: values.owner,
        members: values.members.map(String),
        start_date: values.startDate,
        ai_risk_classification: selectedRiskClass,
        type_of_high_risk_role: selectedHighRiskRole,
        goal: values.goal,
        last_updated: new Date().toISOString(),
        last_updated_by: 1,
      },
    }).then((response) => {
      if (response.status === 202) {
        setAlert({
          variant: "success",
          body: "Project updated successfully",
          isToast: true,
          visible: true,
        });
        setTimeout(() => {
          setIsLoading(false);
          setAlert(null);
        }, 2000);
        // setRefreshKey((prevKey) => prevKey + 1);
        triggerRefresh(true)
      } else if (response.status === 400) {
        setIsLoading(false);
        setAlert({
          variant: "error",
          body: response.data.data.message,
          isToast: true,
          visible: true,
        });
      }
    });
  }, [values, projectId]);

  const handleConfirmDelete = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await deleteEntityById({
        routeUrl: `/projects/${projectId}`,
      });
      console.log(response);
      const isError = response.status === 404 || response.status === 500;
      setAlert({
        variant: isError ? "error" : "success",
        title: isError ? "Error" : "Success",
        body: isError
          ? "Failed to delete project. Please try again."
          : "Project deleted successfully.",
        isToast: true,
        visible: true,
      });
      if (!isError) {
        navigate("/");
        setTimeout(() => {
          setAlert(null);
        }, 3000);
      } else {
        setTimeout(() => {
          setAlert(null);
        }, 3000);
      }
    } catch (error) {
      logEngine({
        type: "error",
        message: "An error occured while deleting the project.",
        user: {
          id: String(localStorage.getItem("userId")) || "N/A",
          firstname: "N/A",
          lastname: "N/A",
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
      setIsLoading(false);
    }
  }, [navigate, projectId]);

  return (
    <Stack>
      {isLoading && <VWToast />}
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={true}
          onClick={() => setAlert(null)}
        />
      )}
      {showVWSkeleton ? (
          <VWSkeleton variant="rectangular" width="50%" height={200} />
        ) : (
        <Stack component="form" onSubmit={handleSubmit} rowGap="15px">
          <Field
            id="project-title-input"
            label="Project title"
            width={458}
            value={values.projectTitle}
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
            value={values.goal}
            onChange={handleOnTextFieldChange("goal")}
            sx={{
              backgroundColor: theme.palette.background.main,
            }}
            error={errors.goal}
            isRequired
          />
          <Select
            id="owner"
            label="Owner"
            value={values.owner || ''}
            onChange={handleOnSelectChange("owner")}
            items={
              users?.map((user) => ({
                _id: user.id,
                name: `${user.name} ${user.surname}`,
                email: user.email,
              })) || []
            }
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
              Team members *
            </Typography>
            <Typography sx={{ fontSize: theme.typography.fontSize }}>
              Add all team members of the project. Only those who are added will
              be able to see the project.
            </Typography>
          </Stack>

          <Autocomplete
            multiple
            id="users-input"
            size="small"
            value={users.filter((user) =>
              values.members.includes(Number(user.id))
            )}
            options={
              users
                ?.filter((user) => !values.members.includes(Number(user.id)))
                .map((user) => ({
                  id: user.id,
                  name: user.name,
                  surname: user.surname,
                  email: user.email,
                })) || []
            }
            getOptionLabel={(member) => `${member.name} ${member.surname}`}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              const userEmail = option.email.length > 30 ? `${option.email.slice(0, 30)}...` : option.email;
              return (
                <Box
                  key={key}
                  component="li"
                  {...optionProps}
                >
                  <Typography sx={{ fontSize: '13px' }}>
                    {option.name} {option.surname}
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: 'rgb(157, 157, 157)', position: 'absolute', right: '9px' }}>
                    {userEmail}
                  </Typography>
                </Box>
              );
            }}
            noOptionsText={
              values.members.length === users.length
                ? "All members selected"
                : "No options"
            }
            onChange={handleOnMultiSelect("members")}
            popupIcon={<KeyboardArrowDown />}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select Users"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    paddingTop: "3.8px !important",
                    paddingBottom: "3.8px !important",
                  },
                  "& ::placeholder": {
                    fontSize: "13px",
                  },
                }}
              />
            )}
            sx={{
              width: "458px",
              backgroundColor: theme.palette.background.main,
              "& .MuiOutlinedInput-root": {
                borderRadius: "5px",
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#777",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#888",
                  borderWidth: "1px",
                },
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
                      paddingRight: "9px"
                    },
                    "& .MuiAutocomplete-option.Mui-focused": {
                      background: "#f9fafb",
                    }
                  },
                  "& .MuiAutocomplete-noOptions": {
                    fontSize: "13px",
                    paddingLeft: "9px",
                    paddingRight: "9px"
                  }
                },
              },
            }}
          />
          {memberRequired && (
            <Typography
              variant="caption"
              sx={{ color: "#f04438", fontWeight: 300 }}
            >
              {errors.members}
            </Typography>
          )}

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
            value={values?.riskClassification || 1}
            onChange={handleOnSelectChange("riskClassification")}
            items={riskClassificationItems}
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
          <Select
            id="risk-classification-input"
            value={values?.typeOfHighRiskRole || 1}
            onChange={handleOnSelectChange("typeOfHighRiskRole")}
            items={highRiskRoleItems}
            sx={{ width: 357, backgroundColor: theme.palette.background.main }}
            error={errors.typeOfHighRiskRole}
            isRequired
          />
          <Stack sx={{ width: "100%", maxWidth: 800 }}>
            <VWButton
              sx={{
                alignSelf: "flex-end",
                width: "fit-content",
                backgroundColor: "#13715B",
                border: isSaveDisabled
                ? "1px solid rgba(0, 0, 0, 0.26)"
                : "1px solid #13715B",
                gap: 2,
              }}
              icon={<SaveIcon />}
              variant="contained"
              onClick={(event: any) => {
                handleSubmit(event);
              }}
              isDisabled={isSaveDisabled}
              text="Save"
            />

            {/* divider for seperation */}
            <Stack sx={{ mt: 6, borderTop: "1px solid #E0E0E0", pt: 8 }} />
            <Typography
              sx={{
                fontSize: theme.typography.fontSize,
                fontWeight: 600,
                mb: 4,
              }}
            >
              Delete project
            </Typography>
            <Typography
              sx={{
                fontSize: theme.typography.fontSize,
                color: "#667085",
                mb: 8,
              }}
            >
              Note that deleting a project will remove all data related to that
              project from our system. This is permanent and non-recoverable.
            </Typography>
            <VWButton
              sx={{
                width: { xs: "100%", sm: theme.spacing(80) },
                mb: theme.spacing(4),
                backgroundColor: "#DB504A",
                color: "#fff",
                border: "1px solid #DB504A",
                gap: 2,
              }}
              icon={<DeleteIcon />}
              variant="contained"
              onClick={handleOpenDeleteDialog}
              text="Delete project"
            />
          </Stack>
        </Stack>
      )}

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
          TitleFontSize={0}
        />
      )}
    </Stack>
  );
});

export default ProjectSettings;

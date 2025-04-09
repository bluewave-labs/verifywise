import {
  Autocomplete,
  Box,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { ClearIcon } from "@mui/x-date-pickers/icons";
import { Suspense, useCallback, useContext, useMemo, useState } from "react";
import VWButton from "../../Buttons";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import Field from "../../../components/Inputs/Field";
import {
  createProjectButtonStyle,
  datePickerStyle,
  teamMembersRenderInputStyle,
  teamMembersSlotProps,
  teamMembersSxStyle,
  textfieldStyle,
} from "./style";
import Select from "../../../components/Inputs/Select";
import useUsers from "../../../../application/hooks/useUsers";
import DatePicker from "../../../components/Inputs/Datepicker";
import dayjs, { Dayjs } from "dayjs";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import selectValidation from "../../../../application/validations/selectValidation";
import { createNewUser } from "../../../../application/repository/entity.repository";
import VWToast from "../../Toast";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import { extractUserToken } from "../../../../application/tools/extractToken";
import { useSelector } from "react-redux";
import Checkbox from "../../../components/Inputs/Checkbox";
import { Project } from "../../../../domain/Project";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import {
  FormErrors,
  HighRiskRoleEnum,
  RiskClassificationEnum,
} from "./constants";
import { FormValues } from "./constants";
import { initialState } from "./constants";
import { VWProjectFormProps } from "./constants";

const VWProjectForm = ({ sx, onClose }: VWProjectFormProps) => {
  const theme = useTheme();
  const { setProjects } = useContext(VerifyWiseContext);
  const [values, setValues] = useState<FormValues>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const { users } = useUsers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberRequired, setMemberRequired] = useState<boolean>(false);
  const authState = useSelector(
    (state: { auth: { authToken: string; userExists: boolean } }) => state.auth
  );

  const riskClassificationItems = useMemo(
    () => [
      { _id: 1, name: RiskClassificationEnum.HighRisk },
      { _id: 2, name: RiskClassificationEnum.LimitedRisk },
      { _id: 3, name: RiskClassificationEnum.MinimalRisk },
    ],
    []
  );

  const highRiskRoleItems = useMemo(
    () => [
      { _id: 1, name: HighRiskRoleEnum.Deployer },
      { _id: 2, name: HighRiskRoleEnum.Provider },
      { _id: 3, name: HighRiskRoleEnum.Distributor },
      { _id: 4, name: HighRiskRoleEnum.Importer },
      { _id: 5, name: HighRiskRoleEnum.ProductManufacturer },
      { _id: 6, name: HighRiskRoleEnum.AuthorizedRepresentative },
    ],
    []
  );

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

  const handleOnMultiSelect = useCallback(
    (prop: keyof FormValues) =>
      (_event: React.SyntheticEvent, newValue: any[]) => {
        setValues((prevValues) => ({
          ...prevValues,
          [prop]: newValue,
        }));
        setMemberRequired(false);
      },
    []
  );

  const handleDateChange = useCallback((newDate: Dayjs | null) => {
    if (newDate?.isValid()) {
      setValues((prevValues: any) => ({
        ...prevValues,
        start_date: newDate ? newDate.toISOString() : "",
      }));
    }
  }, []);

  const handleCheckboxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, enable_ai_data_insertion: event.target.checked });
    },
    [values]
  );

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const projectTitle = checkStringValidation(
      "Project title",
      values.project_title,
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
    const startDate = checkStringValidation("Start date", values.start_date, 1);
    if (!startDate.accepted) {
      newErrors.startDate = startDate.message;
    }
    const owner = selectValidation("Owner", values.owner);
    if (!owner.accepted) {
      newErrors.owner = owner.message;
    }
    const riskClassification = selectValidation(
      "AI risk classification",
      values.ai_risk_classification
    );
    if (!riskClassification.accepted) {
      newErrors.riskClassification = riskClassification.message;
    }
    const typeOfHighRiskRole = selectValidation(
      "Type of high risk role",
      values.type_of_high_risk_role
    );
    if (!typeOfHighRiskRole.accepted) {
      newErrors.typeOfHighRiskRole = typeOfHighRiskRole.message;
    }
    if (values.members.length === 0) {
      newErrors.members = "At least one team member is required.";
      setMemberRequired(true);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit() {
    const userInfo = extractUserToken(authState.authToken);
    const teamMember = values.members.map((user) => String(user._id));

    if (validateForm()) {
      setIsSubmitting(true);
      try {
        const res = await createNewUser({
          routeUrl: "/projects",
          body: {
            ...values,
            type_of_high_risk_role: highRiskRoleItems.find(
              (item) => item._id === values.type_of_high_risk_role
            )?.name,
            ai_risk_classification: riskClassificationItems.find(
              (item) => item._id === values.ai_risk_classification
            )?.name,
            last_updated: values.start_date,
            last_updated_by: userInfo?.id,
            members: teamMember,
            enable_ai_data_insertion: values.enable_ai_data_insertion,
          },
        });

        if (res.status === 201) {
          setProjects((prevProjects: Project[]) => [
            ...prevProjects,
            res.data.data.project as Project,
          ]);
          setTimeout(() => {
            setIsSubmitting(false);
            onClose();
          }, 1000);
        } else {
          setTimeout(() => {
            setIsSubmitting(false);
          }, 1000);
        }
      } catch (err) {
        setTimeout(() => {
          setIsSubmitting(false);
        }, 1000);
      }
    }
  }

  return (
    <Stack
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: "fit-content",
        backgroundColor: "#FCFCFD",
        padding: 10,
        borderRadius: "4px",
        gap: 10,
        ...sx,
      }}
    >
      {isSubmitting && (
        <Stack
          sx={{
            width: "100vw",
            height: "120vh",
            position: "fixed",
            top: "-50%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
          }}
        >
          <VWToast title="Creating project. Please wait..." />
        </Stack>
      )}

      <Stack
        className="vwproject-form-header"
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Stack className="vwproject-form-header-text">
          <Typography
            sx={{ fontSize: 16, color: "#344054", fontWeight: "bold" }}
          >
            Create new project
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#344054" }}>
            Create a new project from scratch by filling in the following.
          </Typography>
        </Stack>
        <ClearIcon
          sx={{ color: "#98A2B3", cursor: "pointer" }}
          onClick={onClose}
        />
      </Stack>
      <Stack
        className="vwproject-form-body"
        sx={{ display: "flex", flexDirection: "row", gap: 8 }}
      >
        <Stack className="vwproject-form-body-start" sx={{ gap: 8 }}>
          <Field
            id="project-title-input"
            label="Project title"
            width="350px"
            value={values.project_title}
            onChange={handleOnTextFieldChange("project_title")}
            error={errors.projectTitle}
            sx={textfieldStyle}
            isRequired
          />
          <Select
            id="owner-input"
            label="Owner"
            placeholder="Select owner"
            value={values.owner || ""}
            onChange={handleOnSelectChange("owner")}
            items={
              users?.map((user: any) => ({
                _id: user.id,
                name: `${user.name} ${user.surname}`,
                email: user.email,
              })) || []
            }
            sx={{
              width: "350px",
              backgroundColor: theme.palette.background.main,
            }}
            error={errors.owner}
            isRequired
          />
          <Select
            id="risk-classification-input"
            label="AI risk classification"
            placeholder="Select an option"
            value={values.ai_risk_classification || ""}
            onChange={handleOnSelectChange("ai_risk_classification")}
            items={riskClassificationItems}
            sx={{
              width: "350px",
              backgroundColor: theme.palette.background.main,
            }}
            error={errors.riskClassification}
            isRequired
          />
          <Select
            id="type-of-high-risk-role-input"
            label="Type of high risk role"
            placeholder="Select an option"
            value={values.type_of_high_risk_role || ""}
            onChange={handleOnSelectChange("type_of_high_risk_role")}
            items={highRiskRoleItems}
            sx={{
              width: "350px",
              backgroundColor: theme.palette.background.main,
            }}
            isRequired
            error={errors.typeOfHighRiskRole}
          />
        </Stack>
        <Stack className="vwproject-form-body-end" sx={{ gap: 8 }}>
          <Suspense fallback={<div>Loading...</div>}>
            <Stack>
              <Typography
                sx={{
                  fontSize: theme.typography.fontSize,
                  fontWeight: 500,
                  mb: 2,
                }}
              >
                Team members *
              </Typography>
              <Autocomplete
                multiple
                id="users-input"
                size="small"
                value={values.members}
                options={
                  users
                    ?.filter(
                      (user) =>
                        !values.members.some(
                          (selectedUser) => selectedUser._id === user.id
                        )
                    )
                    .map((user) => ({
                      _id: user.id,
                      name: user.name,
                      surname: user.surname,
                      email: user.email,
                    })) || []
                }
                noOptionsText={
                  values.members.length === users.length
                    ? "All members selected"
                    : "No options"
                }
                onChange={handleOnMultiSelect("members")}
                getOptionLabel={(user) => `${user.name} ${user.surname}`}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  const userEmail =
                    option.email.length > 30
                      ? `${option.email.slice(0, 30)}...`
                      : option.email;
                  return (
                    <Box key={key} component="li" {...optionProps}>
                      <Typography sx={{ fontSize: "13px" }}>
                        {option.name} {option.surname}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "11px",
                          color: "rgb(157, 157, 157)",
                          position: "absolute",
                          right: "9px",
                        }}
                      >
                        {userEmail}
                      </Typography>
                    </Box>
                  );
                }}
                filterSelectedOptions
                popupIcon={<KeyboardArrowDown />}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select Users"
                    error={memberRequired}
                    sx={teamMembersRenderInputStyle}
                  />
                )}
                sx={{
                  backgroundColor: theme.palette.background.main,
                  ...teamMembersSxStyle,
                }}
                slotProps={teamMembersSlotProps}
              />
              {memberRequired && (
                <Typography
                  variant="caption"
                  sx={{ mt: 4, color: "#f04438", fontWeight: 300 }}
                >
                  {errors.members}
                </Typography>
              )}
            </Stack>
          </Suspense>
          <DatePicker
            label="Start date"
            date={
              values.start_date ? dayjs(values.start_date) : dayjs(new Date())
            }
            handleDateChange={handleDateChange}
            sx={datePickerStyle}
            isRequired
            error={errors.startDate}
          />
          <Field
            id="goal-input"
            label="Goal"
            type="description"
            value={values.goal}
            onChange={handleOnTextFieldChange("goal")}
            sx={{
              backgroundColor: theme.palette.background.main,
            }}
            isRequired
            error={errors.goal}
          />
        </Stack>
      </Stack>
      <Stack>
        <Checkbox
          size="small"
          id="auto-fill"
          onChange={handleCheckboxChange}
          isChecked={values.enable_ai_data_insertion}
          value={values.enable_ai_data_insertion.toString()}
          label="Enable this option to automatically fill in the Compliance Tracker and Assessment Tracker questions with AI-generated answers, helping you save time. You can review and edit these answers anytime."
        />
      </Stack>
      <Stack
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
        }}
      >
        <VWButton
          text="Create project"
          sx={createProjectButtonStyle}
          icon={<AddCircleOutlineIcon />}
          onClick={() => handleSubmit()}
        />
      </Stack>
    </Stack>
  );
};

export default VWProjectForm;

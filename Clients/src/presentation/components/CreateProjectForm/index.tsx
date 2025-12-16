import React, {
  FC,
  useState,
  useMemo,
  useCallback,
  Suspense,
  lazy,
  useEffect,
} from "react";
import {
  Button,
  SelectChangeEvent,
  Stack,
  useTheme,
  Autocomplete,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { ChevronDown as GreyDownArrowIcon } from "lucide-react";
import { useSelector } from "react-redux";
import dayjs, { Dayjs } from "dayjs";
import { checkStringValidation } from "../../../application/validations/stringValidation";
import selectValidation from "../../../application/validations/selectValidation";
import { extractUserToken } from "../../../application/tools/extractToken";
import useUsers from "../../../application/hooks/useUsers";
import {
  CreateProjectFormErrors,
  CreateProjectFormValues,
} from "../../../domain/interfaces/i.form";
// import { CreateProjectFormUser } from "../../../domain/interfaces/i.user";
import allowedRoles from "../../../application/constants/permissions";
import { useAuth } from "../../../application/hooks/useAuth";
import { usePostHog } from "../../../application/hooks/usePostHog";
import { useComponentPerformance, useFormPerformance } from "../../../application/hooks/usePerformanceMonitoring";
import { createProject } from "../../../application/repository/project.repository";
import { Project } from "../../../domain/types/Project";
import { createProjectFormStyles } from "./styles";
import { AiRiskClassification } from "../../../domain/enums/aiRiskClassification.enum";
import { HighRiskRole } from "../../../domain/enums/highRiskRole.enum";
import { getAutocompleteStyles } from "../../utils/inputStyles";
import { CreateProjectFormUserModel } from "../../../domain/models/Common/user/user.model";

const Select = lazy(() => import("../Inputs/Select"));
const DatePicker = lazy(() => import("../Inputs/Datepicker"));
const Field = lazy(() => import("../Inputs/Field"));

const initialState: CreateProjectFormValues = {
  project_title: "",
  members: [],
  owner: 0,
  start_date: new Date().toISOString(),
  ai_risk_classification: 0,
  type_of_high_risk_role: 0,
  goal: "",
};

interface ProjectResponse {
  status: number;
  data: {
    data: {
      project: Project;
    };
  };
}

interface CreateProjectFormProps {
  closePopup: () => void;
  onNewProject: (value: { isNewProject: boolean; project: Project }) => void;
}

/**
 * `CreateProjectForm` is a functional component that renders a form for creating a new use case.
 * It includes fields for use case title, users, owner, start date, AI risk classification, type of high risk role, and goal.
 * The form validates the input fields and displays error messages if validation fails.
 * On successful submission, it shows a newly created use case on use case overview page.
 *
 * @component
 * @returns {JSX.Element} The rendered component.
 */

const CreateProjectForm: FC<CreateProjectFormProps> = ({
  closePopup,
  onNewProject,
}) => {
  const theme = useTheme();
  const { userRoleName } = useAuth();
  const { trackForm, trackJourney, trackFeature } = usePostHog();
  const { trackFormStart, trackFormSubmit } = useFormPerformance('create_project');

  const [values, setValues] = useState<CreateProjectFormValues>(initialState);
  const [errors, setErrors] = useState<CreateProjectFormErrors>({});
  const { users } = useUsers();

  // Track component render performance (after state declarations)
  useComponentPerformance('CreateProjectForm', [values, errors]);
  const authState = useSelector(
    (state: { auth: { authToken: string; userExists: boolean } }) => state.auth
  );
  const [memberRequired, setMemberRequired] = useState<boolean>(false);

  // Track when form opens
  useEffect(() => {
    // Track form start for analytics
    trackForm('create_project', 'start', {
      user_role: userRoleName,
      available_users: users.length,
      form_type: 'ai_governance_project',
    });

    trackJourney('project_creation', 'form_opened', {
      user_role: userRoleName,
      total_available_users: users.length,
    });

    // Start performance tracking for form
    trackFormStart();
  }, [userRoleName, users.length, trackForm, trackJourney, trackFormStart]);

  const handleDateChange = useCallback((newDate: Dayjs | null) => {
    if (newDate?.isValid()) {
      setValues((prevValues) => ({
        ...prevValues,
        start_date: newDate ? newDate.toISOString() : "",
      }));
    }
  }, []);

  const handleOnSelectChange = useCallback(
    (prop: keyof CreateProjectFormValues) =>
      (event: SelectChangeEvent<string | number>) => {
        setValues((prevValues) => ({
          ...prevValues,
          [prop]: event.target.value,
        }));
        setErrors((prevErrors) => ({ ...prevErrors, [prop]: "" }));
      },
    []
  );

  const handleOnTextFieldChange = useCallback(
    (prop: keyof CreateProjectFormValues) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setValues((prevValues) => ({
          ...prevValues,
          [prop]: event.target.value,
        }));
        setErrors((prevErrors) => ({ ...prevErrors, [prop]: "" }));
      },
    []
  );

  const validateForm = (): boolean => {
    const newErrors: CreateProjectFormErrors = {};

    const projectTitle = checkStringValidation(
      "Use case title",
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Track form submission attempt
    trackForm('create_project', 'submit', {
      form_fields_completed: Object.keys(values).filter(key => values[key as keyof CreateProjectFormValues]).length,
      total_fields: Object.keys(initialState).length,
      has_errors: Object.keys(errors).length > 0,
    });

    if (validateForm()) {
      confirmSubmit();
    } else {
      // Track validation errors
      trackForm('create_project', 'error', {
        error_fields: Object.keys(errors),
        total_errors: Object.keys(errors).length,
        form_data: values,
      });
    }
  };

  const confirmSubmit = async (): Promise<void> => {
    try {
      const userInfo = extractUserToken(authState.authToken);

      // Track project creation attempt
      const aiRiskLevel = riskClassificationItems.find(
        (item) => item._id === values.ai_risk_classification
      )?.name || 'unknown';

      const highRiskRole = highRiskRoleItems.find(
        (item) => item._id === values.type_of_high_risk_role
      )?.name || 'unknown';

      trackJourney('project_creation', 'api_call_started', {
        project_title: values.project_title,
        ai_risk_classification: aiRiskLevel,
        high_risk_role: highRiskRole,
        team_size: values.members.length,
        has_goal: !!values.goal,
        user_role: userRoleName,
      });

      const teamMember = values.members.map((user) => String(user._id));
      const response: ProjectResponse = await createProject({
        body: {
          ...values,
          type_of_high_risk_role: highRiskRole,
          ai_risk_classification: aiRiskLevel,
          last_updated: values.start_date,
          last_updated_by: userInfo?.id,
          members: teamMember,
        },
      });

      setValues(initialState);
      setErrors({});
      closePopup();

      if (response.status === 201) {
        // Track successful project creation
        trackJourney('project_creation', 'completed', {
          project_title: values.project_title,
          project_id: response.data.data.project.id,
          ai_risk_classification: aiRiskLevel,
          high_risk_role: highRiskRole,
          team_size: values.members.length,
          user_role: userRoleName,
        });

        // Track feature usage
        trackFeature('project_creation', 'success', {
          project_type: 'ai_governance',
          risk_level: aiRiskLevel,
        });

        // Track form submission performance
        trackFormSubmit(true, 0);

        onNewProject({
          isNewProject: true,
          project: response.data.data.project,
        });
      }
    } catch (error) {
      // Track API failure
      trackJourney('project_creation', 'api_error', {
        error_message: error instanceof Error ? error.message : 'Unknown error',
        project_title: values.project_title,
        user_role: userRoleName,
      });

      trackForm('create_project', 'error', {
        error_type: 'network_error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });

      // Track form submission performance (failed)
      trackFormSubmit(false, 0);

      console.error("Error creating use case:", error);
    }
  };

  const riskClassificationItems = useMemo(
    () => [
      { _id: 1, name: AiRiskClassification.PROHIBITED },
      { _id: 2, name: AiRiskClassification.HIGH_RISK },
      { _id: 3, name: AiRiskClassification.LIMITED_RISK },
      { _id: 4, name: AiRiskClassification.MINIMAL_RISK },
    ],
    []
  );

  const highRiskRoleItems = useMemo(
    () => [
      { _id: 1, name: HighRiskRole.DEPLOYER },
      { _id: 2, name: HighRiskRole.PROVIDER },
      { _id: 3, name: HighRiskRole.DISTRIBUTOR },
      { _id: 4, name: HighRiskRole.IMPORTER },
      { _id: 5, name: HighRiskRole.PRODUCT_MANUFACTURER },
      { _id: 6, name: HighRiskRole.AUTHORIZED_REPRESENTATIVE },
    ],
    []
  );

  const fieldStyle = useMemo(
    () => createProjectFormStyles.fieldStyle(theme),
    [theme]
  );

  const handleOnMultiSelect = useCallback(
    (prop: keyof CreateProjectFormValues) =>
      (
        _event: React.SyntheticEvent,
        newValue: CreateProjectFormUserModel[]
      ) => {
        setValues((prevValues) => ({
          ...prevValues,
          [prop]: newValue,
        }));
        setMemberRequired(false);
        setErrors((prevErrors) => ({ ...prevErrors, members: "" }));
      },
    []
  );

  return (
    <Stack>
      <Stack component="form" onSubmit={handleSubmit}>
        <Stack direction="row" sx={createProjectFormStyles.formContainer}>
          <Stack sx={createProjectFormStyles.leftColumn}>
            <Suspense fallback={<div>Loading...</div>}>
              <Field
                id="project-title-input"
                label="Use case title"
                width="350px"
                value={values.project_title}
                onChange={handleOnTextFieldChange("project_title")}
                error={errors.projectTitle}
                sx={fieldStyle}
                isRequired
              />
            </Suspense>
            <Suspense fallback={<div>Loading...</div>}>
              <Select
                id="owner-input"
                label="Owner"
                placeholder="Select owner"
                value={values.owner === 0 ? "" : values.owner}
                onChange={handleOnSelectChange("owner")}
                items={
                  users?.map((user) => ({
                    _id: user.id,
                    name: `${user.name} ${user.surname}`,
                    email: user.email,
                  })) || []
                }
                sx={createProjectFormStyles.selectStyle(theme)}
                error={errors.owner}
                isRequired
              />
            </Suspense>
            <Suspense fallback={<div>Loading...</div>}>
              <Select
                id="risk-classification-input"
                label="AI risk classification"
                placeholder="Select an option"
                value={
                  values.ai_risk_classification === 0
                    ? ""
                    : values.ai_risk_classification
                }
                onChange={handleOnSelectChange("ai_risk_classification")}
                items={riskClassificationItems}
                sx={createProjectFormStyles.selectStyle(theme)}
                error={errors.riskClassification}
                isRequired
              />
            </Suspense>
            <Suspense fallback={<div>Loading...</div>}>
              <Select
                id="type-of-high-risk-role-input"
                label="Type of high risk role"
                placeholder="Select an option"
                value={
                  values.type_of_high_risk_role === 0
                    ? ""
                    : values.type_of_high_risk_role
                }
                onChange={handleOnSelectChange("type_of_high_risk_role")}
                items={highRiskRoleItems}
                sx={createProjectFormStyles.selectStyle(theme)}
                isRequired
                error={errors.typeOfHighRiskRole}
              />
            </Suspense>
          </Stack>
          <Stack>
            <Suspense fallback={<div>Loading...</div>}>
              <Typography sx={createProjectFormStyles.teamMembersTitle(theme)}>
                Team members *
              </Typography>
              <Autocomplete
                multiple
                readOnly={
                  !allowedRoles.projects.editTeamMembers.includes(userRoleName)
                }
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
                    .map(
                      (user) =>
                        ({
                          _id: user.id,
                          name: user.name,
                          surname: user.surname,
                          email: user.email,
                        } satisfies CreateProjectFormUserModel)
                    ) || []
                }
                noOptionsText={
                  values.members.length === users?.length
                    ? "All members selected"
                    : "No options"
                }
                onChange={handleOnMultiSelect("members")}
                getOptionLabel={(user) => `${user.name} ${user.surname}`}
                renderOption={(props, option) => {
                  const userEmail =
                    option.email.length > 30
                      ? `${option.email.slice(0, 30)}...`
                      : option.email;
                  return (
                    <Box component="li" {...props}>
                      <Typography
                        sx={createProjectFormStyles.autocompleteOptionText}
                      >
                        {option.name} {option.surname}
                      </Typography>
                      <Typography
                        sx={createProjectFormStyles.autocompleteEmailText}
                      >
                        {userEmail}
                      </Typography>
                    </Box>
                  );
                }}
                filterSelectedOptions
                popupIcon={<GreyDownArrowIcon size={20} />}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select users"
                    error={memberRequired}
                    sx={createProjectFormStyles.autocompleteTextField}
                  />
                )}
                sx={{
                  ...getAutocompleteStyles(theme, { hasError: memberRequired }),
                  ...createProjectFormStyles.autocompleteContainer(theme),
                }}
                slotProps={createProjectFormStyles.autocompleteSlotProps}
              />
              {memberRequired && (
                <Typography
                  variant="caption"
                  sx={createProjectFormStyles.errorText}
                >
                  {errors.members}
                </Typography>
              )}
            </Suspense>
            <Stack sx={createProjectFormStyles.rightColumnContainer}>
              <Suspense fallback={<div>Loading...</div>}>
                <DatePicker
                  label="Start date"
                  date={
                    values.start_date
                      ? dayjs(values.start_date)
                      : dayjs(new Date())
                  }
                  handleDateChange={handleDateChange}
                  sx={createProjectFormStyles.datePicker}
                  isRequired
                  error={errors.startDate}
                />
              </Suspense>
              <Suspense fallback={<div>Loading...</div>}>
                <Field
                  id="goal-input"
                  label="Goal"
                  type="description"
                  value={values.goal}
                  onChange={handleOnTextFieldChange("goal")}
                  sx={createProjectFormStyles.goalField(theme)}
                  isRequired
                  error={errors.goal}
                />
              </Suspense>
            </Stack>
          </Stack>
        </Stack>
        <Button
          type="submit"
          variant="contained"
          disableRipple={
            theme.components?.MuiButton?.defaultProps?.disableRipple
          }
          sx={createProjectFormStyles.submitButton}
        >
          Create use case
        </Button>
      </Stack>
    </Stack>
  );
};

export default CreateProjectForm;

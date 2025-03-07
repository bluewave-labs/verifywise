import { FC, useState, useMemo, useCallback, useEffect } from "react";
import { Button, SelectChangeEvent, Stack, useTheme, Autocomplete, TextField, Typography, Box } from "@mui/material";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import { useSelector } from "react-redux";
import dayjs, { Dayjs } from "dayjs";
import { checkStringValidation } from "../../../application/validations/stringValidation";
import selectValidation from "../../../application/validations/selectValidation";
import { Suspense, lazy } from "react";
import {
  createNewUser,
  getAllEntities,
} from "../../../application/repository/entity.repository";
const Select = lazy(() => import("../Inputs/Select"));
const DatePicker = lazy(() => import("../Inputs/Datepicker"));
const Field = lazy(() => import("../Inputs/Field"));
const Checkbox = lazy(() => import("../Inputs/Checkbox"));
import { extractUserToken } from "../../../application/tools/extractToken";
import React from "react";
import useUsers from "../../../application/hooks/useUsers";

enum RiskClassificationEnum {
  HighRisk = "High risk",
  LimitedRisk = "Limited risk",
  MinimalRisk = "Minimal risk",
}

enum HighRiskRoleEnum {
  Deployer = "Deployer",
  Provider = "Provider",
  Distributor = "Distributor",
  Importer = "Importer",
  ProductManufacturer = "Product manufacturer",
  AuthorizedRepresentative = "Authorized representative",
}

interface User {
  _id: string;
  name: string;
  surname: string;
  email: string;
}

interface FormValues {
  project_title: string;
  owner: number;
  members: User[];
  start_date: string;
  ai_risk_classification: number;
  type_of_high_risk_role: number;
  goal: string;
  enable_ai_data_insertion: boolean
}

interface FormErrors {
  projectTitle?: string;
  members?: string;
  owner?: string;
  startDate?: string;
  riskClassification?: string;
  typeOfHighRiskRole?: string;
  goal?: string;
}

const initialState: FormValues = {
  project_title: "",
  members: [],
  owner: 0,
  start_date: new Date().toISOString(),
  ai_risk_classification: 0,
  type_of_high_risk_role: 0,
  goal: "",
  enable_ai_data_insertion: false
};

interface CreateProjectFormProps {
  closePopup: () => void;
  onNewProject: (value: { isNewProject: boolean; project: any }) => void;
}

/**
 * `CreateProjectForm` is a functional component that renders a form for creating a new project.
 * It includes fields for project title, users, owner, start date, AI risk classification, type of high risk role, and goal.
 * The form validates the input fields and displays error messages if validation fails.
 * On successful submission, it shows a newly created project on project overview page.
 *
 * @component
 * @returns {JSX.Element} The rendered component.
 */

const CreateProjectForm: FC<CreateProjectFormProps> = ({
  closePopup,
  onNewProject,
}) => {
  const theme = useTheme();
  const [values, setValues] = useState<FormValues>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const { users, loading, error } = useUsers();
  const authState = useSelector(
    (state: { auth: { authToken: string; userExists: boolean } }) => state.auth
  );
  const [memberRequired, setMemberRequired] = useState<boolean>(false);

  useEffect(() => {
    const fetchUsers = async () => {};
    fetchUsers();
  }, []);

  const handleDateChange = useCallback((newDate: Dayjs | null) => {
    if (newDate?.isValid()) {
      setValues((prevValues) => ({
        ...prevValues,
        start_date: newDate ? newDate.toISOString() : "",
      }));
    }
  }, []);

  const handleCheckBoxToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues(( v ) => ({
        ...v,
        enable_ai_data_insertion: event.target.checked
      }))
    },
    []
  );

  const handleOnSelectChange = useCallback(
    (prop: keyof FormValues) => (event: SelectChangeEvent<string | number>) => {
      setValues({ ...values, [prop]: event.target.value });
      setErrors({ ...errors, [prop]: "" });
    },
    [values, errors]
  );

  const handleOnTextFieldChange = useCallback(
    (prop: keyof FormValues) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setValues({ ...values, [prop]: event.target.value });
        setErrors({ ...errors, [prop]: "" });
      },
    [values, errors]
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
    const addTeamMember = selectValidation("Team members", values.members.length);
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
    if (validateForm()) {
      confirmSubmit();
    }
  };

  const confirmSubmit = async () => {
    const userInfo = extractUserToken(authState.authToken);
    
    const teamMember = values.members.map(user => String(user._id))    
    await createNewUser({
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
        members: teamMember
      },
    }).then((response) => {
      // Reset form after successful submission
      setValues(initialState);
      setErrors({});
      closePopup();
      if (response.status === 201) {
        onNewProject({
          isNewProject: true,
          project: response.data.data.project,
        });
      }
    });
  };

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

  const fieldStyle = useMemo(
    () => ({
      backgroundColor: theme.palette.background.main,
      "& input": {
        padding: "0 14px",
      },
    }),
    [theme.palette.background.main]
  );

  const handleOnMultiSelect = useCallback(
    (prop: keyof FormValues) => 
      (_event: React.SyntheticEvent, newValue: any[]) => {        
        setValues((prevValues) => ({
          ...prevValues,
          [prop]: newValue,
        }));
        setMemberRequired(false)
      }, 
    []
  );

  return (
    <Stack>
      <Stack component="form" onSubmit={handleSubmit}>
        <Stack
          direction="row"
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 20,
            rowGap: 8,
            mt: 13.5,
          }}
        >
          <Stack
            sx={{
              rowGap: 8,
            }}
          >
            <Suspense fallback={<div>Loading...</div>}>
              <Field
                id="project-title-input"
                label="Project title"
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
                sx={{
                  width: "350px",
                  backgroundColor: theme.palette.background.main,
                }}
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
                sx={{
                  width: "350px",
                  backgroundColor: theme.palette.background.main,
                }}
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
                sx={{
                  width: "350px",
                  backgroundColor: theme.palette.background.main,
                }}
                isRequired
                error={errors.typeOfHighRiskRole}
              />
            </Suspense>
          </Stack>
          <Stack>
            <Suspense fallback={<div>Loading...</div>}>
              {/* <Select
                id="users-input"
                label="Users"
                placeholder="Select users"
                value={values.members === 0 ? "" : values.users}
                onChange={handleOnSelectChange("members")}
                items={
                  users?.map((user) => ({
                    _id: user.id,
                    name: `${user.name} ${user.surname}`,
                    email: user.email,
                  })) || []
                }
                sx={{
                  width: "350px",
                  backgroundColor: theme.palette.background.main,
                }}
                error={errors.users}
                isRequired
              /> */}
              <Typography
                sx={{ fontSize: theme.typography.fontSize, fontWeight: 500, mb: 2}}
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
                  ?.filter((user) => !values.members.some((selectedUser) => selectedUser._id === user.id))
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
                filterSelectedOptions
                popupIcon={<KeyboardArrowDown />}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select Users"
                    error={memberRequired}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        paddingTop: "3.8px !important", 
                        paddingBottom: "3.8px !important"
                      },
                      "& ::placeholder": {
                        fontSize: "13px",
                      },
                    }}
                  />
                )}
                sx={{
                  width: "350px",
                  backgroundColor: theme.palette.background.main,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "3px", 
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "none",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#888", 
                      borderWidth: "1px", 
                    },
                  }
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
              {memberRequired && <Typography variant="caption" sx={{mt: 4, color: '#f04438', fontWeight: 300}}>{errors.members}</Typography>}
            </Suspense>
            <Stack
              sx={{
                rowGap: 8,
                mt: 8
              }}
            >
              <Suspense fallback={<div>Loading...</div>}>
                <DatePicker
                  label="Start date"
                  date={
                    values.start_date ? dayjs(values.start_date) : dayjs(new Date())
                  }
                  handleDateChange={handleDateChange}
                  sx={{
                    width: "130px",
                    "& input": { width: "85px" },
                  }}
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
                  sx={{
                    backgroundColor: theme.palette.background.main,
                  }}
                  isRequired
                  error={errors.goal}
                />
              </Suspense>
            </Stack>
          </Stack>
        </Stack>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Checkbox
            id="enable-ai-data-insert"
            isChecked={values.enable_ai_data_insertion}
            label="Enable AI-Generated data insertion"
            onChange={handleCheckBoxToggle}
            value="checked"
          ></Checkbox>

          <Button
            type="submit"
            variant="contained"
            disableRipple={
              theme.components?.MuiButton?.defaultProps?.disableRipple
            }
            sx={{
              borderRadius: 2,
              maxHeight: 34,
              textTransform: "inherit",
              backgroundColor: "#4C7DE7",
              boxShadow: "none",
              border: "1px solid #175CD3",
              ml: "auto",
              mr: 0,
              mt: "30px",
              "&:hover": { boxShadow: "none", backgroundColor: "#175CD3 " },
            }}
          >
            Create project
          </Button>
        </Box>
      </Stack>
    </Stack>
  );
};

export default CreateProjectForm;

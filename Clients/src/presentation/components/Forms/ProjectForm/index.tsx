import {
  Autocomplete,
  Box,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
  useTheme,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { ClearIcon } from "@mui/x-date-pickers/icons";
import {
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import { ReactComponent as AddCircleOutlineIcon } from "../../../assets/icons/plus-circle-white.svg"
import Field from "../../../components/Inputs/Field";
import {
  createProjectButtonStyle,
  datePickerStyle,
  teamMembersRenderInputStyle,
  teamMembersSlotProps,
  teamMembersSxStyle,
  textfieldStyle,
  radioGroupStyle,
  radioOptionStyle,
  continueButtonStyle,
} from "./style";
import Select from "../../../components/Inputs/Select";
import useUsers from "../../../../application/hooks/useUsers";
import useFrameworks from "../../../../application/hooks/useFrameworks";
import DatePicker from "../../../components/Inputs/Datepicker";
import dayjs, { Dayjs } from "dayjs";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import selectValidation from "../../../../application/validations/selectValidation";
import CustomizableToast from "../../Toast";
import { ReactComponent as GreyDownArrowIcon } from "../../../assets/icons/chevron-down-grey.svg";
import { extractUserToken } from "../../../../application/tools/extractToken";
import { useSelector } from "react-redux";
import Checkbox from "../../../components/Inputs/Checkbox";
import { Project } from "../../../../domain/types/Project";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import {
  FormErrors,
  HighRiskRoleEnum,
  RiskClassificationEnum,
  FrameworkTypeEnum,
  frameworkOptions,
} from "./constants";
import { FormValues } from "./constants";
import { initialState } from "./constants";
import { ProjectFormProps } from "./constants";
import {
  createProject,
  updateProject,
} from "../../../../application/repository/project.repository";

const ProjectForm = ({
  sx,
  onClose,
  defaultFrameworkType,
  projectToEdit,
}: ProjectFormProps) => {
  const theme = useTheme();
  const { setProjects } = useContext(VerifyWiseContext);

  // Initialize form values based on whether we're editing or creating
  const [values, setValues] = useState<FormValues>(() => {
    if (projectToEdit) {
      return {
        project_title: projectToEdit.project_title || "",
        owner: projectToEdit.owner || 0,
        members: projectToEdit.members || [],
        start_date: projectToEdit.start_date || "",
        ai_risk_classification: projectToEdit.ai_risk_classification || 0,
        type_of_high_risk_role: projectToEdit.type_of_high_risk_role || 0,
        goal: projectToEdit.goal || "",
        enable_ai_data_insertion:
          projectToEdit.enable_ai_data_insertion || false,
        monitored_regulations_and_standards:
          projectToEdit.monitored_regulations_and_standards || [],
        framework_type: projectToEdit.is_organizational
          ? FrameworkTypeEnum.OrganizationWide
          : FrameworkTypeEnum.ProjectBased,
      };
    }
    return {
      ...initialState,
      framework_type: defaultFrameworkType || null,
    };
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [currentStep, setCurrentStep] = useState<number>(1);
  const { users } = useUsers();
  const { allFrameworks } = useFrameworks({ listOfFrameworks: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [frameworkRequired, setFrameworkRequired] = useState<boolean>(false);

  // Auto-advance to step 2 if a default framework type is provided or if editing a project
  useEffect(() => {
    if (defaultFrameworkType || projectToEdit) {
      setCurrentStep(2);
    }
  }, [defaultFrameworkType, projectToEdit]);

  // Filter frameworks based on framework type
  const filteredFrameworks = useMemo(() => {
    if (!allFrameworks) return [];

    if (values.framework_type === FrameworkTypeEnum.ProjectBased) {
      // Only show EU AI Act for project-based frameworks
      return allFrameworks
        .filter((fw) => fw.name.toLowerCase().includes("eu ai act"))
        .map((fw) => ({
          _id: Number(fw.id),
          name: fw.name,
        }));
    } else if (values.framework_type === FrameworkTypeEnum.OrganizationWide) {
      // Only show ISO 42001 and ISO 27001 for organization-wide frameworks
      return allFrameworks
        .filter(
          (fw) =>
            fw.name.toLowerCase().includes("iso 42001") ||
            fw.name.toLowerCase().includes("iso 27001")
        )
        .map((fw) => ({
          _id: Number(fw.id),
          name: fw.name,
        }));
    }

    return [];
  }, [allFrameworks, values.framework_type]);
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
      if (prop === "owner") {
        values.members = values.members.filter(
          (member) => Number(member._id) !== Number(event.target.value)
        );
      }
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
        if (prop !== "members") setFrameworkRequired(newValue.length === 0);
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

  const handleFrameworkTypeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({
        ...values,
        framework_type: event.target.value as FrameworkTypeEnum,
        monitored_regulations_and_standards: [], // Clear selected frameworks when type changes
      });
      setErrors({ ...errors, frameworkType: "" });
    },
    [values, errors]
  );

  const handleContinue = useCallback(() => {
    if (!values.framework_type) {
      setErrors({ ...errors, frameworkType: "Please select a framework type" });
      return;
    }
    setCurrentStep(2);
  }, [values.framework_type, errors]);

  // const handleBack = useCallback(() => {
  //   setCurrentStep(1);
  // }, []);

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

    // Only validate AI-specific fields for project-based frameworks
    if (values.framework_type === FrameworkTypeEnum.ProjectBased) {
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
    }

    // Validate frameworks for both framework types, but skip when editing
    if (
      !projectToEdit &&
      values.monitored_regulations_and_standards.length === 0
    ) {
      newErrors.frameworks = "At least one framework is required.";
      setFrameworkRequired(true);
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
        const body: any = {
          ...values,
          last_updated: values.start_date,
          last_updated_by: userInfo?.id,
          members: teamMember,
          enable_ai_data_insertion: values.enable_ai_data_insertion,
        };

        // Add AI-specific fields only for project-based frameworks
        if (values.framework_type === FrameworkTypeEnum.ProjectBased) {
          body.type_of_high_risk_role = highRiskRoleItems.find(
            (item) => item._id === values.type_of_high_risk_role
          )?.name;
          body.ai_risk_classification = riskClassificationItems.find(
            (item) => item._id === values.ai_risk_classification
          )?.name;
        } else {
          // For organization-wide frameworks, set default values
          body.type_of_high_risk_role = null;
          body.ai_risk_classification = null;
          body.is_organizational = true;
        }

        // Set frameworks for both types, but skip when editing
        if (!projectToEdit) {
          body.framework = values.monitored_regulations_and_standards.map(
            (fw) => fw._id
          );
        }

        let res;
        if (projectToEdit) {
          // Update existing project
          res = await updateProject({
            id: projectToEdit.id,
            body,
          });
        } else {
          // Create new project
          res = await createProject({
            body,
          });
        }

        if (res.status === 201 || res.status === 200 || res.status === 202) {
          if (projectToEdit) {
            // Update the project in the projects list
            setProjects((prevProjects: Project[]) =>
              prevProjects.map((project) =>
                project.id === projectToEdit.id
                  ? (res.data.data as Project)
                  : project
              )
            );
          } else {
            // Add new project to the projects list
            setProjects((prevProjects: Project[]) => [
              ...prevProjects,
              res.data.data.project as Project,
            ]);
          }
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

  const renderStep1 = () => (
    <Stack
      sx={{
        width: "fit-content",
        backgroundColor: "#FCFCFD",
        padding: 10,
        borderRadius: "4px",
        gap: 10,
        ...sx,
        maxWidth: "760px",
      }}
    >
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
            {projectToEdit ? "Edit project" : "Create new project"}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#344054" }}>
            {projectToEdit
              ? "Update your project details below"
              : defaultFrameworkType
              ? `Creating a ${
                  defaultFrameworkType === FrameworkTypeEnum.OrganizationWide
                    ? "organization-wide"
                    : "project-based"
                } project`
              : "Please select the type of frameworks you need"}
          </Typography>
        </Stack>
        <ClearIcon
          sx={{ color: "#98A2B3", cursor: "pointer" }}
          onClick={onClose}
        />
      </Stack>

      <Stack sx={{ gap: 4 }}>
        {!defaultFrameworkType && (
          <>
            <RadioGroup
              value={values.framework_type || ""}
              onChange={handleFrameworkTypeChange}
              sx={radioGroupStyle}
            >
              {frameworkOptions.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={
                    <Stack sx={{ gap: 1 }}>
                      <Typography
                        sx={{ fontSize: 14, fontWeight: 500, color: "#344054" }}
                      >
                        {option.title}
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: "#667085" }}>
                        {option.description}
                      </Typography>
                    </Stack>
                  }
                  sx={{
                    ...radioOptionStyle,
                    "&.Mui-checked": {
                      ...radioOptionStyle["&.selected"],
                    },
                    "& .MuiFormControlLabel-label": {
                      width: "100%",
                    },
                  }}
                />
              ))}
            </RadioGroup>

            {errors.frameworkType && (
              <Typography
                variant="caption"
                sx={{ color: "#f04438", fontWeight: 300 }}
              >
                {errors.frameworkType}
              </Typography>
            )}
          </>
        )}

        <Stack
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
          }}
        >
          <CustomizableButton
            text="Continue"
            sx={continueButtonStyle}
            onClick={handleContinue}
          />
        </Stack>
      </Stack>
    </Stack>
  );

  const renderStep2 = () => (
    <Stack
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: "fit-content",
        backgroundColor: "#FCFCFD",
        padding: 10,
        borderRadius: "4px",
        gap: 8,
        ...sx,
        maxWidth: "760px",
      }}
    >
      {isSubmitting && (
        <Stack
          sx={{
            width: "100vw",
            height: "100%",
            position: "fixed",
            top: "0",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
          }}
        >
          <CustomizableToast
            title={
              projectToEdit
                ? "Updating project. Please wait..."
                : "Creating project. Please wait..."
            }
          />
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
            {projectToEdit ? "Edit project" : "Create new project"}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#344054" }}>
            {projectToEdit
              ? "Update your project details below"
              : values.framework_type === FrameworkTypeEnum.ProjectBased
              ? "Create a new project from scratch by filling in the following."
              : "Set up ISO 27001 or 42001 (Organization ISMS)"}
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
          {values.framework_type === FrameworkTypeEnum.ProjectBased && (
            <>
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
            </>
          )}
        </Stack>
        <Stack className="vwproject-form-body-end" sx={{ gap: 8 }}>
          <Suspense fallback={<div>Loading...</div>}>
            {values.framework_type === FrameworkTypeEnum.ProjectBased && (
              <Stack>
                <Typography
                  sx={{
                    fontSize: theme.typography.fontSize,
                    fontWeight: 500,
                    mb: 2,
                  }}
                >
                  Team members
                </Typography>
                <Autocomplete
                  multiple
                  id="users-input"
                  size="small"
                  value={values.members.map((user) => ({
                    _id: Number(user._id),
                    name: user.name,
                    surname: user.surname,
                    email: user.email,
                  }))}
                  options={
                    users
                      ?.filter(
                        (user) =>
                          !values.members.some(
                            (selectedUser) =>
                              String(selectedUser._id) === String(user.id)
                          ) && values.owner !== user.id
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
                  popupIcon={<GreyDownArrowIcon />}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select Users"
                      error={!!errors.members}
                      sx={teamMembersRenderInputStyle}
                    />
                  )}
                  sx={{
                    backgroundColor: theme.palette.background.main,
                    ...teamMembersSxStyle,
                  }}
                  slotProps={teamMembersSlotProps}
                />
              </Stack>
            )}
            {!projectToEdit && (
              <Stack>
                <Typography
                  sx={{
                    fontSize: theme.typography.fontSize,
                    fontWeight: 500,
                    mb: 2,
                  }}
                >
                  Monitored regulations and standards *
                </Typography>
                <Autocomplete
                  multiple
                  id="monitored-regulations-and-standards-input"
                  size="small"
                  value={values.monitored_regulations_and_standards}
                  options={filteredFrameworks}
                  onChange={handleOnMultiSelect(
                    "monitored_regulations_and_standards"
                  )}
                  getOptionLabel={(item) => item.name}
                  noOptionsText={
                    values.monitored_regulations_and_standards.length ===
                    filteredFrameworks.length
                      ? "All regulations selected"
                      : "No options"
                  }
                  renderOption={(props, option) => {
                    const isComingSoon = option.name.includes("coming soon");
                    return (
                      <Box
                        component="li"
                        {...props}
                        sx={{
                          opacity: isComingSoon ? 0.5 : 1,
                          cursor: isComingSoon ? "not-allowed" : "pointer",
                          "&:hover": {
                            backgroundColor: isComingSoon
                              ? "transparent"
                              : undefined,
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "13px",
                            color: isComingSoon
                              ? "text.secondary"
                              : "text.primary",
                          }}
                        >
                          {option.name}
                        </Typography>
                      </Box>
                    );
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option._id === value._id
                  }
                  getOptionDisabled={(option) =>
                    option.name.includes("coming soon")
                  }
                  filterSelectedOptions
                  popupIcon={<GreyDownArrowIcon />}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={!!errors.frameworks}
                      placeholder="Select regulations and standards"
                      sx={teamMembersRenderInputStyle}
                    />
                  )}
                  sx={{
                    backgroundColor: theme.palette.background.main,
                    ...teamMembersSxStyle,
                  }}
                  slotProps={teamMembersSlotProps}
                />
                {frameworkRequired && (
                  <Typography
                    variant="caption"
                    sx={{ mt: 4, color: "#f04438", fontWeight: 300 }}
                  >
                    {errors.frameworks}
                  </Typography>
                )}
              </Stack>
            )}
          </Suspense>
          <DatePicker
            label="Start date"
            date={
              values.start_date ? dayjs(values.start_date) : dayjs(new Date())
            }
            handleDateChange={handleDateChange}
            sx={{
              ...datePickerStyle,
              ...(projectToEdit && {
                width: "350px",
                "& input": { width: "300px" },
              }),
            }}
            isRequired
            error={errors.startDate}
          />
          {/* Goal field - only for project-based frameworks */}
          {values.framework_type === FrameworkTypeEnum.ProjectBased && (
            <Field
              id="goal-input"
              label="Goal"
              type="description"
              value={values.goal}
              onChange={handleOnTextFieldChange("goal")}
              sx={{
                backgroundColor: theme.palette.background.main,
                ...(projectToEdit && { width: "350px" }), // Fix width when editing
              }}
              isRequired
              error={errors.goal}
            />
          )}
        </Stack>
      </Stack>

      {/* Goal field - full width only for organization-wide frameworks */}
      {values.framework_type === FrameworkTypeEnum.OrganizationWide && (
        <Field
          id="goal-input"
          label="Goal"
          type="description"
          value={values.goal}
          onChange={handleOnTextFieldChange("goal")}
          sx={{
            backgroundColor: theme.palette.background.main,
            width: "100%",
          }}
          isRequired
          error={errors.goal}
        />
      )}
      {!projectToEdit && (
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
      )}
      <Stack
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <CustomizableButton
          text={projectToEdit ? "Update project" : "Create project"}
          sx={createProjectButtonStyle}
          icon={<AddCircleOutlineIcon />}
          onClick={() => handleSubmit()}
        />
      </Stack>
    </Stack>
  );

  return currentStep === 1 ? renderStep1() : renderStep2();
};

export default ProjectForm;

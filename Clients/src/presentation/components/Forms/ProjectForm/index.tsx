import {
  Autocomplete,
  Box,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { X as ClearIcon } from "lucide-react";
import {
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import { PlusCircle as AddCircleOutlineIcon } from "lucide-react";
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
import useFrameworks from "../../../../application/hooks/useFrameworks";
import DatePicker from "../../../components/Inputs/Datepicker";
import dayjs, { Dayjs } from "dayjs";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import selectValidation from "../../../../application/validations/selectValidation";
import CustomizableToast from "../../Toast";
import { ChevronDown as GreyDownArrowIcon } from "lucide-react";
import { extractUserToken } from "../../../../application/tools/extractToken";
import { useSelector } from "react-redux";
import Checkbox from "../../../components/Inputs/Checkbox";
import { Project } from "../../../../domain/types/Project";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import { FormErrors, FrameworkTypeEnum } from "./constants";
import { FormValues } from "./constants";
import { initialState } from "./constants";
import { ProjectFormProps } from "./constants";
import {
  createProject,
  updateProject,
} from "../../../../application/repository/project.repository";
import { AiRiskClassification } from "../../../../domain/enums/aiRiskClassification.enum";
import { HighRiskRole } from "../../../../domain/enums/highRiskRole.enum";

const ProjectForm = ({
  sx,
  onClose,
  defaultFrameworkType,
  projectToEdit,
  useStandardModal = false,
  onSubmitRef,
}: ProjectFormProps) => {
  const theme = useTheme();
  const { setProjects } = useContext(VerifyWiseContext);

  // Initialize form values based on whether we're editing or creating
  const [values, setValues] = useState<FormValues>(() => {
    if (projectToEdit) {
      return {
        project_title: projectToEdit.project_title || "",
        owner: projectToEdit.owner || 0,
        members: [], // Will be populated in useEffect when users data is available
        start_date: projectToEdit.start_date || "",
        ai_risk_classification: projectToEdit.ai_risk_classification || 0,
        status: projectToEdit.status || 1,
        type_of_high_risk_role: projectToEdit.type_of_high_risk_role || 0,
        goal: projectToEdit.goal || "",
        enable_ai_data_insertion:
          projectToEdit.enable_ai_data_insertion || false,
        monitored_regulations_and_standards:
          projectToEdit.monitored_regulations_and_standards || [],
        framework_type: projectToEdit.is_organizational
          ? FrameworkTypeEnum.OrganizationWide
          : FrameworkTypeEnum.ProjectBased,
        geography: projectToEdit.geography || 1,
      };
    }
    return {
      ...initialState,
      framework_type: defaultFrameworkType || null,
    };
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const { users } = useUsers();
  const { allFrameworks } = useFrameworks({ listOfFrameworks: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [frameworkRequired, setFrameworkRequired] = useState<boolean>(false);

  // Transform member IDs to User objects when editing a project
  useEffect(() => {
    if (projectToEdit && users && users.length > 0) {
      const memberUsers =
        projectToEdit.members
          ?.map((memberId: number | string) => {
            const user = users.find((u: any) => u.id === Number(memberId));
            if (user) {
              return {
                _id: String(user.id),
                name: user.name || "",
                surname: user.surname || "",
                email: user.email || "",
              };
            }
            return null;
          })
          .filter(Boolean) || [];

      setValues((prev) => ({
        ...prev,
        members: memberUsers,
      }));
    }
  }, [projectToEdit, users]);

  // Expose handleSubmit through ref when useStandardModal is true
  useEffect(() => {
    if (useStandardModal && onSubmitRef) {
      onSubmitRef.current = handleSubmit;
    }
  }, [useStandardModal, onSubmitRef]);

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

  const geographyItems = useMemo(
    () => [
      { _id: 1, name: "Global" },
      { _id: 2, name: "Europe" },
      { _id: 3, name: "North America" },
      { _id: 4, name: "South America" },
      { _id: 5, name: "Asia" },
      { _id: 6, name: "Africa" },
    ],
    []
  );

  const projectStatusItems = useMemo(
    () => [
      { _id: 1, name: "Not started" },
      { _id: 2, name: "In progress" },
      { _id: 3, name: "Under review" },
      { _id: 4, name: "Completed" },
      { _id: 5, name: "Closed" },
      { _id: 6, name: "On hold" },
      { _id: 7, name: "Rejected" },
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const projectTitle = checkStringValidation(
      values.framework_type === FrameworkTypeEnum.OrganizationWide ? "Framework title" : "Use case title",
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
          status: projectStatusItems.find((item) => item._id === values.status)?.name,
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

  const renderForm = () => (
    <Stack
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: "fit-content",
        backgroundColor: useStandardModal ? "transparent" : "#FCFCFD",
        padding: useStandardModal ? 0 : 10,
        borderRadius: "4px",
        gap: useStandardModal ? 6 : 8,
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
                ? (values.framework_type === FrameworkTypeEnum.OrganizationWide ? "Updating framework. Please wait..." : "Updating use case. Please wait...")
                : (values.framework_type === FrameworkTypeEnum.OrganizationWide ? "Creating framework. Please wait..." : "Creating use case. Please wait...")
            }
          />
        </Stack>
      )}

      {!useStandardModal && (
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
              {projectToEdit
                ? (values.framework_type === FrameworkTypeEnum.OrganizationWide ? "Edit framework" : "Edit use case")
                : (values.framework_type === FrameworkTypeEnum.OrganizationWide ? "Create new framework" : "Create new use case")
              }
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#344054" }}>
              {projectToEdit
                ? (values.framework_type === FrameworkTypeEnum.OrganizationWide ? "Update your framework details below" : "Update your use case details below")
                : values.framework_type === FrameworkTypeEnum.ProjectBased
                ? "Create a new use case from scratch by filling in the following."
                : "Set up ISO 27001 or 42001 (Organization ISMS)"}
            </Typography>
          </Stack>
          <ClearIcon
            size={20}
            style={{ color: "#98A2B3", cursor: "pointer" }}
            onClick={onClose}
          />
        </Stack>
      )}
      <Stack
        className="vwproject-form-body"
        sx={{ display: "flex", flexDirection: "row", gap: 6 }}
      >
        <Stack className="vwproject-form-body-start" sx={{ gap: 6 }}>
          <Field
            id="project-title-input"
            label={values.framework_type === FrameworkTypeEnum.OrganizationWide ? "Framework title" : "Use case title"}
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
            id="project-status-input"
            label={values.framework_type === FrameworkTypeEnum.OrganizationWide ? "Framework status" : "Use case status"}
            placeholder="Select status"
            value={values.status || ""}
            onChange={handleOnSelectChange("status")}
            items={projectStatusItems}
            sx={{
              width: "350px",
              backgroundColor: theme.palette.background.main,
            }}
            error={errors.status}
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
        <Stack className="vwproject-form-body-end" sx={{ gap: 6 }}>
          <Suspense fallback={<div>Loading...</div>}>
            <Stack gap={theme.spacing(2)}>
              <Typography
                component="p"
                variant="body1"
                color={theme.palette.text.secondary}
                fontWeight={500}
                fontSize={"13px"}
                sx={{
                  margin: 0,
                  height: '22px',
                  display: "flex",
                  alignItems: "center",
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
                popupIcon={<GreyDownArrowIcon size={16} />}
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
            <Stack sx={{ display: "flex", flexDirection: "row", gap: 6 }}>
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
                width: "170px",
              }}
              isRequired
              error={errors.startDate}
            />
            <Select
              id="geography-type-input"
              label="Geography"
              placeholder="Select an option"
              value={
                values.geography === 0
                  ? ""
                  : values.geography
              }
              onChange={handleOnSelectChange("geography")}
              items={geographyItems}
              sx={{
                width: "170px",
                backgroundColor: theme.palette.background.main,
              }}
              isRequired
              error={errors.geography}
            />
            </Stack>
            {!projectToEdit &&
              values.framework_type !== FrameworkTypeEnum.OrganizationWide && (
                <Stack>
                  <Typography
                    sx={{
                      fontSize: theme.typography.fontSize,
                      fontWeight: 500,
                      mb: 2,
                    }}
                  >
                    Applicable regulations *
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
                    popupIcon={<GreyDownArrowIcon size={16} />}
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
                marginTop: "4px",
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
        <Stack>
          {!projectToEdit && (
            <Stack sx={{ mb: 2 }}>
              <Typography
                sx={{
                  fontSize: theme.typography.fontSize,
                  fontWeight: 500,
                  mb: 2,
                }}
              >
                Applicable regulations *
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
                popupIcon={<GreyDownArrowIcon size={16} />}
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
                  width: "100%",
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
        </Stack>
      )}
      {!projectToEdit &&
        values.framework_type === FrameworkTypeEnum.ProjectBased && (
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
      {!useStandardModal && (
        <Stack
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <CustomizableButton
            text={projectToEdit
              ? (values.framework_type === FrameworkTypeEnum.OrganizationWide ? "Update framework" : "Update use case")
              : (values.framework_type === FrameworkTypeEnum.OrganizationWide ? "Create framework" : "Create use case")
            }
            sx={createProjectButtonStyle}
            icon={<AddCircleOutlineIcon size={20} />}
            onClick={() => handleSubmit()}
          />
        </Stack>
      )}
    </Stack>
  );

  return renderForm();
};

export default ProjectForm;

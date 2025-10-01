import React, {
  FC,
  useState,
  useCallback,
  Suspense,
  Dispatch,
  SetStateAction,
} from "react";
import {
  Stack,
  Typography,
  useTheme,
  SelectChangeEvent,
  Autocomplete,
  Box,
  TextField,
} from "@mui/material";
import { ReactComponent as GreyDownArrowIcon } from "../../../assets/icons/chevron-down-grey.svg";
import Field from "../../Inputs/Field";
import Select from "../../Inputs/Select";
import Alert from "../../Alert";
import { RiskFormValues, RiskFormErrors } from "../interface";
import { aiLifecyclePhase, riskCategoryItems } from "../projectRiskValue";
import { alertState } from "../../../../domain/interfaces/iAlert";
import useUsers from "../../../../application/hooks/useUsers";
import { useProjects } from "../../../../application/hooks/useProjects";
import useFrameworks from "../../../../application/hooks/useFrameworks";
import allowedRoles from "../../../../application/constants/permissions";
import styles from "../styles.module.css";

const RiskLevel = React.lazy(() => import("../../RiskLevel"));

// Helper function to create common form row styles
const createFormRowStyles = (theme: any) => ({
  display: "flex",
  flexDirection: "row" as const,
  justifyContent: "space-between",
  flexWrap: "wrap" as const,
  gap: theme.spacing(FORM_CONSTANTS.SPACING),
});

// Helper function for autocomplete styles
const getAutocompleteStyles = (theme: any) => ({
  width: FORM_CONSTANTS.FIELD_WIDTH,
  backgroundColor: theme.palette.background.main,
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    backgroundColor: theme.palette.background.main,
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.border?.dark,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
      borderWidth: "2px",
    },
  },
  "& .MuiChip-root": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.background.main,
    fontSize: "12px",
    height: "24px",
    borderRadius: "4px",
    "& .MuiChip-deleteIcon": {
      display: "flex",
      color: theme.palette.background.main,
      "&:hover": {
        color: theme.palette.background.accent,
      },
    },
  },
});

// Constants
const FORM_CONSTANTS = {
  FIELD_WIDTH: "325px",
  LARGE_FIELD_WIDTH: "670px",
  MIN_HEIGHT: 500,
  MAX_HEIGHT: 500,
  CONTENT_MAX_HEIGHT: 600,
  TEXT_AREA_MAX_HEIGHT: "120px",
  SPACING: 8.5,
} as const;

const FORM_STYLES = {
  fontSize: "13px",
  borderRadius: "8px",
  focusedBackground: "#f9fafb",
  padding: "12px",
  chipPadding: "4px",
} as const;

interface RiskSectionProps {
  riskValues: RiskFormValues;
  setRiskValues: Dispatch<SetStateAction<RiskFormValues>>;
  riskErrors: RiskFormErrors;
  userRoleName: string;
}

/**
 * RiskSection component renders a form for adding or updating risk details.
 * It includes fields for risk name, description, potential impact, review notes,
 * action owner, AI lifecycle phase, and risk category. It also calculates the risk level
 * based on likelihood and severity scores.
 *
 * @component
 * @param {RiskSectionProps} props - The props for the RiskSection component
 * @param {RiskFormValues} props.riskValues - Current form values
 * @param {Dispatch<SetStateAction<RiskFormValues>>} props.setRiskValues - Function to update form values
 * @param {RiskFormErrors} props.riskErrors - Current form validation errors
 * @param {string} props.userRoleName - Current user's role name for permissions
 * @returns {JSX.Element} The rendered RiskSection component
 */
const RiskSection: FC<RiskSectionProps> = ({
  riskValues,
  setRiskValues,
  riskErrors,
  userRoleName,
}) => {
  const theme = useTheme();
  const isEditingDisabled =
    !allowedRoles.projectRisks.edit.includes(userRoleName);
  const formRowStyles = createFormRowStyles(theme);
  const autocompleteStyles = getAutocompleteStyles(theme);

  const [alert, setAlert] = useState<alertState | null>(null);
  const { users, loading: usersLoading } = useUsers();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { allFrameworks: frameworks, loading: frameworksLoading } = useFrameworks({ listOfFrameworks: [] });

  const handleOnSelectChange = useCallback(
    (prop: keyof RiskFormValues) =>
      (event: SelectChangeEvent<string | number>) => {
        setRiskValues((prevValues) => ({
          ...prevValues,
          [prop]: event.target.value,
        }));
      },
    [setRiskValues]
  );

  const handleOnMultiselectChange = useCallback(
    (prop: keyof RiskFormValues) =>
      (
        _event: React.SyntheticEvent,
        newValue: any[]
      ) => {
        setRiskValues((prevValues) => ({
          ...prevValues,
          [prop]: newValue.map((item) => Number(item._id || item.id)),
        }));
      },
    [setRiskValues]
  );

  const handleOnTextFieldChange = useCallback(
    (prop: keyof RiskFormValues) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setRiskValues((prevValues) => ({
          ...prevValues,
          [prop]: event.target.value,
        }));
      },
    [setRiskValues]
  );

  return (
    <Stack
      sx={{
        minHeight: FORM_CONSTANTS.MIN_HEIGHT,
        maxHeight: FORM_CONSTANTS.MAX_HEIGHT,
        gap: 3,
      }}
    >
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={true}
          onClick={() => setAlert(null)}
        />
      )}
      <Stack
        component="form"
        className={`AddNewRiskForm ${styles.popupBody}`}
        sx={{
          maxHeight: FORM_CONSTANTS.CONTENT_MAX_HEIGHT,
          width: "100%",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* Risk Scope & Frameworks Section - Moved to top */}
        <Stack
          sx={{
            p: 4,
            backgroundColor: theme.palette.background.accent,
            borderRadius: 2,
            border: `1px solid ${theme.palette.border?.light}`,
          }}
        >
          <Typography
            sx={{
              fontSize: theme.typography.fontSize,
              mb: 3,
              color: theme.palette.text.tertiary,
              lineHeight: 1.5,
            }}
          >
            Define the scope of this risk by selecting applicable projects and frameworks.
          </Typography>

          {/* Horizontal layout for Projects and Frameworks */}
          <Stack direction="row" sx={{ gap: 8.5 }}>
            {/* Applicable Projects */}
            <Stack sx={{ flex: 1 }}>
              <Typography
                sx={{ fontSize: theme.typography.fontSize, fontWeight: 500, mb: 1 }}
              >
                Applicable projects
              </Typography>
              <Autocomplete
                multiple
                readOnly={isEditingDisabled}
                id="applicable-projects-input"
                size="small"
                value={
                  projectsLoading || !projects?.length
                    ? []
                    : projects
                        .filter((project) => !project.is_organizational)
                        .filter((project) =>
                          riskValues.applicableProjects.includes(project.id)
                        )
                }
                options={projects?.filter((project) => !project.is_organizational) || []}
                getOptionLabel={(project) => project.project_title}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  return (
                    <Box key={key} component="li" {...optionProps}>
                      <Typography sx={{
                        fontSize: FORM_STYLES.fontSize,
                        color: theme.palette.text.primary
                      }}>
                        {option.project_title}
                      </Typography>
                    </Box>
                  );
                }}
                popupIcon={<GreyDownArrowIcon />}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={
                      projectsLoading || !projects?.length
                        ? "Loading projects..."
                        : projects?.filter((project) => !project.is_organizational && riskValues.applicableProjects.includes(project.id)).length > 0
                        ? ""
                        : "Select Applicable Projects"
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        paddingTop: `${FORM_STYLES.chipPadding} !important`,
                        paddingBottom: `${FORM_STYLES.chipPadding} !important`,
                      },
                      "& ::placeholder": {
                        fontSize: FORM_STYLES.fontSize,
                      },
                    }}
                  />
                )}
                onChange={handleOnMultiselectChange("applicableProjects")}
                sx={{
                  ...autocompleteStyles,
                  width: "100%",
                  "& .MuiChip-root": {
                    borderRadius: "4px",
                    "& .MuiChip-deleteIcon": {
                      display: "flex",
                    },
                  },
                }}
                slotProps={{
                  paper: {
                    sx: {
                      "& .MuiAutocomplete-listbox": {
                        "& .MuiAutocomplete-option": {
                          fontSize: FORM_STYLES.fontSize,
                          color: theme.palette.text.primary,
                          padding: `8px ${FORM_STYLES.padding}`,
                        },
                        "& .MuiAutocomplete-option.Mui-focused": {
                          backgroundColor: theme.palette.background.accent,
                        },
                      },
                      "& .MuiAutocomplete-noOptions": {
                        fontSize: FORM_STYLES.fontSize,
                        paddingLeft: FORM_STYLES.padding,
                        paddingRight: FORM_STYLES.padding,
                      },
                    },
                  },
                }}
                disabled={projectsLoading}
              />
              {riskErrors.applicableProjects && (
                <Typography
                  sx={{
                    color: theme.palette.error.main,
                    fontSize: "12px",
                    mt: 0.5,
                    ml: 1.75,
                  }}
                >
                  {riskErrors.applicableProjects}
                </Typography>
              )}
            </Stack>

            {/* Applicable Frameworks */}
            <Stack sx={{ flex: 1 }}>
              <Typography
                sx={{ fontSize: theme.typography.fontSize, fontWeight: 500, mb: 1 }}
              >
                Applicable frameworks
              </Typography>
              <Autocomplete
                multiple
                readOnly={isEditingDisabled}
                id="applicable-frameworks-input"
                size="small"
                value={
                  frameworksLoading || !frameworks?.length
                    ? []
                    : frameworks
                        .filter((framework) => framework.is_organizational)
                        .filter((framework) =>
                          riskValues.applicableFrameworks.includes(Number(framework.id))
                        )
                }
                options={frameworks?.filter((framework) => framework.is_organizational) || []}
                getOptionLabel={(framework) => framework.name}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  return (
                    <Box key={key} component="li" {...optionProps}>
                      <Typography sx={{
                        fontSize: FORM_STYLES.fontSize,
                        color: theme.palette.text.primary
                      }}>
                        {option.name}
                      </Typography>
                    </Box>
                  );
                }}
                popupIcon={<GreyDownArrowIcon />}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={
                      frameworksLoading || !frameworks?.length
                        ? "Loading frameworks..."
                        : frameworks?.filter((framework) => framework.is_organizational && riskValues.applicableFrameworks.includes(Number(framework.id))).length > 0
                        ? ""
                        : "Select Applicable Frameworks"
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        paddingTop: `${FORM_STYLES.chipPadding} !important`,
                        paddingBottom: `${FORM_STYLES.chipPadding} !important`,
                      },
                      "& ::placeholder": {
                        fontSize: FORM_STYLES.fontSize,
                      },
                    }}
                  />
                )}
                onChange={handleOnMultiselectChange("applicableFrameworks")}
                sx={{
                  ...autocompleteStyles,
                  width: "100%",
                  "& .MuiChip-root": {
                    borderRadius: "4px",
                    "& .MuiChip-deleteIcon": {
                      display: "flex",
                    },
                  },
                }}
                slotProps={{
                  paper: {
                    sx: {
                      "& .MuiAutocomplete-listbox": {
                        "& .MuiAutocomplete-option": {
                          fontSize: FORM_STYLES.fontSize,
                          color: theme.palette.text.primary,
                          padding: `8px ${FORM_STYLES.padding}`,
                        },
                        "& .MuiAutocomplete-option.Mui-focused": {
                          backgroundColor: theme.palette.background.accent,
                        },
                      },
                      "& .MuiAutocomplete-noOptions": {
                        fontSize: FORM_STYLES.fontSize,
                        paddingLeft: FORM_STYLES.padding,
                        paddingRight: FORM_STYLES.padding,
                      },
                    },
                  },
                }}
                disabled={frameworksLoading}
              />
              {riskErrors.applicableFrameworks && (
                <Typography
                  sx={{
                    color: theme.palette.error.main,
                    fontSize: "12px",
                    mt: 0.5,
                    ml: 1.75,
                  }}
                >
                  {riskErrors.applicableFrameworks}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Stack>

        <Stack sx={{ width: "100%", gap: 3, mt: 9 }}>
          <Stack sx={{ gap: 3 }}>
            {/* Row 1 */}
            <Stack sx={formRowStyles}>
              <Field
                id="risk-name-input"
                label="Risk name"
                placeholder="Write risk name"
                value={riskValues.riskName}
                onChange={handleOnTextFieldChange("riskName")}
                isRequired
                error={riskErrors.riskName}
                sx={{
                  width: FORM_CONSTANTS.FIELD_WIDTH,
                }}
                disabled={isEditingDisabled}
              />
              <Select
                id="action-owner-input"
                label="Action owner"
                placeholder="Select owner"
                value={
                  usersLoading || !users?.length
                    ? ""
                    : riskValues.actionOwner === 0
                    ? ""
                    : riskValues.actionOwner
                }
                onChange={handleOnSelectChange("actionOwner")}
                items={
                  users?.map((user) => ({
                    _id: user.id,
                    name: `${user.name} ${user.surname}`,
                  })) || []
                }
                isRequired
                error={riskErrors.actionOwner}
                sx={{
                  width: FORM_CONSTANTS.FIELD_WIDTH,
                }}
                disabled={isEditingDisabled || usersLoading}
              />
              <Select
                id="ai-lifecycle-phase-input"
                label="AI lifecycle phase"
                placeholder="Select phase"
                value={
                  riskValues.aiLifecyclePhase === 0
                    ? ""
                    : riskValues.aiLifecyclePhase
                }
                onChange={handleOnSelectChange("aiLifecyclePhase")}
                items={aiLifecyclePhase}
                isRequired
                error={riskErrors.aiLifecyclePhase}
                sx={{
                  width: FORM_CONSTANTS.FIELD_WIDTH,
                }}
                disabled={isEditingDisabled}
              />
            </Stack>

            {/* Row 2 */}
            <Stack sx={{ ...formRowStyles, mt: 9 }}>
              <Stack>
                <Stack>
                  <Field
                    id="risk-description-input"
                    label="Risk description"
                    placeholder="Write risk description"
                    value={riskValues.riskDescription}
                    onChange={handleOnTextFieldChange("riskDescription")}
                    isRequired
                    error={riskErrors.riskDescription}
                    sx={{
                      width: FORM_CONSTANTS.FIELD_WIDTH,
                      mb: 4,
                    }}
                    disabled={isEditingDisabled}
                  />
                </Stack>
                <Typography
                  sx={{ fontSize: theme.typography.fontSize, fontWeight: 500 }}
                >
                  Risk categories *
                </Typography>
                <Autocomplete
                  multiple
                  readOnly={isEditingDisabled}
                  id="risk-categories-input"
                  size="small"
                  value={riskCategoryItems.filter((category) =>
                    riskValues.riskCategory.includes(category._id)
                  )}
                  options={riskCategoryItems}
                  getOptionLabel={(category) => `${category.name}`}
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    return (
                      <Box key={key} component="li" {...optionProps}>
                        <Typography sx={{ fontSize: FORM_STYLES.fontSize }}>
                          {option.name}
                        </Typography>
                      </Box>
                    );
                  }}
                  popupIcon={<GreyDownArrowIcon />}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select Risk Categories"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          paddingTop: `${FORM_STYLES.chipPadding} !important`,
                          paddingBottom: `${FORM_STYLES.chipPadding} !important`,
                        },
                        "& ::placeholder": {
                          fontSize: FORM_STYLES.fontSize,
                        },
                      }}
                    />
                  )}
                  onChange={handleOnMultiselectChange("riskCategory")}
                  sx={{
                    ...autocompleteStyles,
                    "& .MuiChip-root": {
                      borderRadius: "4px",
                      "& .MuiChip-deleteIcon": {
                        display:
                          riskValues.riskCategory.length === 1
                            ? "none"
                            : "flex",
                      },
                    },
                  }}
                  slotProps={{
                    paper: {
                      sx: {
                        borderRadius: 2,
                        boxShadow: "0px 4px 24px -4px rgba(16, 24, 40, 0.1)",
                        border: `1px solid ${theme.palette.border?.light}`,
                        "& .MuiAutocomplete-listbox": {
                          "& .MuiAutocomplete-option": {
                            fontSize: FORM_STYLES.fontSize,
                            color: theme.palette.text.primary,
                            padding: `8px ${FORM_STYLES.padding}`,
                            "&:hover": {
                              backgroundColor: theme.palette.background.accent,
                            },
                          },
                          "& .MuiAutocomplete-option.Mui-focused": {
                            backgroundColor: theme.palette.background.accent,
                          },
                        },
                        "& .MuiAutocomplete-noOptions": {
                          fontSize: FORM_STYLES.fontSize,
                          color: theme.palette.text.tertiary,
                          padding: `8px ${FORM_STYLES.padding}`,
                        },
                      },
                    },
                  }}
                />
                {riskErrors.riskCategory && (
                  <Typography
                    sx={{
                      color: theme.palette.error.main,
                      fontSize: "12px",
                      mt: 0.5,
                      ml: 1.75,
                    }}
                  >
                    {riskErrors.riskCategory}
                  </Typography>
                )}
              </Stack>
              <Field
                id="potential-impact-input"
                label="Potential impact"
                type="description"
                placeholder="Describe potential impact"
                value={riskValues.potentialImpact}
                onChange={handleOnTextFieldChange("potentialImpact")}
                isRequired
                error={riskErrors.potentialImpact}
                sx={{
                  width: FORM_CONSTANTS.LARGE_FIELD_WIDTH,
                  "& #potential-impact-input": {
                    maxHeight: FORM_CONSTANTS.TEXT_AREA_MAX_HEIGHT,
                  },
                }}
                disabled={isEditingDisabled}
              />
            </Stack>
          </Stack>
        </Stack>

        <Stack sx={{ gap: 2, mt: 9 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.text.primary }}>
            Calculate inherent risk level
          </Typography>
          <Typography sx={{ fontSize: theme.typography.fontSize, color: theme.palette.text.tertiary, lineHeight: 1.5 }}>
            The Risk Level is calculated by multiplying the Likelihood and
            Severity scores. By assigning these scores, the risk level will be
            determined based on your inputs.
          </Typography>
        </Stack>
        <Stack sx={{ mt: 9 }}>
          <Suspense fallback={<div>Loading...</div>}>
            <RiskLevel
              likelihood={riskValues.likelihood}
              riskSeverity={riskValues.riskSeverity}
              handleOnSelectChange={handleOnSelectChange}
              disabled={isEditingDisabled}
            />
          </Suspense>
        </Stack>
        <Stack>
          <Field
            id="review-notes-input"
            label="Review notes"
            type="description"
            value={riskValues.reviewNotes}
            onChange={handleOnTextFieldChange("reviewNotes")}
            sx={{
              "& #review-notes-input": {
                maxHeight: FORM_CONSTANTS.TEXT_AREA_MAX_HEIGHT,
              },
            }}
            isOptional
            error={riskErrors.reviewNotes}
            disabled={isEditingDisabled}
          />
        </Stack>
      </Stack>
    </Stack>
  );
};

export default RiskSection;

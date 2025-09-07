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
  Divider,
  Typography,
  useTheme,
  SelectChangeEvent,
  Autocomplete,
  Box,
  TextField,
} from "@mui/material";
import { KeyboardArrowDown } from "@mui/icons-material";
import Field from "../../Inputs/Field";
import Select from "../../Inputs/Select";
import Alert from "../../Alert";
import { RiskFormValues, RiskFormErrors } from "../interface";
import { aiLifecyclePhase, riskCategoryItems } from "../projectRiskValue";
import { alertState } from "../../../../domain/interfaces/iAlert";
import useUsers from "../../../../application/hooks/useUsers";
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
    borderRadius: FORM_STYLES.borderRadius,
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: FORM_STYLES.hoverBorderColor,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: FORM_STYLES.focusedBorderColor,
      borderWidth: "1px",
    },
  },
  "& .MuiChip-root": {
    "& .MuiChip-deleteIcon": {
      display: "flex",
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
  borderRadius: "5px",
  hoverBorderColor: "#777",
  focusedBorderColor: "#888",
  focusedBackground: "#f9fafb",
  textColor: "#1c2130",
  padding: "9px",
  chipPadding: "3.8px",
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
        newValue: { _id: number; name: string }[]
      ) => {
        setRiskValues((prevValues) => ({
          ...prevValues,
          [prop]: newValue.map((item) => item._id),
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
        <Stack sx={{ width: "100%", mb: 10 }}>
          <Stack sx={{ gap: 8.5 }}>
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
            <Stack sx={formRowStyles}>
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
                  popupIcon={<KeyboardArrowDown />}
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
                        "& .MuiAutocomplete-listbox": {
                          "& .MuiAutocomplete-option": {
                            fontSize: FORM_STYLES.fontSize,
                            color: FORM_STYLES.textColor,
                            paddingLeft: FORM_STYLES.padding,
                            paddingRight: FORM_STYLES.padding,
                          },
                          "& .MuiAutocomplete-option.Mui-focused": {
                            background: FORM_STYLES.focusedBackground,
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
                label="Potential Impact"
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

        <Divider />
        <Typography sx={{ fontSize: 16, fontWeight: 600, mt: 6.5 }}>
          Calculate inherent risk level
        </Typography>
        <Typography sx={{ fontSize: theme.typography.fontSize, mb: 8 }}>
          The Risk Level is calculated by multiplying the Likelihood and
          Severity scores. By assigning these scores, the risk level will be
          determined based on your inputs.
        </Typography>
        <Suspense fallback={<div>Loading...</div>}>
          <RiskLevel
            likelihood={riskValues.likelihood}
            riskSeverity={riskValues.riskSeverity}
            handleOnSelectChange={handleOnSelectChange}
            disabled={isEditingDisabled}
          />
        </Suspense>
        <Divider />
        <Stack sx={{ mt: 4.5 }}>
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

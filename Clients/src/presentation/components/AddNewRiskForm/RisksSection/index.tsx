import {
  Stack,
  Divider,
  Typography,
  useTheme,
  SelectChangeEvent,
} from "@mui/material";
import { FC, useState, useCallback, Suspense, Dispatch, SetStateAction } from "react";
import Field from "../../Inputs/Field";
import Select from "../../Inputs/Select";
import Alert from "../../Alert";
import React from "react";
import { RiskFormValues, RiskFormErrors } from "../interface";

const RiskLevel = React.lazy(() => import("../../RiskLevel"));

interface RiskSectionProps {
  riskValues: RiskFormValues;
  setRiskValues: Dispatch<SetStateAction<RiskFormValues>>;
  riskErrors: RiskFormErrors;
}

/**
 * `RiskSection` is a functional component that renders a form for adding a new risk.
 * It includes fields for risk name, description, assessment mapping, action owner, risk category,
 * controls mapping, AI lifecycle phase, potential impact, and review notes.
 * The component also validates the form inputs and displays error messages if validation fails.
 *
 * @component
 * @param {RiskSectionProps} props - The props for the component.
 * @param {Function} props.closePopup - Function to close the popup.
 * @param {string} props.status - The status of the form, either "new" or "update".
 *
 * @returns {JSX.Element} The rendered component.
 */
/**
 * RiskSection component is a form used to add or update risk details.
 * It includes fields for risk name, description, potential impact, review notes,
 * action owner, AI lifecycle phase, and risk category. It also calculates the risk level
 * based on likelihood and severity scores.
 *
 * @component
 * @param {RiskSectionProps} props - The props for the RiskSection component.
 * @param {Function} props.closePopup - Function to close the popup form.
 * @param {string} props.status - The status of the form, either "new" or "update".
 *
 * @returns {JSX.Element} The rendered RiskSection component.
 *
 * @example
 * <RiskSection closePopup={closePopupFunction} status="new" />
 */
const RiskSection: FC<RiskSectionProps> = ({ riskValues, setRiskValues, riskErrors }) => {
  const theme = useTheme();
  // const [values, setValues] = useState<RiskFormValues>(initialState);
  const [errors, setErrors] = useState<RiskFormErrors>({});
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);  

  const handleOnSelectChange = useCallback(
    (prop: keyof RiskFormValues) =>
      (event: SelectChangeEvent<string | number>) => {
        setRiskValues((prevValues) => ({
          ...prevValues,
          [prop]: event.target.value,
        }));
        setErrors((prevErrors) => ({ ...prevErrors, [prop]: "" }));
      },
    []
  );

  const handleOnTextFieldChange = useCallback(
    (prop: keyof RiskFormValues) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setRiskValues((prevValues) => ({
          ...prevValues,
          [prop]: event.target.value,
        }));
        setErrors((prevErrors) => ({ ...prevErrors, [prop]: "" }));
      },
    []
  );

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
      <Stack
        className="AddNewRiskForm"
        component="form"
      >
        <Stack sx={{ width: "100%", mb: 10 }}>
          <Stack sx={{ gap: 8.5 }}>
            {/* Row 1 */}
            <Stack
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: theme.spacing(8.5),
              }}
            >
              <Field
                id="risk-name-input"
                label="Project name"
                placeholder="Write risk name"
                value={riskValues.riskName}
                onChange={handleOnTextFieldChange("riskName")}
                sx={{
                  gridRow: "1 / 2",
                  gridColumn: "1 / 2",
                  width: "325px",
                }}
                isRequired
                error={riskErrors.riskName}
              />
              <Select
                id="action-owner-input"
                label="Action owner"
                placeholder="Select owner"
                value={riskValues.actionOwner}
                onChange={handleOnSelectChange("actionOwner")}
                items={[
                  { _id: 1, name: "Owner 1" },
                  { _id: 2, name: "Owner 2" },
                  { _id: 3, name: "Owner 3" },
                ]}
                isRequired
                error={riskErrors.actionOwner}
                sx={{
                  width: "325px",
                }}
              />
              <Select
                id="ai-lifecycle-phase-input"
                label="AI lifecycle phase"
                placeholder="Select phase"
                value={riskValues.aiLifecyclePhase}
                onChange={handleOnSelectChange("aiLifecyclePhase")}
                items={[
                  { _id: 1, name: "Phase 1" },
                  { _id: 2, name: "Phase 2" },
                  { _id: 3, name: "Phase 3" },
                ]}
                isRequired
                error={riskErrors.aiLifecyclePhase}
                sx={{
                  width: "325px",
                }}
              />
            </Stack>

            {/* Row 2 */}
            <Stack
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: theme.spacing(8.5),
              }}
            >
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
                    width: "325px",
                  }}
                />
                <Select
                  id="risk-category-input"
                  label="Risk category"
                  placeholder="Select category"
                  value={riskValues.riskCategory}
                  onChange={handleOnSelectChange("riskCategory")}
                  items={[
                    { _id: 1, name: "Category 1" },
                    { _id: 2, name: "Category 2" },
                    { _id: 3, name: "Category 3" },
                  ]}
                  isRequired
                  error={riskErrors.riskCategory}
                  sx={{
                    width: "325px",
                  }}
                />
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
                  width: "670px",
                  height: "120px",
                  "& #potential-impact-input": {
                    maxHeight: "120px",
                  },
                }}
              />
            </Stack>
          </Stack>
        </Stack>

        <Divider />
        <Typography sx={{ fontSize: 16, fontWeight: 600, mt: 6.5 }}>
          Calculate risk level
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
              backgroundColor: theme.palette.background.main,
              "& #review-notes-input": {
                maxHeight: "120px",
              },
            }}
            isOptional
            error={riskErrors.reviewNotes}
          />
        </Stack>
      </Stack>
    </Stack>
  );
};

export default RiskSection;

import {
  Stack,
  Divider,
  Typography,
  useTheme,
  Button,
  SelectChangeEvent,
} from "@mui/material";
import { FC, useState, useCallback, Suspense } from "react";
import Field from "../../Inputs/Field";
import Select from "../../Inputs/Select";
import { Likelihood, Severity } from "../../RiskLevel/constants";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import Alert from "../../Alert";
import selectValidation from "../../../../application/validations/selectValidation";
import React from "react";

const RiskLevel = React.lazy(() => import("../../RiskLevel"));

interface RiskSectionProps {
  closePopup: () => void;
}

interface RiskFormValues {
  riskName: string;
  actionOwner: number;
  aiLifecyclePhase: number;
  riskDescription: string;
  riskCategory: number;
  potentialImpact: string;
  assessmentMapping: number;
  controlsMapping: number;
  likelihood: Likelihood;
  riskSeverity: Severity;
  riskLevel: number;
  reviewNotes: string;
}

interface FormErrors {
  riskName?: string;
  actionOwner?: string;
  aiLifecyclePhase?: string;
  riskDescription?: string;
  riskCategory?: string;
  potentialImpact?: string;
  assessmentMapping?: string;
  controlsMapping?: string;
  reviewNotes?: string;
}

const initialState: RiskFormValues = {
  riskName: "",
  actionOwner: 0,
  aiLifecyclePhase: 0,
  riskDescription: "",
  riskCategory: 0,
  potentialImpact: "",
  assessmentMapping: 0,
  controlsMapping: 0,
  likelihood: 1 as Likelihood,
  riskSeverity: 1 as Severity,
  riskLevel: 0,
  reviewNotes: "",
};

/**
 * `RiskSection` is a functional component that renders a form for adding a new risk.
 * It includes fields for risk name, description, assessment mapping, action owner, risk category,
 * controls mapping, AI lifecycle phase, potential impact, and review notes.
 * The component also validates the form inputs and displays error messages if validation fails.
 *
 * @component
 * @param {RiskSectionProps} props - The props for the component.
 * @param {Function} props.closePopup - Function to close the popup.
 *
 * @returns {JSX.Element} The rendered component.
 */
const RiskSection: FC<RiskSectionProps> = ({ closePopup }) => {
  const theme = useTheme();
  const [values, setValues] = useState<RiskFormValues>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  const handleOnSelectChange = useCallback(
    (prop: keyof RiskFormValues) =>
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
    (prop: keyof RiskFormValues) =>
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

    const riskName = checkStringValidation("Risk name", values.riskName, 3, 50);
    if (!riskName.accepted) {
      newErrors.riskName = riskName.message;
    }
    const riskDescription = checkStringValidation(
      "Risk description",
      values.riskDescription,
      1,
      256
    );
    if (!riskDescription.accepted) {
      newErrors.riskDescription = riskDescription.message;
    }
    const potentialImpact = checkStringValidation(
      "Potential impact",
      values.potentialImpact,
      1,
      256
    );
    if (!potentialImpact.accepted) {
      newErrors.potentialImpact = potentialImpact.message;
    }
    const reviewNotes = checkStringValidation(
      "Review notes",
      values.reviewNotes,
      0,
      1024
    );
    if (!reviewNotes.accepted) {
      newErrors.reviewNotes = reviewNotes.message;
    }
    const actionOwner = selectValidation("Action owner", values.actionOwner);
    if (!actionOwner.accepted) {
      newErrors.actionOwner = actionOwner.message;
    }
    const aiLifecyclePhase = selectValidation(
      "AI lifecycle phase",
      values.aiLifecyclePhase
    );
    if (!aiLifecyclePhase.accepted) {
      newErrors.aiLifecyclePhase = aiLifecyclePhase.message;
    }
    const riskCategory = selectValidation("Risk category", values.riskCategory);
    if (!riskCategory.accepted) {
      newErrors.riskCategory = riskCategory.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors exist
  }, [values]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validateForm()) {
      //request to the backend
      closePopup();
    }
  };

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
        onSubmit={handleSubmit}
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
                value={values.riskName}
                onChange={handleOnTextFieldChange("riskName")}
                sx={{
                  gridRow: "1 / 2",
                  gridColumn: "1 / 2",
                  width: "325px"
                }}
                isRequired
                error={errors.riskName}
              />
              <Select
                id="action-owner-input"
                label="Action owner"
                placeholder="Select owner"
                value={values.actionOwner}
                onChange={handleOnSelectChange("actionOwner")}
                items={[
                  { _id: 1, name: "Owner 1" },
                  { _id: 2, name: "Owner 2" },
                  { _id: 3, name: "Owner 3" },
                ]}
                isRequired
                error={errors.actionOwner}
                sx={{
                    width: "325px",     
                  }}
              />
              <Select
                id="ai-lifecycle-phase-input"
                label="AI lifecycle phase"
                placeholder="Select phase"
                value={values.aiLifecyclePhase}
                onChange={handleOnSelectChange("aiLifecyclePhase")}
                items={[
                  { _id: 1, name: "Phase 1" },
                  { _id: 2, name: "Phase 2" },
                  { _id: 3, name: "Phase 3" },
                ]}
                isRequired
                error={errors.aiLifecyclePhase}
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
                  value={values.riskDescription}
                  onChange={handleOnTextFieldChange("riskDescription")}
                  isRequired
                  error={errors.riskDescription}
                  sx={{
                    width: "325px",     
                  }}
                />
                <Select
                  id="risk-category-input"
                  label="Risk category"
                  placeholder="Select category"
                  value={values.riskCategory}
                  onChange={handleOnSelectChange("riskCategory")}
                  items={[
                    { _id: 1, name: "Category 1" },
                    { _id: 2, name: "Category 2" },
                    { _id: 3, name: "Category 3" },
                  ]}
                  isRequired
                  error={errors.riskCategory}
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
                value={values.potentialImpact}
                onChange={handleOnTextFieldChange("potentialImpact")}
                isRequired
                error={errors.potentialImpact}
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
            likelihood={values.likelihood}
            riskSeverity={values.riskSeverity}
            handleOnSelectChange={handleOnSelectChange}
          />
        </Suspense>
        <Divider />
        <Stack sx={{ mt: 4.5 }}>
          <Field
            id="review-notes-input"
            label="Review notes"
            type="description"
            value={values.reviewNotes}
            onChange={handleOnTextFieldChange("reviewNotes")}
            sx={{ backgroundColor: theme.palette.background.main ,
                "& #review-notes-input": {
                    maxHeight: "120px",
                  },
            }}
            isOptional
            error={errors.reviewNotes}
            
          />
        </Stack>
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
            "&:hover": { boxShadow: "none" },
          }}
        >
          Save
        </Button>
      </Stack>
    </Stack>
  );
};

export default RiskSection;

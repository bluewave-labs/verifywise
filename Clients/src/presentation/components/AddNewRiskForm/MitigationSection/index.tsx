import { FC, useState, useCallback, useMemo, lazy, Suspense, Dispatch, SetStateAction } from "react";
import {
  Button,
  Divider,
  SelectChangeEvent,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { RISK_LABELS } from "../../RiskLevel/constants";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import selectValidation from "../../../../application/validations/selectValidation";
import { MitigationFormValues } from "../interface";

// Lazy load components
const Select = lazy(() => import("../../Inputs/Select"));
const Field = lazy(() => import("../../Inputs/Field"));
const DatePicker = lazy(() => import("../../Inputs/Datepicker"));
const FileUpload = lazy(() => import("../../Modals/FileUpload"));
const RiskLevel = lazy(() => import("../../RiskLevel"));
const Alert = lazy(() => import("../../Alert"));

// export interface MitigationFormValues {
//   mitigationStatus: number;
//   mitigationPlan: string;
//   currentRiskLevel: number;
//   implementationStrategy: string;
//   deadline: string;
//   doc: string;
//   likelihood: Likelihood;
//   riskSeverity: Severity;
//   approver: number;
//   approvalStatus: number;
//   dateOfAssessment: string;
//   recommendations: string;
// }

interface MitigationSectionProps {
  closePopup: () => void;
  mitigationValues: MitigationFormValues;
  setMitigationValues: Dispatch<SetStateAction<MitigationFormValues>>;
}

interface FormErrors {
  mitigationStatus?: string;
  mitigationPlan?: string;
  currentRiskLevel?: string;
  implementationStrategy?: string;
  deadline?: string;
  doc?: string;
  approver?: string;
  approvalStatus?: string;
  dateOfAssessment?: string;
  recommendations?: string;
}

export enum MitigationStatus {
  NotStarted = "Not started",
  InProgress = "In Progress",
  Completed = "Completed",
  OnHold = "On Hold",
  Deferred = "Deferred",
  Canceled = "Closed",
  RequiresReview = "Requires review",
}

/**
 * MitigationSection component is a form used to add or edit mitigation details for a risk.
 * It includes fields for mitigation plan, implementation strategy, recommendations, deadlines, and approval status.
 * The form validates the input fields and displays errors if any field is invalid.
 *
 * @component
 *
 * @param {Object} props - The component props
 * @param {Function} props.closePopup - Function to close the popup containing the form
 *
 * @returns {JSX.Element} The rendered MitigationSection component
 */
/**
 * MitigationSection component is a form used to capture and validate mitigation details.
 *
 * @component
 * @param {MitigationSectionProps} props - The props for the MitigationSection component.
 * @param {Function} props.closePopup - Function to close the popup.
 *
 * @returns {JSX.Element} The rendered MitigationSection component.
 *
 * @example
 * <MitigationSection closePopup={handleClosePopup} />
 *
 * @remarks
 * This component uses various hooks such as `useState`, `useCallback`, and `useMemo` to manage state and optimize performance.
 * It includes form validation logic and handles form submission.
 * The form fields include mitigation status, mitigation plan, current risk level, implementation strategy, start date, approver, approval status, and recommendations.
 *
 * @requires useTheme
 * @requires useState
 * @requires useCallback
 * @requires useMemo
 * @requires Suspense
 * @requires Stack
 * @requires Alert
 * @requires Select
 * @requires Field
 * @requires DatePicker
 * @requires FileUpload
 * @requires Divider
 * @requires Typography
 * @requires RiskLevel
 * @requires Button
 * @requires checkStringValidation
 * @requires selectValidation
 * @requires dayjs
 */
const MitigationSection: FC<MitigationSectionProps> = ({ closePopup, mitigationValues, setMitigationValues }) => {
  const theme = useTheme();
  // const [values, setValues] = useState<MitigationFormValues>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  const handleOnSelectChange = useCallback(
    (prop: keyof MitigationFormValues) =>
      (event: SelectChangeEvent<string | number>) => {
        setMitigationValues((prevValues) => ({
          ...prevValues,
          [prop]: event.target.value,
        }));
        setErrors((prevErrors) => ({ ...prevErrors, [prop]: "" }));
      },
    []
  );

  const handleDateChange = useCallback(
    (field: string, newDate: Dayjs | null) => {
      setMitigationValues((prevValues) => ({
        ...prevValues,
        [field]: newDate ? newDate.toISOString() : "",
      }));
    },
    []
  );

  const handleOnTextFieldChange = useCallback(
    (prop: keyof MitigationFormValues) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setMitigationValues((prevValues) => ({
          ...prevValues,
          [prop]: event.target.value,
        }));
        setErrors((prevErrors) => ({ ...prevErrors, [prop]: "" }));
      },
    []
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    const mitigationPlan = checkStringValidation(
      "Mitigation plan",
      mitigationValues.mitigationPlan,
      1,
      1024
    );
    if (!mitigationPlan.accepted) {
      newErrors.mitigationPlan = mitigationPlan.message;
    }
    const implementationStrategy = checkStringValidation(
      "Implementation strategy",
      mitigationValues.implementationStrategy,
      1,
      1024
    );
    if (!implementationStrategy.accepted) {
      newErrors.implementationStrategy = implementationStrategy.message;
    }
    const recommendations = checkStringValidation(
      "Recommendations",
      mitigationValues.recommendations,
      1,
      1024
    );
    if (!recommendations.accepted) {
      newErrors.recommendations = recommendations.message;
    }
    const deadline = checkStringValidation(
      "Recommendations",
      mitigationValues.deadline,
      1
    );
    if (!deadline.accepted) {
      newErrors.deadline = deadline.message;
    }
    const dateOfAssessment = checkStringValidation(
      "Recommendations",
      mitigationValues.dateOfAssessment,
      1
    );
    if (!dateOfAssessment.accepted) {
      newErrors.dateOfAssessment = dateOfAssessment.message;
    }
    const mitigationStatus = selectValidation(
      "Mitigation status",
      mitigationValues.mitigationStatus
    );
    if (!mitigationStatus.accepted) {
      newErrors.mitigationStatus = mitigationStatus.message;
    }
    const currentRiskLevel = selectValidation(
      "Current risk level",
      mitigationValues.currentRiskLevel
    );
    if (!currentRiskLevel.accepted) {
      newErrors.currentRiskLevel = currentRiskLevel.message;
    }
    const approver = selectValidation("Approver", mitigationValues.approver);
    if (!approver.accepted) {
      newErrors.approver = approver.message;
    }
    const approvalStatus = selectValidation(
      "Approval status",
      mitigationValues.approvalStatus
    );
    if (!approvalStatus.accepted) {
      newErrors.approvalStatus = approvalStatus.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [mitigationValues]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (validateForm()) {
        //request to the backend
        closePopup();
      }
    },
    [validateForm, closePopup]
  );

  const mitigationStatusItems = useMemo(
    () => [
      { _id: 1, name: MitigationStatus.NotStarted },
      { _id: 2, name: MitigationStatus.InProgress },
      { _id: 3, name: MitigationStatus.Completed },
      { _id: 4, name: MitigationStatus.OnHold },
      { _id: 5, name: MitigationStatus.Deferred },
      { _id: 6, name: MitigationStatus.Canceled },
      { _id: 7, name: MitigationStatus.RequiresReview },
    ],
    []
  );

  const riskLevelItems = useMemo(
    () => [
      { _id: 1, name: RISK_LABELS.critical.text },
      { _id: 2, name: RISK_LABELS.high.text },
      { _id: 3, name: RISK_LABELS.medium.text },
      { _id: 4, name: RISK_LABELS.low.text },
      { _id: 5, name: RISK_LABELS.noRisk.text },
    ],
    []
  );

  const approverItems = useMemo(
    () => [
      { _id: 1, name: "Some value 1" },
      { _id: 2, name: "Some value 2" },
      { _id: 3, name: "Some value 3" },
    ],
    []
  );

  const approvalStatusItems = useMemo(
    () => [
      { _id: 1, name: "Some value 1" },
      { _id: 2, name: "Some value 2" },
      { _id: 3, name: "Some value 3" },
    ],
    []
  );

  return (
    <Stack>
      {alert && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant={alert.variant}
            title={alert.title}
            body={alert.body}
            isToast={true}
            onClick={() => setAlert(null)}
          />
        </Suspense>
      )}
      <Stack component="form" onSubmit={handleSubmit}>
        <Stack sx={{ flexDirection: "row", columnGap: 12.5, mb: 8 }}>
          <Stack sx={{ rowGap: 8.5 }}>
            <Suspense fallback={<div>Loading...</div>}>
              <Select
                id="mitigation-status-input"
                label="Mitigation status"
                placeholder="Select status"
                value={mitigationValues.mitigationStatus}
                onChange={handleOnSelectChange("mitigationStatus")}
                items={mitigationStatusItems}
                sx={{
                  width: 324,
                  backgroundColor: theme.palette.background.main,
                }}
                isRequired
                error={errors.mitigationStatus}
              />
            </Suspense>
            <Suspense fallback={<div>Loading...</div>}>
              <Field
                id="mitigation-plan-input"
                label="Mitigation plan"
                type="description"
                value={mitigationValues.mitigationPlan}
                onChange={handleOnTextFieldChange("mitigationPlan")}
                sx={{ backgroundColor: theme.palette.background.main }}
                isRequired
                error={errors.mitigationPlan}
              />
            </Suspense>
          </Stack>
          <Stack sx={{ rowGap: 8.5 }}>
            <Suspense fallback={<div>Loading...</div>}>
              <Select
                id="current-risk-level-input"
                label="Current risk level"
                placeholder="Select risk level"
                value={mitigationValues.currentRiskLevel}
                onChange={handleOnSelectChange("currentRiskLevel")}
                items={riskLevelItems}
                sx={{
                  width: 324,
                  backgroundColor: theme.palette.background.main,
                }}
                isRequired
                error={errors.currentRiskLevel}
              />
            </Suspense>
            <Suspense fallback={<div>Loading...</div>}>
              <Field
                id="implementation-strategy-input"
                label="Implementation strategy"
                type="description"
                value={mitigationValues.implementationStrategy}
                onChange={handleOnTextFieldChange("implementationStrategy")}
                sx={{ backgroundColor: theme.palette.background.main }}
                isRequired
                error={errors.implementationStrategy}
              />
            </Suspense>
          </Stack>
          <Stack sx={{ rowGap: 8.5 }}>
            <Suspense fallback={<div>Loading...</div>}>
              <DatePicker
                label="Start date"
                date={mitigationValues.deadline ? dayjs(mitigationValues.deadline) : null}
                handleDateChange={(e) => handleDateChange("deadline", e)}
                sx={{
                  width: 130,
                  "& input": { width: 85 },
                }}
                isRequired
                error={errors.deadline}
              />
            </Suspense>
            <Suspense fallback={<div>Loading...</div>}>
              <FileUpload onClose={() => {}} uploadProps={{}} open={false} />
            </Suspense>
          </Stack>
        </Stack>
        <Divider />
        <Typography sx={{ fontSize: 16, fontWeight: 600, mt: 8, mb: 3 }}>
          Residual risk level
        </Typography>
        <Typography sx={{ fontSize: theme.typography.fontSize, mb: 4.5 }}>
          The Risk Level is calculated by multiplying the Likelihood and
          Severity scores. By assigning these scores, the risk level will be
          determined based on your inputs.
        </Typography>
        <Suspense fallback={<div>Loading...</div>}>
          <RiskLevel
            likelihood={mitigationValues.likelihood}
            riskSeverity={mitigationValues.riskSeverity}
            handleOnSelectChange={handleOnSelectChange}
          />
        </Suspense>
        <Divider />
        <Typography sx={{ fontSize: 16, fontWeight: 600, mt: 8, mb: 4.5 }}>
          Risk approval
        </Typography>
        <Stack sx={{ flexDirection: "row", columnGap: 12.5, mb: 9.5 }}>
          <Suspense fallback={<div>Loading...</div>}>
            <Select
              id="approver-input"
              label="Approver"
              placeholder="Select approver"
              value={mitigationValues.approver}
              onChange={handleOnSelectChange("approver")}
              items={approverItems}
              sx={{
                width: 324,
                backgroundColor: theme.palette.background.main,
              }}
              isRequired
              error={errors.approver}
            />
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
            <Select
              id="approval-status-input"
              label="Approval status"
              placeholder="Select status"
              value={mitigationValues.approvalStatus}
              onChange={handleOnSelectChange("approvalStatus")}
              items={approvalStatusItems}
              sx={{
                width: 324,
                backgroundColor: theme.palette.background.main,
              }}
              isRequired
              error={errors.approvalStatus}
            />
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
            <DatePicker
              label="Start date"
              date={
                mitigationValues.dateOfAssessment ? dayjs(mitigationValues.dateOfAssessment) : null
              }
              handleDateChange={(e) => handleDateChange("dateOfAssessment", e)}
              sx={{
                width: 130,
                "& input": { width: 85 },
              }}
              isRequired
              error={errors.dateOfAssessment}
            />
          </Suspense>
        </Stack>
        <Suspense fallback={<div>Loading...</div>}>
          <Field
            id="recommendations-input"
            label="Recommendations"
            type="description"
            value={mitigationValues.recommendations}
            onChange={handleOnTextFieldChange("recommendations")}
            sx={{ backgroundColor: theme.palette.background.main }}
            isOptional
          />
        </Suspense>
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

export default MitigationSection;

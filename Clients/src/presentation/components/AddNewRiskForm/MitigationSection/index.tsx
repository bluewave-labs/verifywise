import {
  FC,
  useState,
  useCallback,
  useMemo,
  lazy,
  Suspense,
  Dispatch,
  SetStateAction,
} from "react";
import {
  Divider,
  SelectChangeEvent,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { MitigationFormValues, MitigationFormErrors } from "../interface";
import styles from "../styles.module.css";
import useUsers from "../../../../application/hooks/useUsers";
import {
  mitigationStatusItems,
  riskLevelItems,
  approvalStatusItems,
} from "../projectRiskValue";
import { alertState } from "../../../../domain/interfaces/iAlert";
import allowedRoles from "../../../../application/constants/permissions";

// Constants
const FORM_FIELD_WIDTH = 325;
const IMPLEMENTATION_STRATEGY_WIDTH = 670;
const DATE_PICKER_WIDTH = 130;
const DATE_INPUT_WIDTH = 85;
const MIN_HEIGHT = 500;
const MAX_HEIGHT = 500;
const MAX_CONTENT_HEIGHT = 400;

// Lazy load components
const Select = lazy(() => import("../../Inputs/Select"));
const Field = lazy(() => import("../../Inputs/Field"));
const DatePicker = lazy(() => import("../../Inputs/Datepicker"));
const RiskLevel = lazy(() => import("../../RiskLevel"));
const Alert = lazy(() => import("../../Alert"));

interface MitigationSectionProps {
  mitigationValues: MitigationFormValues;
  setMitigationValues: Dispatch<SetStateAction<MitigationFormValues>>;
  mitigationErrors?: MitigationFormErrors;
  userRoleName: string;
}
/**
 * MitigationSection component manages mitigation details for risk assessment.
 * 
 * Handles form fields for mitigation plan, implementation strategy, risk levels,
 * approvals, and recommendations with proper validation and state management.
 *
 * @component
 * @param {MitigationSectionProps} props - Component props
 * @param {MitigationFormValues} props.mitigationValues - Current form values
 * @param {function} props.setMitigationValues - State setter for form values
 * @param {MitigationFormErrors} [props.mitigationErrors] - Form validation errors (optional)
 * @param {string} props.userRoleName - Current user's role for permission checks
 * @returns {JSX.Element} Rendered mitigation form section
 */
const MitigationSection: FC<MitigationSectionProps> = ({
  mitigationValues,
  setMitigationValues,
  mitigationErrors = {},
  userRoleName
}) => {
  const theme = useTheme();
  const isEditingDisabled =
    !allowedRoles.projectRisks.edit.includes(userRoleName);

  const [alert, setAlert] = useState<alertState | null>(null);

  const { users } = useUsers();

  // Memoized values
  const userOptions = useMemo(
    () =>
      users?.map((user) => ({
        _id: user.id,
        name: `${user.name} ${user.surname}`,
      })) || [],
    [users]
  );

  const formFieldStyles = useMemo(
    () => ({
      width: FORM_FIELD_WIDTH,
      backgroundColor: theme.palette.background.main,
    }),
    [theme.palette.background.main]
  );

  const datePickerStyles = useMemo(
    () => ({
      width: DATE_PICKER_WIDTH,
      "& input": { width: DATE_INPUT_WIDTH },
    }),
    []
  );

  const handleOnSelectChange = useCallback(
    (prop: keyof MitigationFormValues) =>
      (event: SelectChangeEvent<string | number>) => {
        setMitigationValues((prevValues) => ({
          ...prevValues,
          [prop]: event.target.value,
        }));
      },
    [setMitigationValues]
  );

  const handleDateChange = useCallback(
    (field: keyof Pick<MitigationFormValues, 'deadline' | 'dateOfAssessment'>, newDate: Dayjs | null) => {
      if (newDate?.isValid()) {
        setMitigationValues((prevValues) => ({
          ...prevValues,
          [field]: newDate.toISOString(),
        }));
      } else {
        console.warn(`Invalid date provided for field: ${field}`);
      }
    },
    [setMitigationValues]
  );

  const handleOnTextFieldChange = useCallback(
    (prop: keyof MitigationFormValues) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setMitigationValues((prevValues) => ({
          ...prevValues,
          [prop]: event.target.value,
        }));
      },
    [setMitigationValues]
  );

  return (
    <Stack sx={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}>
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
      <Suspense fallback={<div>Loading form components...</div>}>
        <Stack
          component="form"
          className={styles.popupBody}
          sx={{
            width: "100%",
            maxHeight: "fit-content",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
        <Stack sx={{ width: "100%", mb: 10 }}>
          <Stack sx={{ gap: 8.5, maxHeight: MAX_CONTENT_HEIGHT }}>
            {/* Row 1: Three columns */}
            <Stack
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: theme.spacing(8.5),
              }}
            >
              {/* Mitigation Status */}
              <Select
                  id="mitigation-status-input"
                  label="Mitigation status"
                  placeholder="Select status"
                  value={
                    mitigationValues.mitigationStatus === 0
                      ? ""
                      : mitigationValues.mitigationStatus
                  }
                  onChange={handleOnSelectChange("mitigationStatus")}
                  items={mitigationStatusItems}
                  sx={formFieldStyles}
                  isRequired
                  error={mitigationErrors?.mitigationStatus}
                  disabled={isEditingDisabled}
                />
              {/* Current Risk Level */}
              <Select
                  id="current-risk-level-input"
                  label="Current risk level"
                  placeholder="Select risk level"
                  value={
                    mitigationValues.currentRiskLevel === 0
                      ? ""
                      : mitigationValues.currentRiskLevel
                  }
                  onChange={handleOnSelectChange("currentRiskLevel")}
                  items={riskLevelItems}
                  sx={formFieldStyles}
                  isRequired
                  error={mitigationErrors?.currentRiskLevel}
                  disabled={isEditingDisabled}
                />
              {/* Deadline */}
              <Stack style={{ width: FORM_FIELD_WIDTH }}>
                  <DatePicker
                    label="Deadline"
                    date={
                      mitigationValues.deadline
                        ? dayjs(mitigationValues.deadline)
                        : dayjs(new Date())
                    }
                    handleDateChange={(e) => handleDateChange("deadline", e)}
                    sx={{
                      width: FORM_FIELD_WIDTH,
                      "& input": { width: DATE_INPUT_WIDTH },
                    }}
                    isRequired
                    error={mitigationErrors?.deadline}
                    disabled={isEditingDisabled}
                  />
                </Stack>
            </Stack>
            {/* Row 2: Mitigation Plan and Implementation Strategy */}
            <Stack
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: theme.spacing(8.5),
              }}
            >
              {/* Mitigation Plan */}
              <Field
                  id="mitigation-plan-input"
                  label="Mitigation plan"
                  type="description"
                  value={mitigationValues.mitigationPlan}
                  onChange={handleOnTextFieldChange("mitigationPlan")}
                  sx={{ width: FORM_FIELD_WIDTH }}
                  isRequired
                  error={mitigationErrors?.mitigationPlan}
                  disabled={isEditingDisabled}
                  placeholder="Write mitigation plan"
                />
              {/* Implementation Strategy */}
              <Field
                  id="implementation-strategy-input"
                  label="Implementation strategy"
                  type="description"
                  value={mitigationValues.implementationStrategy}
                  onChange={handleOnTextFieldChange("implementationStrategy")}
                  sx={{ width: IMPLEMENTATION_STRATEGY_WIDTH }}
                  isRequired
                  error={mitigationErrors?.implementationStrategy}
                  disabled={isEditingDisabled}
                  placeholder="Write implementation strategy"
                />
            </Stack>
          </Stack>
        </Stack>
        <Divider />
        <Typography sx={{ fontSize: 16, fontWeight: 600, mt: 8, mb: 3 }}>
          Calculate residual risk level
        </Typography>
        <Typography sx={{ fontSize: theme.typography.fontSize, mb: 4.5 }}>
          The Risk Level is calculated by multiplying the Likelihood and
          Severity scores. By assigning these scores, the risk level will be
          determined based on your inputs.
        </Typography>
          <RiskLevel
            likelihood={mitigationValues.likelihood}
            riskSeverity={mitigationValues.riskSeverity}
            handleOnSelectChange={handleOnSelectChange}
            disabled={isEditingDisabled}
          />
        <Divider />
        <Typography sx={{ fontSize: 16, fontWeight: 600, mt: 8, mb: 4.5 }}>
          Risk approval
        </Typography>
        <Stack sx={{ flexDirection: "row", columnGap: 12.5, mb: 9.5 }}>
            <Select
              id="approver-input"
              label="Approver"
              placeholder="Select approver"
              value={
                mitigationValues.approver === 0 ? "" : mitigationValues.approver
              }
              onChange={handleOnSelectChange("approver")}
              items={userOptions}
              sx={formFieldStyles}
              isRequired
              error={mitigationErrors?.approver}
              disabled={isEditingDisabled}
            />
            <Select
              id="approval-status-input"
              label="Approval status"
              placeholder="Select status"
              value={
                mitigationValues.approvalStatus === 0
                  ? ""
                  : mitigationValues.approvalStatus
              }
              onChange={handleOnSelectChange("approvalStatus")}
              items={approvalStatusItems}
              sx={formFieldStyles}
              isRequired
              error={mitigationErrors?.approvalStatus}
              disabled={isEditingDisabled}
            />
            <DatePicker
              label="Assessment date"
              date={
                mitigationValues.dateOfAssessment
                  ? dayjs(mitigationValues.dateOfAssessment)
                  : dayjs(new Date())
              }
              handleDateChange={(e) => handleDateChange("dateOfAssessment", e)}
              sx={datePickerStyles}
              isRequired
              error={mitigationErrors?.dateOfAssessment}
              disabled={isEditingDisabled}
            />
        </Stack>
          <Field
            id="recommendations-input"
            label="Recommendations"
            type="description"
            value={mitigationValues.recommendations}
            onChange={handleOnTextFieldChange("recommendations")}
            isOptional
            disabled={isEditingDisabled}
          />
        </Stack>
      </Suspense>
    </Stack>
  );
};

export default MitigationSection;

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

// Layout constants - matching RisksSection
const LAYOUT = {
  FIELD_WIDTH: 323,
  COMPACT_FIELD_WIDTH: 318,
  HORIZONTAL_GAP: 8,
  VERTICAL_GAP: 16,
  COMPACT_CONTENT_WIDTH: 970, // Account for scrollbar (~17px)
  get TOTAL_CONTENT_WIDTH() {
    return (this.FIELD_WIDTH * 3) + (this.HORIZONTAL_GAP * 2); // 985px
  },
  get TWO_COLUMN_WIDTH() {
    return (this.FIELD_WIDTH * 2) + this.HORIZONTAL_GAP; // 654px
  },
  get COMPACT_TWO_COLUMN_WIDTH() {
    return (this.COMPACT_FIELD_WIDTH * 2) + this.HORIZONTAL_GAP; // 644px
  },
} as const;

// Constants
const FORM_FIELD_WIDTH = LAYOUT.FIELD_WIDTH;
const DATE_INPUT_WIDTH = 85;
const MIN_HEIGHT = 500;
const MAX_HEIGHT = 500;

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
  disableInternalScroll?: boolean;
  compactMode?: boolean;
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
  userRoleName,
  disableInternalScroll = false,
  compactMode = false,
}) => {
  const theme = useTheme();
  const isEditingDisabled =
    !allowedRoles.projectRisks.edit.includes(userRoleName);

  const [alert, setAlert] = useState<alertState | null>(null);

  const { users, loading: usersLoading } = useUsers();

  // Dynamic layout based on compactMode - squeeze into 990px when sidebar is open
  const fieldWidth = compactMode ? `${LAYOUT.COMPACT_FIELD_WIDTH}px` : `${FORM_FIELD_WIDTH}px`;
  const contentWidth = compactMode ? `${LAYOUT.COMPACT_CONTENT_WIDTH}px` : `${LAYOUT.TOTAL_CONTENT_WIDTH}px`;
  const twoColumnWidth = compactMode ? `${LAYOUT.COMPACT_TWO_COLUMN_WIDTH}px` : `${LAYOUT.TWO_COLUMN_WIDTH}px`;

  const formRowStyles = {
    display: "flex",
    flexDirection: "row" as const,
    justifyContent: "flex-start",
    flexWrap: "wrap" as const,
    gap: `${LAYOUT.HORIZONTAL_GAP}px`,
    width: contentWidth,
  };

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
      width: fieldWidth,
      backgroundColor: theme.palette.background.main,
    }),
    [theme.palette.background.main, fieldWidth]
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
    (
      field: keyof Pick<MitigationFormValues, "deadline" | "dateOfAssessment">,
      newDate: Dayjs | null
    ) => {
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
    <Stack sx={{
      ...(disableInternalScroll ? {} : { minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT })
    }}>
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
          className={disableInternalScroll ? undefined : styles.popupBody}
          sx={{
            width: "100%",
            ...(disableInternalScroll ? {} : {
              maxHeight: "fit-content",
              overflowY: "auto",
              overflowX: "hidden",
            }),
          }}
        >
          <Stack sx={{ width: contentWidth }}>
            <Stack sx={{ gap: `${LAYOUT.VERTICAL_GAP}px` }}>
              {/* Row 1: Three columns */}
              <Stack sx={formRowStyles}>
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
                <Stack style={{ width: fieldWidth }}>
                  <DatePicker
                    label="Deadline"
                    date={
                      mitigationValues.deadline
                        ? dayjs(mitigationValues.deadline)
                        : dayjs(new Date())
                    }
                    handleDateChange={(e) => handleDateChange("deadline", e)}
                    sx={{
                      width: fieldWidth,
                      "& input": { width: DATE_INPUT_WIDTH },
                    }}
                    isRequired
                    error={mitigationErrors?.deadline}
                    disabled={isEditingDisabled}
                  />
                </Stack>
              </Stack>
              {/* Row 2: Mitigation Plan and Implementation Strategy */}
              <Stack sx={formRowStyles}>
                {/* Mitigation Plan */}
                <Field
                  id="mitigation-plan-input"
                  label="Mitigation plan"
                  type="description"
                  rows={3}
                  value={mitigationValues.mitigationPlan}
                  onChange={handleOnTextFieldChange("mitigationPlan")}
                  sx={{ width: fieldWidth }}
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
                  rows={3}
                  value={mitigationValues.implementationStrategy}
                  onChange={handleOnTextFieldChange("implementationStrategy")}
                  sx={{ width: twoColumnWidth }}
                  isRequired
                  error={mitigationErrors?.implementationStrategy}
                  disabled={isEditingDisabled}
                  placeholder="Write implementation strategy"
                />
              </Stack>
            </Stack>
          </Stack>
          <Divider sx={{ mt: `${LAYOUT.VERTICAL_GAP}px` }} />
          <Stack sx={{ gap: `${LAYOUT.HORIZONTAL_GAP}px`, mt: `${LAYOUT.VERTICAL_GAP}px`, width: contentWidth }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
              Calculate residual risk level
            </Typography>
            <Typography sx={{ fontSize: theme.typography.fontSize }}>
              The Risk Level is calculated by multiplying the Likelihood and
              Severity scores. By assigning these scores, the risk level will be
              determined based on your inputs.
            </Typography>
          </Stack>
          <Stack sx={{ mt: `${LAYOUT.VERTICAL_GAP}px`, width: contentWidth }}>
            <RiskLevel
              likelihood={mitigationValues.likelihood}
              riskSeverity={mitigationValues.riskSeverity}
              handleOnSelectChange={handleOnSelectChange}
              disabled={isEditingDisabled}
            />
          </Stack>
          <Divider sx={{ mt: `${LAYOUT.VERTICAL_GAP}px` }} />
          <Typography sx={{ fontSize: 16, fontWeight: 600, mt: `${LAYOUT.VERTICAL_GAP}px` }}>
            Risk approval
          </Typography>
          <Stack sx={{ ...formRowStyles, mt: `${LAYOUT.VERTICAL_GAP}px` }}>
            <Select
              id="approver-input"
              label="Approver"
              placeholder="Select approver"
              value={
                usersLoading || !users?.length
                  ? ""
                  : mitigationValues.approver === 0
                  ? ""
                  : mitigationValues.approver
              }
              onChange={handleOnSelectChange("approver")}
              items={userOptions}
              sx={formFieldStyles}
              isRequired
              error={mitigationErrors?.approver}
              disabled={isEditingDisabled || usersLoading}
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
            <Stack style={{ width: fieldWidth }}>
              <DatePicker
                label="Assessment date"
                date={
                  mitigationValues.dateOfAssessment
                    ? dayjs(mitigationValues.dateOfAssessment)
                    : dayjs(new Date())
                }
                handleDateChange={(e) => handleDateChange("dateOfAssessment", e)}
                sx={{
                  width: fieldWidth,
                  "& input": { width: DATE_INPUT_WIDTH },
                }}
                isRequired
                error={mitigationErrors?.dateOfAssessment}
                disabled={isEditingDisabled}
              />
            </Stack>
          </Stack>
          <Stack sx={{ mt: `${LAYOUT.VERTICAL_GAP}px`, width: contentWidth }}>
            <Field
              id="recommendations-input"
              label="Recommendations"
              type="description"
              rows={3}
              value={mitigationValues.recommendations}
              onChange={handleOnTextFieldChange("recommendations")}
              sx={{ width: "100%" }}
              disabled={isEditingDisabled}
            />
          </Stack>
        </Stack>
      </Suspense>
    </Stack>
  );
};

export default MitigationSection;

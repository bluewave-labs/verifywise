import {
  FC,
  useState,
  useCallback,
  lazy,
  Suspense,
  Dispatch,
  SetStateAction,
  useContext,
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
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import allowedRoles from "../../../../application/constants/permissions";

// Lazy load components
const Select = lazy(() => import("../../Inputs/Select"));
const Field = lazy(() => import("../../Inputs/Field"));
const DatePicker = lazy(() => import("../../Inputs/Datepicker"));
const RiskLevel = lazy(() => import("../../RiskLevel"));
const Alert = lazy(() => import("../../Alert"));

interface MitigationSectionProps {
  mitigationValues: MitigationFormValues;
  setMitigationValues: Dispatch<SetStateAction<MitigationFormValues>>;
  migitateErrors: MitigationFormErrors;
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
 * @requires Divider
 * @requires Typography
 * @requires RiskLevel
 * @requires Button
 * @requires checkStringValidation
 * @requires selectValidation
 * @requires dayjs
 */
const MitigationSection: FC<MitigationSectionProps> = ({
  mitigationValues,
  setMitigationValues,
  migitateErrors,
}) => {
  const theme = useTheme();
  const { userRoleName } = useContext(VerifyWiseContext);
  const isEditingDisabled =
    !allowedRoles.projectRisks.edit.includes(userRoleName);

  const [_, setErrors] = useState<MitigationFormErrors>({});
  const [alert, setAlert] = useState<alertState | null>(null);

  const { users } = useUsers();

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
      if (newDate?.isValid()) {
        setMitigationValues((prevValues) => ({
          ...prevValues,
          [field]: newDate ? newDate.toISOString() : "",
        }));
      }
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

  return (
    <Stack sx={{ minHeight: 500, maxHeight: 500 }}>
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
          <Stack sx={{ gap: 8.5, maxHeight: 400 }}>
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
              <Suspense fallback={<div>Loading...</div>}>
                {" "}
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
                  sx={{
                    width: "325px",
                    backgroundColor: theme.palette.background.main,
                  }}
                  isRequired
                  error={migitateErrors.mitigationStatus}
                  disabled={isEditingDisabled}
                />
              </Suspense>
              <Suspense fallback={<div>Loading...</div>}>
                {" "}
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
                  sx={{
                    width: "325px",
                    backgroundColor: theme.palette.background.main,
                  }}
                  isRequired
                  error={migitateErrors.currentRiskLevel}
                  disabled={isEditingDisabled}
                />
              </Suspense>
              <Suspense fallback={<div>Loading...</div>}>
                {" "}
                {/* Start Date */}
                <Stack style={{ width: "325px" }}>
                  <DatePicker
                    label="Start date"
                    date={
                      mitigationValues.deadline
                        ? dayjs(mitigationValues.deadline)
                        : dayjs(new Date())
                    }
                    handleDateChange={(e) => handleDateChange("deadline", e)}
                    sx={{
                      width: "325px",
                      "& input": { width: 85 },
                    }}
                    isRequired
                    error={migitateErrors.deadline}
                    disabled={isEditingDisabled}
                  />
                </Stack>
              </Suspense>
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
              <Suspense fallback={<div>Loading...</div>}>
                {" "}
                {/* Mitigation Plan */}
                <Field
                  id="mitigation-plan-input"
                  label="Mitigation plan"
                  type="description"
                  value={mitigationValues.mitigationPlan}
                  onChange={handleOnTextFieldChange("mitigationPlan")}
                  sx={{
                    width: "325px",
                  }}
                  isRequired
                  error={migitateErrors.mitigationPlan}
                  disabled={isEditingDisabled}
                  placeholder="Write mitigation plan"
                />
              </Suspense>
              <Suspense fallback={<div>Loading...</div>}>
                {" "}
                {/* Implementation Strategy */}
                <Field
                  id="implementation-strategy-input"
                  label="Implementation strategy"
                  type="description"
                  value={mitigationValues.implementationStrategy}
                  onChange={handleOnTextFieldChange("implementationStrategy")}
                  sx={{
                    width: "670px",
                  }}
                  isRequired
                  error={migitateErrors.implementationStrategy}
                  disabled={isEditingDisabled}
                  placeholder="Write implementation strategy"
                />
              </Suspense>
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
        <Suspense fallback={<div>Loading...</div>}>
          <RiskLevel
            likelihood={mitigationValues.likelihood}
            riskSeverity={mitigationValues.riskSeverity}
            handleOnSelectChange={handleOnSelectChange}
            disabled={isEditingDisabled}
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
              value={
                mitigationValues.approver === 0 ? "" : mitigationValues.approver
              }
              onChange={handleOnSelectChange("approver")}
              items={
                users?.map((user) => ({
                  _id: user.id,
                  name: `${user.name} ${user.surname}`,
                })) || []
              }
              sx={{
                width: 324,
                backgroundColor: theme.palette.background.main,
              }}
              isRequired
              error={migitateErrors.approver}
              disabled={isEditingDisabled}
            />
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
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
              sx={{
                width: 324,
                backgroundColor: theme.palette.background.main,
              }}
              isRequired
              error={migitateErrors.approvalStatus}
              disabled={isEditingDisabled}
            />
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
            <DatePicker
              label="Start date"
              date={
                mitigationValues.dateOfAssessment
                  ? dayjs(mitigationValues.dateOfAssessment)
                  : dayjs(new Date())
              }
              handleDateChange={(e) => handleDateChange("dateOfAssessment", e)}
              sx={{
                width: 130,
                "& input": { width: 85 },
              }}
              isRequired
              error={migitateErrors.dateOfAssessment}
              disabled={isEditingDisabled}
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
            isOptional
            disabled={isEditingDisabled}
          />
        </Suspense>
      </Stack>
    </Stack>
  );
};

export default MitigationSection;

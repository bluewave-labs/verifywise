import React, {
  FC,
  useState,
  useCallback,
  lazy,
  Suspense,
  useContext,
  useEffect,
} from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Stack, Tab, Typography, useTheme } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { ReactComponent as SaveIconSVGWhite } from "../../assets/icons/save-white.svg";
import { ReactComponent as UpdateIconSVGWhite } from "../../assets/icons/update-white.svg";
import dayjs from "dayjs";

import { Likelihood, Severity } from "../RiskLevel/constants";
import { RiskLikelihood, RiskSeverity } from "../RiskLevel/riskValues";
import {
  RiskFormValues,
  RiskFormErrors,
  MitigationFormValues,
  MitigationFormErrors,
} from "./interface";
import {
  aiLifecyclePhase,
  riskCategoryItems,
  mitigationStatusItems,
  approvalStatusItems,
  riskLevelItems,
  likelihoodItems,
  riskSeverityItems,
} from "./projectRiskValue";
import { AddNewRiskFormProps } from "../../../domain/interfaces/iRiskForm";
import { ApiResponse } from "../../../domain/interfaces/iResponse";
import { checkStringValidation } from "../../../application/validations/stringValidation";
import selectValidation from "../../../application/validations/selectValidation";
import { apiServices } from "../../../infrastructure/api/networkServices";
import useUsers from "../../../application/hooks/useUsers";
import { useAuth } from "../../../application/hooks/useAuth";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import allowedRoles from "../../../application/constants/permissions";
import CustomizableButton from "../Button/CustomizableButton";
import { RiskCalculator } from "../../tools/riskCalculator";
import { tabStyle } from "./style";
import "./styles.module.css";

const RiskSection = lazy(() => import("./RisksSection"));
const MitigationSection = lazy(() => import("./MitigationSection"));

// Constants
const COMPONENT_CONSTANTS = {
  MAX_HEIGHT: 550,
  BUTTON_HEIGHT: 34,
  TAB_MARGIN_TOP: "30px",
  TAB_PADDING: "12px 0 0",
  PRIMARY_COLOR: "#13715B",
  TAB_GAP: "34px",
  MIN_TAB_HEIGHT: "20px",
  BORDER_RADIUS: 2,
} as const;

const VALIDATION_LIMITS = {
  RISK_NAME: { MIN: 3, MAX: 50 },
  RISK_DESCRIPTION: { MIN: 1, MAX: 256 },
  POTENTIAL_IMPACT: { MIN: 1, MAX: 256 },
  REVIEW_NOTES: { MIN: 0, MAX: 1024 },
  MITIGATION_PLAN: { MIN: 1, MAX: 1024 },
  IMPLEMENTATION_STRATEGY: { MIN: 1, MAX: 1024 },
  RECOMMENDATIONS: { MIN: 1, MAX: 1024 },
  REQUIRED_FIELD: { MIN: 1 },
} as const;

const riskInitialState: RiskFormValues = {
  riskName: "",
  actionOwner: 0,
  aiLifecyclePhase: 0,
  riskDescription: "",
  riskCategory: [1],
  potentialImpact: "",
  assessmentMapping: 0,
  controlsMapping: 0,
  likelihood: 1 as Likelihood,
  riskSeverity: 1 as Severity,
  riskLevel: 0,
  reviewNotes: "",
  applicableProjects: [],
  applicableFrameworks: [],
};

const mitigationInitialState: MitigationFormValues = {
  mitigationStatus: 0,
  mitigationPlan: "",
  currentRiskLevel: 0,
  implementationStrategy: "",
  deadline: new Date().toISOString(),
  doc: "",
  likelihood: 1 as Likelihood,
  riskSeverity: 1 as Severity,
  approver: 0,
  approvalStatus: 0,
  dateOfAssessment: new Date().toISOString(),
  recommendations: "",
};

/**
 * AddNewRiskForm component allows users to add new risks and mitigations through a tabbed interface.
 * It manages form state, validation, and submission for both risk and mitigation data.
 *
 * @component
 * @param {AddNewRiskFormProps} props - The component props
 * @param {Function} props.closePopup - Function to close the popup
 * @param {Function} props.onSuccess - Callback function called on successful form submission
 * @param {Function} props.onError - Callback function called on form submission error
 * @param {Function} props.onLoading - Callback function called during form submission
 * @param {string} props.popupStatus - Status of the popup ("new" or "edit")
 * @param {RiskFormValues} props.initialRiskValues - Initial values for risk form
 * @param {MitigationFormValues} props.initialMitigationValues - Initial values for mitigation form
 * @returns {JSX.Element} The rendered AddNewRiskForm component
 */
const AddNewRiskForm: FC<AddNewRiskFormProps> = ({
  closePopup,
  onSuccess,
  onError = () => {},
  onLoading = () => {},
  popupStatus,
  initialRiskValues = riskInitialState, // Default to initial state if not provided
  initialMitigationValues = mitigationInitialState,
  users: usersProp,
  usersLoading: usersLoadingProp,
}) => {
  const theme = useTheme();
  const disableRipple =
    theme.components?.MuiButton?.defaultProps?.disableRipple ?? false;

  const [riskErrors, setRiskErrors] = useState<RiskFormErrors>({});
  const [mitigationErrors, setMitigationErrors] =
    useState<MitigationFormErrors>({});
  const [riskValues, setRiskValues] =
    useState<RiskFormValues>(initialRiskValues); // Use initialValues
  const [mitigationValues, setMitigationValues] =
    useState<MitigationFormValues>(initialMitigationValues);
  const [originalRiskValues, setOriginalRiskValues] =
    useState<RiskFormValues>(initialRiskValues); // Track original values for diff
  const [originalMitigationValues, setOriginalMitigationValues] =
    useState<MitigationFormValues>(initialMitigationValues); // Track original values for diff
  const [value, setValue] = useState("risks");
  const handleChange = useCallback(
    (_: React.SyntheticEvent, newValue: string) => {
      setValue(newValue);
    },
    []
  );

  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");

  const { userRoleName } = useAuth();

  // Use props if provided, otherwise fallback to hook
  const hookData = useUsers();
  const users = usersProp || hookData.users;
  const usersLoading = usersLoadingProp !== undefined ? usersLoadingProp : hookData.loading;

  // Get inputValues from context
  const { inputValues } = useContext(VerifyWiseContext) as {
    inputValues: any;
  };

  const isEditingDisabled =
    !allowedRoles.projectRisks.edit.includes(userRoleName);
  const isCreatingDisabled =
    !allowedRoles.projectRisks.create.includes(userRoleName);

  useEffect(() => {
    if (popupStatus === "edit" && !usersLoading && users?.length) {
      // riskData
      const currentRiskData: RiskFormValues = {
        ...riskInitialState,
        riskName: inputValues.risk_name ?? "",
        actionOwner: inputValues.risk_owner,
        riskDescription: inputValues.risk_description ?? "",
        aiLifecyclePhase:
          aiLifecyclePhase.find(
            (item) => item.name === inputValues.ai_lifecycle_phase
          )?._id ?? 1,
        riskCategory: inputValues.risk_category.map(
          (category: string) =>
            riskCategoryItems.find((item) => item.name === category)?._id ?? 1
        ),
        potentialImpact: inputValues.impact ?? "",
        assessmentMapping: inputValues.assessment_mapping,
        controlsMapping: inputValues.controlsMapping,
        likelihood:
          likelihoodItems.find((item) => item.name === inputValues.likelihood)
            ?._id ?? 1,
        riskSeverity:
          riskSeverityItems.find((item) => item.name === inputValues.severity)
            ?._id ?? 1,
        riskLevel: inputValues.riskLevel,
        reviewNotes: inputValues.review_notes ?? "",
        applicableProjects: inputValues.projects || [],
        applicableFrameworks: inputValues.frameworks || [],
      };

      const currentMitigationData: MitigationFormValues = {
        ...mitigationInitialState,
        mitigationStatus:
          mitigationStatusItems.find(
            (item) => item.name === inputValues.mitigation_status
          )?._id ?? 1,
        mitigationPlan: inputValues.mitigation_plan,
        currentRiskLevel:
          riskLevelItems.find(
            (item) => item.name === inputValues.current_risk_level
          )?._id ?? 1,
        implementationStrategy: inputValues.implementation_strategy,
        deadline: inputValues.deadline
          ? dayjs(inputValues.deadline).toISOString()
          : "",
        doc: inputValues.mitigation_evidence_document,
        likelihood:
          likelihoodItems.find(
            (item) => item.name === inputValues.likelihood_mitigation
          )?._id ?? 1,
        riskSeverity:
          riskSeverityItems.find(
            (item) => item.name === inputValues.risk_severity
          )?._id ?? 1,
        approver: inputValues.risk_approval,
        approvalStatus:
          approvalStatusItems.find(
            (item) => item.name === inputValues.approval_status
          )?._id ?? 1,
        dateOfAssessment: inputValues.date_of_assessment
          ? dayjs(inputValues.date_of_assessment).toISOString()
          : "",
      };
      setRiskValues(currentRiskData);
      setMitigationValues(currentMitigationData);
      setOriginalRiskValues(currentRiskData);
      setOriginalMitigationValues(currentMitigationData);
    }
  }, [popupStatus, inputValues, users, usersLoading]);

  // Helper functions for validation
  const validateRiskFields = useCallback(
    (values: RiskFormValues): RiskFormErrors => {
      const errors: RiskFormErrors = {};

      const riskName = checkStringValidation(
        "Risk name",
        values.riskName,
        VALIDATION_LIMITS.RISK_NAME.MIN,
        VALIDATION_LIMITS.RISK_NAME.MAX
      );
      if (!riskName.accepted) {
        errors.riskName = riskName.message;
      }

      const riskDescription = checkStringValidation(
        "Risk description",
        values.riskDescription,
        VALIDATION_LIMITS.RISK_DESCRIPTION.MIN,
        VALIDATION_LIMITS.RISK_DESCRIPTION.MAX
      );
      if (!riskDescription.accepted) {
        errors.riskDescription = riskDescription.message;
      }

      const potentialImpact = checkStringValidation(
        "Potential impact",
        values.potentialImpact,
        VALIDATION_LIMITS.POTENTIAL_IMPACT.MIN,
        VALIDATION_LIMITS.POTENTIAL_IMPACT.MAX
      );
      if (!potentialImpact.accepted) {
        errors.potentialImpact = potentialImpact.message;
      }

      if (values.reviewNotes.length > 0) {
        const reviewNotes = checkStringValidation(
          "Review notes",
          values.reviewNotes,
          VALIDATION_LIMITS.REVIEW_NOTES.MIN,
          VALIDATION_LIMITS.REVIEW_NOTES.MAX
        );
        if (!reviewNotes.accepted) {
          errors.reviewNotes = reviewNotes.message;
        }
      }

      const actionOwner = selectValidation("Action owner", values.actionOwner);
      if (!actionOwner.accepted) {
        errors.actionOwner = actionOwner.message;
      }

      const aiLifecyclePhase = selectValidation(
        "AI lifecycle phase",
        values.aiLifecyclePhase
      );
      if (!aiLifecyclePhase.accepted) {
        errors.aiLifecyclePhase = aiLifecyclePhase.message;
      }

      values.riskCategory.forEach((category) => {
        const riskCategory = selectValidation("Risk category", category);
        if (!riskCategory.accepted) {
          errors.riskCategory = [riskCategory.message];
        }
      });

      return errors;
    },
    []
  );

  const validateMitigationFields = useCallback(
    (values: MitigationFormValues): MitigationFormErrors => {
      const errors: MitigationFormErrors = {};

      const mitigationPlan = checkStringValidation(
        "Mitigation plan",
        values.mitigationPlan,
        VALIDATION_LIMITS.MITIGATION_PLAN.MIN,
        VALIDATION_LIMITS.MITIGATION_PLAN.MAX
      );
      if (!mitigationPlan.accepted) {
        errors.mitigationPlan = mitigationPlan.message;
      }

      const implementationStrategy = checkStringValidation(
        "Implementation strategy",
        values.implementationStrategy,
        VALIDATION_LIMITS.IMPLEMENTATION_STRATEGY.MIN,
        VALIDATION_LIMITS.IMPLEMENTATION_STRATEGY.MAX
      );
      if (!implementationStrategy.accepted) {
        errors.implementationStrategy = implementationStrategy.message;
      }

      const deadline = checkStringValidation(
        "Deadline",
        values.deadline,
        VALIDATION_LIMITS.REQUIRED_FIELD.MIN
      );
      if (!deadline.accepted) {
        errors.deadline = deadline.message;
      }

      const dateOfAssessment = checkStringValidation(
        "Date Of Assessment",
        values.dateOfAssessment,
        VALIDATION_LIMITS.REQUIRED_FIELD.MIN
      );
      if (!dateOfAssessment.accepted) {
        errors.dateOfAssessment = dateOfAssessment.message;
      }

      const mitigationStatus = selectValidation(
        "Mitigation status",
        values.mitigationStatus
      );
      if (!mitigationStatus.accepted) {
        errors.mitigationStatus = mitigationStatus.message;
      }

      const currentRiskLevel = selectValidation(
        "Current risk level",
        values.currentRiskLevel
      );
      if (!currentRiskLevel.accepted) {
        errors.currentRiskLevel = currentRiskLevel.message;
      }

      const approver = selectValidation("Approver", values.approver);
      if (!approver.accepted) {
        errors.approver = approver.message;
      }

      const approvalStatus = selectValidation(
        "Approval status",
        values.approvalStatus
      );
      if (!approvalStatus.accepted) {
        errors.approvalStatus = approvalStatus.message;
      }

      if (values.recommendations.length > 0) {
        const recommendations = checkStringValidation(
          "Recommendation",
          values.recommendations,
          VALIDATION_LIMITS.RECOMMENDATIONS.MIN,
          VALIDATION_LIMITS.RECOMMENDATIONS.MAX
        );
        if (!recommendations.accepted) {
          errors.recommendations = recommendations.message;
        }
      }

      return errors;
    },
    []
  );

  const validateForm = useCallback((): {
    isValid: boolean;
    errors: RiskFormErrors;
    mitigationErrors: MitigationFormErrors;
  } => {
    const newErrors = validateRiskFields(riskValues);
    const newMitigationErrors = validateMitigationFields(mitigationValues);

    setMitigationErrors(newMitigationErrors);
    setRiskErrors(newErrors);

    return {
      isValid:
        Object.keys(newErrors).length === 0 &&
        Object.keys(newMitigationErrors).length === 0,
      errors: newErrors,
      mitigationErrors: newMitigationErrors,
    };
  }, [
    riskValues,
    mitigationValues,
    validateRiskFields,
    validateMitigationFields,
  ]);

  // Helper function to get only changed fields for UPDATE requests
  const getChangedFields = useCallback((
    original: RiskFormValues & MitigationFormValues,
    current: RiskFormValues & MitigationFormValues
  ) => {
    const changedFields: any = {};

    // Check each field for changes
    Object.keys(current).forEach((key) => {
      const originalValue = original[key as keyof (RiskFormValues & MitigationFormValues)];
      const currentValue = current[key as keyof (RiskFormValues & MitigationFormValues)];

      // For arrays, do deep comparison
      if (Array.isArray(originalValue) && Array.isArray(currentValue)) {
        if (JSON.stringify(originalValue.sort()) !== JSON.stringify(currentValue.sort())) {
          changedFields[key] = currentValue;
        }
      }
      // For other values, do simple comparison
      else if (originalValue !== currentValue) {
        changedFields[key] = currentValue;
      }
    });

    return changedFields;
  }, []);

  // Helper function to build form data for API submission
  const buildFormData = useCallback(
    (riskLevel: string, mitigationRiskLevel: string, changedFields?: any) => {
      const fullData = {
        project_id: projectId,
        risk_name: riskValues.riskName,
        risk_owner: riskValues.actionOwner,
        ai_lifecycle_phase:
          aiLifecyclePhase.find(
            (item) => item._id === riskValues.aiLifecyclePhase
          )?.name || "",
        risk_description: riskValues.riskDescription,
        risk_category: riskValues.riskCategory.map(
          (category) =>
            riskCategoryItems.find((item) => item._id === category)?.name
        ),
        impact: riskValues.potentialImpact,
        assessment_mapping: riskValues.assessmentMapping,
        controls_mapping: riskValues.controlsMapping,
        likelihood:
          likelihoodItems.find((item) => item._id === riskValues.likelihood)
            ?.name || "",
        severity:
          riskSeverityItems.find((item) => item._id === riskValues.riskSeverity)
            ?.name || "",
        risk_level_autocalculated: riskLevel,
        review_notes: riskValues.reviewNotes,
        mitigation_status:
          mitigationStatusItems.find(
            (item) => item._id === mitigationValues.mitigationStatus
          )?.name || "",
        current_risk_level:
          riskLevelItems.find(
            (item) => item._id === mitigationValues.currentRiskLevel
          )?.name || "",
        deadline: mitigationValues.deadline,
        mitigation_plan: mitigationValues.mitigationPlan,
        implementation_strategy: mitigationValues.implementationStrategy,
        mitigation_evidence_document: mitigationValues.doc,
        likelihood_mitigation:
          likelihoodItems.find(
            (item) => item._id === mitigationValues.likelihood
          )?.name || "",
        risk_severity:
          riskSeverityItems.find(
            (item) => item._id === mitigationValues.riskSeverity
          )?.name === "Catastrophic"
            ? "Critical"
            : riskSeverityItems.find(
                (item) => item._id === mitigationValues.riskSeverity
              )?.name || "",
        final_risk_level: mitigationRiskLevel,
        risk_approval: mitigationValues.approver,
        approval_status:
          approvalStatusItems.find(
            (item) => item._id === mitigationValues.approvalStatus
          )?.name || "",
        date_of_assessment: mitigationValues.dateOfAssessment,
        projects: riskValues.applicableProjects,
        frameworks: riskValues.applicableFrameworks,
      };

      // If changedFields is provided (for updates), only return the changed fields
      if (changedFields) {
        const updateData: any = {};

        // Map frontend field names to backend field names and include only changed fields
        const fieldMapping: Record<string, string> = {
          riskName: 'risk_name',
          actionOwner: 'risk_owner',
          aiLifecyclePhase: 'ai_lifecycle_phase',
          riskDescription: 'risk_description',
          riskCategory: 'risk_category',
          potentialImpact: 'impact',
          assessmentMapping: 'assessment_mapping',
          controlsMapping: 'controls_mapping',
          likelihood: 'likelihood',
          riskSeverity: 'severity',
          riskLevel: 'risk_level_autocalculated',
          reviewNotes: 'review_notes',
          mitigationStatus: 'mitigation_status',
          currentRiskLevel: 'current_risk_level',
          deadline: 'deadline',
          mitigationPlan: 'mitigation_plan',
          implementationStrategy: 'implementation_strategy',
          doc: 'mitigation_evidence_document',
          approver: 'risk_approval',
          approvalStatus: 'approval_status',
          dateOfAssessment: 'date_of_assessment',
          applicableProjects: 'projects',
          applicableFrameworks: 'frameworks',
        };

        Object.keys(changedFields).forEach(frontendField => {
          const backendField = fieldMapping[frontendField];
          if (backendField && fullData.hasOwnProperty(backendField)) {
            updateData[backendField] = fullData[backendField as keyof typeof fullData];
          }
        });

        // Always include calculated risk levels if any risk-related field changed
        if (Object.keys(changedFields).some(field =>
          ['likelihood', 'riskSeverity', 'riskName', 'riskDescription', 'potentialImpact'].includes(field)
        )) {
          updateData.risk_level_autocalculated = riskLevel;
        }

        // Always include mitigation risk level if any mitigation-related field changed
        if (Object.keys(changedFields).some(field =>
          ['mitigationStatus', 'currentRiskLevel', 'mitigationPlan', 'implementationStrategy'].includes(field)
        )) {
          updateData.final_risk_level = mitigationRiskLevel;
        }

        // Add boolean flags for deleted/emptied linked projects and frameworks
        // These flags will be set where buildFormData is called since we have access to original values there

        return updateData;
      }

      // Return full data for create operations
      return fullData;
    },
    [projectId, riskValues, mitigationValues]
  );

  const riskFormSubmitHandler = async () => {
    const { isValid, errors } = validateForm();
    const selectedRiskLikelihood = likelihoodItems.find(
      (r) => r._id === riskValues.likelihood
    );
    const selectedRiskSeverity = riskSeverityItems.find(
      (r) => r._id === riskValues.riskSeverity
    );
    if (!selectedRiskLikelihood || !selectedRiskSeverity) {
      console.error("Could not find selected likelihood or severity");
      return;
    }

    const risk_risklevel = RiskCalculator.getRiskLevel(
      selectedRiskLikelihood.name as RiskLikelihood,
      selectedRiskSeverity.name as RiskSeverity
    );

    const selectedMitigationLikelihood = likelihoodItems.find(
      (r) => r._id === mitigationValues.likelihood
    );
    const selectedMitigationSeverity = riskSeverityItems.find(
      (r) => r._id === mitigationValues.riskSeverity
    );
    if (!selectedMitigationLikelihood || !selectedMitigationSeverity) {
      console.error("Could not find selected likelihood or severity");
      return;
    }

    const mitigation_risklevel = RiskCalculator.getRiskLevel(
      selectedMitigationLikelihood.name as RiskLikelihood,
      selectedMitigationSeverity.name as RiskSeverity
    );

    // Check forms validation
    if (isValid) {
      onLoading(
        popupStatus !== "new"
          ? "Updating the risk. Please wait..."
          : "Creating the risk. Please wait..."
      );

      let formData;

      if (popupStatus !== "new") {
        // For updates, get only changed fields
        const combinedOriginal = { ...originalRiskValues, ...originalMitigationValues };
        const combinedCurrent = { ...riskValues, ...mitigationValues };
        const changedFields = getChangedFields(combinedOriginal, combinedCurrent);

        formData = buildFormData(
          risk_risklevel.level,
          mitigation_risklevel.level,
          changedFields
        );

        // Add boolean flags for deleted/emptied linked projects and frameworks
        if (changedFields.hasOwnProperty('applicableProjects')) {
          const originalProjects = originalRiskValues?.applicableProjects || [];
          const currentProjects = riskValues.applicableProjects || [];
          formData.deletedLinkedProject = originalProjects.length > 0 && currentProjects.length === 0;
        }

        if (changedFields.hasOwnProperty('applicableFrameworks')) {
          const originalFrameworks = originalRiskValues?.applicableFrameworks || [];
          const currentFrameworks = riskValues.applicableFrameworks || [];
          formData.deletedLinkedFrameworks = originalFrameworks.length > 0 && currentFrameworks.length === 0;
        }

        console.log('Changed fields:', changedFields);
        console.log('Sending only:', formData);
      } else {
        // For creates, send all fields
        formData = buildFormData(
          risk_risklevel.level,
          mitigation_risklevel.level
        );
      }

      try {
        const response =
          popupStatus !== "new"
            ? await apiServices.put("/projectRisks/" + inputValues.id, formData)
            : await apiServices.post("/projectRisks", formData);

        if (response && response.status === 201) {
          // risk create success
          closePopup();
          onSuccess();
        } else if (response && response.status === 200) {
          // risk update success
          closePopup();
          onSuccess();
        } else {
          const errorMessage =
            (response?.data as ApiResponse)?.message ||
            "Unknown error occurred";
          console.error((response?.data as ApiResponse)?.error);
          onError(errorMessage);
        }
      } catch (error) {
        console.error("Error sending request", error);
        onError(error || "Network error occurred");
      }
    } else {
      if (Object.keys(errors).length) {
        setValue("risks");
      } else {
        setValue("mitigation");
      }
    }
  };

  // Show loading state while users are being fetched
  if (usersLoading) {
    return (
      <Stack className="AddNewRiskForm" sx={{ p: 3, textAlign: "center" }}>
        <Typography>Loading form data...</Typography>
      </Stack>
    );
  }

  return (
    <Stack className="AddNewRiskForm">
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList
            onChange={handleChange}
            aria-label="Add new risk tabs"
            TabIndicatorProps={{
              style: { backgroundColor: COMPONENT_CONSTANTS.PRIMARY_COLOR },
            }}
            sx={{
              minHeight: COMPONENT_CONSTANTS.MIN_TAB_HEIGHT,
              "& .MuiTabs-flexContainer": {
                columnGap: COMPONENT_CONSTANTS.TAB_GAP,
              },
            }}
          >
            <Tab
              label="Risks"
              value="risks"
              sx={tabStyle}
              disableRipple={disableRipple}
            />
            <Tab
              label="Mitigation"
              value="mitigation"
              sx={tabStyle}
              disableRipple={disableRipple}
            />
          </TabList>
        </Box>
        <Suspense fallback={<div>Loading...</div>}>
          <TabPanel
            value="risks"
            sx={{
              p: COMPONENT_CONSTANTS.TAB_PADDING,
              maxHeight: COMPONENT_CONSTANTS.MAX_HEIGHT,
            }}
          >
            <RiskSection
              riskValues={riskValues}
              setRiskValues={setRiskValues}
              riskErrors={riskErrors}
              userRoleName={userRoleName}
            />
          </TabPanel>
          <TabPanel
            value="mitigation"
            sx={{
              p: COMPONENT_CONSTANTS.TAB_PADDING,
              maxHeight: COMPONENT_CONSTANTS.MAX_HEIGHT,
            }}
          >
            <MitigationSection
              mitigationValues={mitigationValues}
              setMitigationValues={setMitigationValues}
              mitigationErrors={mitigationErrors}
              userRoleName={userRoleName}
            />
          </TabPanel>
        </Suspense>
        <Box sx={{ display: "flex" }}>
          <CustomizableButton
            sx={{
              alignSelf: "flex-end",
              width: "fit-content",
              backgroundColor: COMPONENT_CONSTANTS.PRIMARY_COLOR,
              border: `1px solid ${COMPONENT_CONSTANTS.PRIMARY_COLOR}`,
              gap: 2,
              borderRadius: COMPONENT_CONSTANTS.BORDER_RADIUS,
              maxHeight: COMPONENT_CONSTANTS.BUTTON_HEIGHT,
              textTransform: "inherit",
              boxShadow: "none",
              ml: "auto",
              mr: 0,
              mt: COMPONENT_CONSTANTS.TAB_MARGIN_TOP,
              "&:hover": { boxShadow: "none" },
            }}
            icon={
              popupStatus === "new" ? (
                <SaveIconSVGWhite />
              ) : (
                <UpdateIconSVGWhite />
              )
            }
            variant="contained"
            onClick={riskFormSubmitHandler}
            text={popupStatus === "new" ? "Save" : "Update"}
            isDisabled={
              popupStatus === "new" ? isCreatingDisabled : isEditingDisabled
            }
          />
        </Box>
      </TabContext>
    </Stack>
  );
};

export default AddNewRiskForm;

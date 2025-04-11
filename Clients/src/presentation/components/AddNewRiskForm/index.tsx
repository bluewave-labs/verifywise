import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Box, Stack, Tab, useTheme } from "@mui/material";
import {
  FC,
  useState,
  useCallback,
  useMemo,
  lazy,
  Suspense,
  useContext,
  useEffect,
} from "react";
import "./styles.module.css";
import { Likelihood, Severity } from "../RiskLevel/constants";
import {
  RiskFormValues,
  RiskFormErrors,
  MitigationFormValues,
  MitigationFormErrors,
} from "./interface";

import { checkStringValidation } from "../../../application/validations/stringValidation";
import selectValidation from "../../../application/validations/selectValidation";

import { apiServices } from "../../../infrastructure/api/networkServices";
import { useSearchParams } from "react-router-dom";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import dayjs from "dayjs";
import useUsers from "../../../application/hooks/useUsers";
import { RISK_LABELS } from "../RiskLevel/constants";
import {
  aiLifecyclePhase,
  riskCategoryItems,
  mitigationStatusItems,
  approvalStatusItems,
  riskLevelItems,
  likelihoodItems,
  riskSeverityItems,
} from "./projectRiskValue";
import VWButton from "../../vw-v2-components/Buttons";
import SaveIcon from "@mui/icons-material/Save";
import UpdateIcon from "@mui/icons-material/Update";

const RiskSection = lazy(() => import("./RisksSection"));
const MitigationSection = lazy(() => import("./MitigationSection"));

interface AddNewRiskFormProps {
  closePopup: () => void;
  popupStatus: string;
  initialRiskValues?: RiskFormValues; // New prop for initial values
  initialMitigationValues?: MitigationFormValues; // New prop for initial values
  onSuccess: () => void;
  onError?: (message: any) => void;
  onLoading?: (message: any) => void;
}

interface ApiResponse {
  message: string;
  error: string;
}

const riskInitialState: RiskFormValues = {
  riskName: "",
  actionOwner: 0,
  aiLifecyclePhase: 0,
  riskDescription: "",
  riskCategory: 1,
  potentialImpact: "",
  assessmentMapping: 0,
  controlsMapping: 0,
  likelihood: 1 as Likelihood,
  riskSeverity: 1 as Severity,
  riskLevel: 0,
  reviewNotes: "",
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
 *
 * @param {Object} props - The component props.
 * @param {Function} props.closePopup - Function to close the popup.
 * @param {boolean} props.popupStatus - Status of the popup.
 *
 * @returns {JSX.Element} The rendered AddNewRiskForm component.
 *
 * @component
 *
 * @example
 * return (
 *   <AddNewRiskForm closePopup={closePopupFunction} popupStatus={true} />
 * )
 */
const AddNewRiskForm: FC<AddNewRiskFormProps> = ({
  closePopup,
  onSuccess,
  onError = () => {},
  onLoading = () => {},
  popupStatus,
  initialRiskValues = riskInitialState, // Default to initial state if not provided
  initialMitigationValues = mitigationInitialState,
}) => {
  const theme = useTheme();
  const disableRipple =
    theme.components?.MuiButton?.defaultProps?.disableRipple;

  const [riskErrors, setRiskErrors] = useState<RiskFormErrors>({});
  const [migitateErrors, setMigitateErrors] = useState<MitigationFormErrors>(
    {}
  );
  const [riskValues, setRiskValues] =
    useState<RiskFormValues>(initialRiskValues); // Use initialValues
  const [mitigationValues, setMitigationValues] =
    useState<MitigationFormValues>(initialMitigationValues);
  const [value, setValue] = useState("risks");
  const handleChange = useCallback(
    (_: React.SyntheticEvent, newValue: string) => {
      console.log(newValue);
      setValue(newValue);
    },
    []
  );

  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { inputValues } = useContext(VerifyWiseContext);
  const { users } = useUsers();

  const tabStyle = useMemo(
    () => ({
      textTransform: "none",
      fontWeight: 400,
      alignItems: "flex-start",
      justifyContent: "flex-end",
      padding: "16px 0 7px",
      minHeight: "20px",
      "&.Mui-selected": {
        color: "#13715B",
      },
    }),
    []
  );

  useEffect(() => {
    if (popupStatus === "edit") {

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
        riskCategory:
          riskCategoryItems.find(
            (item) => item.name === inputValues.risk_category
          )?._id ?? 1,
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
    }
  }, [popupStatus, users]);

  const getRiskLevel = (score: number): { text: string; color: string } => {
    if (score <= 3) {
      return RISK_LABELS.low;
    } else if (score <= 6) {
      return RISK_LABELS.medium;
    } else if (score <= 9) {
      return RISK_LABELS.high;
    } else {
      return RISK_LABELS.critical;
    }
  };

  const validateForm = useCallback((): {
    isValid: boolean;
    errors: RiskFormErrors;
    mitigationErrors: MitigationFormErrors;
  } => {
    const newErrors: RiskFormErrors = {};
    const newMitigationErrors: MitigationFormErrors = {};

    const riskName = checkStringValidation(
      "Risk name",
      riskValues.riskName,
      3,
      50
    );
    if (!riskName.accepted) {
      newErrors.riskName = riskName.message;
    }
    const riskDescription = checkStringValidation(
      "Risk description",
      riskValues.riskDescription,
      1,
      256
    );
    if (!riskDescription.accepted) {
      newErrors.riskDescription = riskDescription.message;
    }
    const potentialImpact = checkStringValidation(
      "Potential impact",
      riskValues.potentialImpact,
      1,
      256
    );
    if (!potentialImpact.accepted) {
      newErrors.potentialImpact = potentialImpact.message;
    }

    if(riskValues.reviewNotes.length > 0){
      const reviewNotes = checkStringValidation(
        "Review notes",
        riskValues.reviewNotes,
        0,
        1024
      );
      if (!reviewNotes.accepted) {
        newErrors.reviewNotes = reviewNotes.message;
      }
    }
    
    const actionOwner = selectValidation(
      "Action owner",
      riskValues.actionOwner
    );
    if (!actionOwner.accepted) {
      newErrors.actionOwner = actionOwner.message;
    }
    const aiLifecyclePhase = selectValidation(
      "AI lifecycle phase",
      riskValues.aiLifecyclePhase
    );
    if (!aiLifecyclePhase.accepted) {
      newErrors.aiLifecyclePhase = aiLifecyclePhase.message;
    }
    const riskCategory = selectValidation(
      "Risk category",
      riskValues.riskCategory
    );
    if (!riskCategory.accepted) {
      newErrors.riskCategory = riskCategory.message;
    }

    const mitigationPlan = checkStringValidation(
      "Mitigation plan",
      mitigationValues.mitigationPlan,
      1,
      1024
    );
    if (!mitigationPlan.accepted) {
      newMitigationErrors.mitigationPlan = mitigationPlan.message;
    }
    const implementationStrategy = checkStringValidation(
      "Implementation strategy",
      mitigationValues.implementationStrategy,
      1,
      1024
    );
    if (!implementationStrategy.accepted) {
      newMitigationErrors.implementationStrategy =
        implementationStrategy.message;
    }
    const deadline = checkStringValidation(
      "Deadline",
      mitigationValues.deadline,
      1
    );
    if (!deadline.accepted) {
      newMitigationErrors.deadline = deadline.message;
    }
    const dateOfAssessment = checkStringValidation(
      "Date Of Assessment",
      mitigationValues.dateOfAssessment,
      1
    );
    if (!dateOfAssessment.accepted) {
      newMitigationErrors.dateOfAssessment = dateOfAssessment.message;
    }
    const mitigationStatus = selectValidation(
      "Mitigation status",
      mitigationValues.mitigationStatus
    );
    if (!mitigationStatus.accepted) {
      newMitigationErrors.mitigationStatus = mitigationStatus.message;
    }
    const currentRiskLevel = selectValidation(
      "Current risk level",
      mitigationValues.currentRiskLevel
    );
    if (!currentRiskLevel.accepted) {
      newMitigationErrors.currentRiskLevel = currentRiskLevel.message;
    }
    const approver = selectValidation("Approver", mitigationValues.approver);
    if (!approver.accepted) {
      newMitigationErrors.approver = approver.message;
    }
    const approvalStatus = selectValidation(
      "Approval status",
      mitigationValues.approvalStatus
    );
    if (!approvalStatus.accepted) {
      newMitigationErrors.approvalStatus = approvalStatus.message;
    }
    if(mitigationValues.recommendations.length > 0) {
      const recommendations = checkStringValidation(
        "Recommendation",
        mitigationValues.recommendations,
        1,
        1024
      );
      if (!recommendations.accepted) {
        newMitigationErrors.recommendations = recommendations.message;
      }
    }    

    setMigitateErrors(newMitigationErrors);
    setRiskErrors(newErrors);

    // return (
    //   Object.keys(newErrors).length === 0 &&
    //   Object.keys(newMitigationErrors).length === 0,
    // ); // Return true if no errors exist

    return {
      isValid:
        Object.keys(newErrors).length === 0 &&
        Object.keys(newMitigationErrors).length === 0,
      errors: newErrors,
      mitigationErrors: newMitigationErrors,
    };
  }, [riskValues, mitigationValues]);

  const riskFormSubmitHandler = async () => {
    const { isValid, errors } = validateForm();
    
    const risk_risklevel = getRiskLevel(
      riskValues.likelihood * riskValues.riskSeverity
    );
    const mitigation_risklevel = getRiskLevel(
      mitigationValues.likelihood * mitigationValues.riskSeverity
    );

    // check forms validate
    if (isValid) {
      onLoading(popupStatus !== "new" ? 
      "Updating the risk. Please wait..." : 
      "Creating the risk. Please wait...");

      const formData = {
        project_id: projectId,
        risk_name: riskValues.riskName,
        risk_owner: riskValues.actionOwner,
        ai_lifecycle_phase:
          aiLifecyclePhase.find(
            (item) => item._id === riskValues.aiLifecyclePhase
          )?.name || "",
        risk_description: riskValues.riskDescription,
        risk_category:
          riskCategoryItems.find((item) => item._id === riskValues.riskCategory)
            ?.name || "",
        impact: riskValues.potentialImpact,
        assessment_mapping: riskValues.assessmentMapping,
        controls_mapping: riskValues.controlsMapping,
        likelihood:
          likelihoodItems.find((item) => item._id === riskValues.likelihood)
            ?.name || "",
        severity:
          riskSeverityItems.find((item) => item._id === riskValues.riskSeverity)
            ?.name || "",
        risk_level_autocalculated: risk_risklevel.text,
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
          )?.name || "",
        final_risk_level: mitigation_risklevel.text,
        risk_approval: mitigationValues.approver,
        approval_status:
          approvalStatusItems.find(
            (item) => item._id === mitigationValues.approvalStatus
          )?.name || "",
        date_of_assessment: mitigationValues.dateOfAssessment,
      };

      try {
        const response = (popupStatus !== "new") ? 
        await apiServices.put(
          "/projectRisks/" + inputValues.id,
          formData) : 
        await apiServices.post("/projectRisks", formData);

        if (response.status === 201) {
          // risk create success
          closePopup();
          onSuccess();
        }else if (response.status === 200) {
          // risk update success
          closePopup();
          onSuccess();
        }else{
          console.error((response.data as ApiResponse)?.error);
          onError((response.data as ApiResponse)?.message);
        }
      } catch (error) {
        console.error("Error sending request", error);
        if(error){
          onError(error);
        }
      }
    } else {
      if (Object.keys(errors).length) {
        setValue("risks");
      } else {
        setValue("mitigation");
      }
    }
  };

  return (
    <Stack>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList
            onChange={handleChange}
            aria-label="Add new risk tabs"
            TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
            sx={{
              minHeight: "20px",
              "& .MuiTabs-flexContainer": { columnGap: "34px" },
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
          <TabPanel value="risks" sx={{ p: "24px 0 0" }}>
            <RiskSection
              riskValues={riskValues}
              setRiskValues={setRiskValues}
              riskErrors={riskErrors}
            />
          </TabPanel>
          <TabPanel value="mitigation" sx={{ p: "24px 0 0" }}>
            <MitigationSection
              mitigationValues={mitigationValues}
              setMitigationValues={setMitigationValues}
              migitateErrors={migitateErrors}
            />
          </TabPanel>
        </Suspense>
        <Box sx={{ display: "flex" }}>
          <VWButton
            sx={{
              alignSelf: "flex-end",
              width: "fit-content",
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              gap: 2,
              borderRadius: 2,
              maxHeight: 34,
              textTransform: "inherit",
              boxShadow: "none",
              ml: "auto",
              mr: 0,
              mt: "30px",
              "&:hover": { boxShadow: "none" },
            }}
            icon={popupStatus === "new" ? <SaveIcon /> : <UpdateIcon />}
            variant="contained"
            onClick={riskFormSubmitHandler}
            text={popupStatus === "new" ? "Save" : "Update"}
          />
        </Box>
      </TabContext>
    </Stack>
  );
};

export default AddNewRiskForm;

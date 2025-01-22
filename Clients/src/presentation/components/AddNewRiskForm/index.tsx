import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Box, Stack, Tab, useTheme, Typography, Button } from "@mui/material";
import { FC, useState, useCallback, useMemo, lazy, Suspense } from "react";
import "./styles.module.css";
import { Likelihood, Severity } from "../RiskLevel/constants";
import { RiskFormValues, RiskFormErrors, MitigationFormValues, MitigationFormErrors } from "./interface";

import { checkStringValidation } from "../../../application/validations/stringValidation";
import selectValidation from "../../../application/validations/selectValidation";

const RiskSection = lazy(() => import("./RisksSection"));
const MitigationSection = lazy(() => import("./MitigationSection"));

interface AddNewRiskFormProps {
  closePopup: () => void;
  popupStatus: string;
}

const riskInitialState: RiskFormValues = {
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

const mitigationInitialState: MitigationFormValues = {
  mitigationStatus: 0,
  mitigationPlan: "",
  currentRiskLevel: 0,
  implementationStrategy: "",
  deadline: "",
  doc: "",
  likelihood: 1 as Likelihood,
  riskSeverity: 1 as Severity,
  approver: 0,
  approvalStatus: 0,
  dateOfAssessment: "",
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
  popupStatus,
}) => {
  const theme = useTheme();
  const disableRipple =
    theme.components?.MuiButton?.defaultProps?.disableRipple;
  
  const [riskErrors, setRiskErrors] = useState<RiskFormErrors>({});
  const [migitateErrors, setMigitateErrors] = useState<MitigationFormErrors>({});
  const [riskValues, setRiskValues] = useState<RiskFormValues>(riskInitialState);
  const [mitigationValues, setMitigationValues] = useState<MitigationFormValues>(mitigationInitialState);
  const [value, setValue] = useState("risks");
  const handleChange = useCallback(
    (_: React.SyntheticEvent, newValue: string) => {
      setValue(newValue);
    },
    []
  );

  const tabStyle = useMemo(
    () => ({
      textTransform: "none",
      fontWeight: 400,
      alignItems: "flex-start",
      justifyContent: "flex-end",
      padding: "16px 0 7px",
      minHeight: "20px",
    }),
    []
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: RiskFormErrors = {};
    const newMitigationErrors: MitigationFormErrors = {};

    const riskName = checkStringValidation("Risk name", riskValues.riskName, 3, 50);
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
    const reviewNotes = checkStringValidation(
      "Review notes",
      riskValues.reviewNotes,
      0,
      1024
    );
    if (!reviewNotes.accepted) {
      newErrors.reviewNotes = reviewNotes.message;
    }
    const actionOwner = selectValidation("Action owner", riskValues.actionOwner);
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
    const riskCategory = selectValidation("Risk category", riskValues.riskCategory);
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
      newMitigationErrors.implementationStrategy = implementationStrategy.message;
    }
    // const recommendations = checkStringValidation(
    //   "Recommendations",
    //   mitigationValues.recommendations,
    //   1,
    //   1024
    // );
    // if (!recommendations.accepted) {
    //   newMitigationErrors.recommendations = recommendations.message;
    // }
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

    setMigitateErrors(newMitigationErrors);
    setRiskErrors(newErrors);

    return Object.keys(newErrors).length === 0 && Object.keys(newMitigationErrors).length === 0;  // Return true if no errors exist    
  }, [riskValues, mitigationValues]);

  const riskFormSubmitHandler = () => {
    // check forms validate    
    if(validateForm()){
      // call backend 
      closePopup();
    }else{
      console.log('validation fails')
    }
  }

  return (
    <Stack>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList
            onChange={handleChange}
            aria-label="Add new risk tabs"
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
            <RiskSection riskValues={riskValues} setRiskValues={setRiskValues} riskErrors={riskErrors}/>
          </TabPanel>
          <TabPanel value="mitigation" sx={{ p: "24px 0 0" }}>
            <MitigationSection mitigationValues={mitigationValues} setMitigationValues={setMitigationValues} migitateErrors={migitateErrors} />
          </TabPanel>
        </Suspense>
        <Box sx={{ display: 'flex'}}>
          <Button
            type="submit" 
            onClick={riskFormSubmitHandler}           
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
            {popupStatus === "new" ? (
              <Typography>Save</Typography>
            ) : (
              <Typography>Update</Typography>
            )}
          </Button>
        </Box>
      </TabContext>
    </Stack>
  );
};

export default AddNewRiskForm;

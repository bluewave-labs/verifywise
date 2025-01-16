import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Box, Stack, Tab, useTheme } from "@mui/material";
import { FC, useState, useCallback, useMemo, lazy, Suspense } from "react";
import "./styles.css";
import { Likelihood, Severity } from "../RiskLevel/constants";
import { RiskFormValues, MitigationFormValues } from "./interface";

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
            <RiskSection closePopup={closePopup} status={popupStatus} riskValues={riskValues} setRiskValues={setRiskValues} />
          </TabPanel>
          <TabPanel value="mitigation" sx={{ p: "24px 0 0" }}>
            <MitigationSection closePopup={closePopup} mitigationValues={mitigationValues} setMitigationValues={setMitigationValues} />
          </TabPanel>
        </Suspense>
      </TabContext>
    </Stack>
  );
};

export default AddNewRiskForm;

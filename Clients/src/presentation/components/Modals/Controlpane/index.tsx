import {
  Button,
  Modal,
  Stack,
  Typography,
  useTheme,
  Divider,
  Box,
  Tabs,
  Tab,
} from "@mui/material";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import dayjs from "dayjs";
import React, { useState } from "react";
import DropDowns from "../../Inputs/Dropdowns";
import AuditorFeedback from "../ComplianceFeedback/ComplianceFeedback";
import { useComplianceContext } from "../../../../provider/ComplianceContext";

interface CustomModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
}

const CustomModal: React.FC<CustomModalProps> = ({ isOpen, setIsOpen, title }) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<string>("Overview");
  const { status, approver, owner, reviewer, riskReview, date } = useComplianceContext();
  const [dropdown1Value, setDropdown1Value] = useState<string | number>("");
  const [dropdown2Value, setDropdown2Value] = useState<string | number>("");

  const handleSave = () => {
    console.log("Status:", status);
    console.log("Approver:", approver);
    console.log("Risk Review:", riskReview);
    console.log("Owner:", owner);
    console.log("Reviewer:", reviewer);
    console.log("Due Date (raw):", date);

    const selectedValues = {
      status,
      approver,
      riskReview,
      owner,
      reviewer,
      dueDate: date ? dayjs(date).format("MM/DD/YYYY") : "No Date Selected",
    };

    console.log("Selected values on Save:", selectedValues);
  };

  const extractNumberFromTitle = (title: string) => {
    const match = title.match(/\d+/);
    return match ? match[0] : "0";
  };

  const titleNumber = extractNumberFromTitle(title);

  const handleClose = () => setIsOpen(false);

  const handleSelectedTab = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const buttonTabStyles = {
    backgroundColor: "#EAECF0",
    color: "Black",
    borderColor: "#EAECF0",
    borderTop: 0,
    borderBottom: 0,
    borderRadius: 0,
    fontWeight: 500,
    boxShadow: "none",
    textTransform: "none",
    "&:hover": {
      boxShadow: "none",
    },
  };

  const buttonStyle = {
    fontSize: 13,
    textTransform: "capitalize",
    backgroundColor: "#4C7DE7",
    boxShadow: "none",
    borderRadius: "4px",
    border: "1px solid #175CD3",
    "&:hover": {
      boxShadow: "none",
    },
  };

  const getVariant = (activeSection: string, section: string) => {
    return activeSection === section ? "contained" : "outlined";
  };

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <Stack
        gap={theme.spacing(4)}
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          bgcolor: theme.palette.background.alt,
          borderRadius: theme.shape.borderRadius,
          boxShadow: 24,
          paddingY: theme.spacing(15),
          paddingX: theme.spacing(20),
          "&:focus": {
            outline: "none",
          },
        }}
      >
        <Stack
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography fontSize={16} fontWeight={600} sx={{ textAlign: "left" }}>
            {title}
          </Typography>

          <CloseIcon onClick={handleClose} style={{ cursor: "pointer" }} />
        </Stack>
        <Typography fontSize={13}>
          To ensure that the risk management system is a continuous iterative
          process that is planned, run, and regularly reviewed and updated
          throughout the entire lifecycle of the high-risk AI system.
        </Typography>

        <Typography>First Dropdown</Typography>
        <DropDowns value={dropdown1Value} onChange={setDropdown1Value} />

        <Divider sx={{ borderColor: "#C2C2C2", mt: theme.spacing(3) }} />

        <Box sx={{ width: "100%", bgcolor: "background.paper" }}>
          <Tabs
            value={selectedTab}
            onChange={handleSelectedTab}
            indicatorColor="primary"
            textColor="primary"
            sx={{ justifyContent: "flex-start" }}
          >
            <Tab label="Subcontrol 1" sx={{ textTransform: "none" }} disableRipple />
            <Tab label="Subcontrol 2" sx={{ textTransform: "none" }} disableRipple />
            <Tab label="Subcontrol 3" sx={{ textTransform: "none" }} disableRipple />
            <Tab label="Subcontrol 4" sx={{ textTransform: "none" }} disableRipple />
          </Tabs>
        </Box>

        <Stack
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-start",
            borderRadius: "4px",
            border: "1px solid #EAECF0",
            width: "fit-content",
          }}
        >
          {["Overview", "Evidence", "Auditor Feedback"].map((section) => (
            <Button
              key={section}
              variant={getVariant(activeSection, section)}
              onClick={() => handleSectionChange(section)}
              disableRipple
              sx={{
                ...buttonTabStyles,
                backgroundColor: activeSection === section ? "#EAECF0" : "transparent",
                fontWeight: activeSection === section ? 500 : 300,
              }}
            >
              {section}
            </Button>
          ))}
        </Stack>

        <Box>
          <Typography fontSize={16} fontWeight={600} sx={{ textAlign: "left", mb: 3 }}>
            Subcontrol {titleNumber}.{selectedTab + 1}
          </Typography>
          <Typography variant="body1" sx={{ mb: 5 }}>
            Plan and execute the risk management process as a continuous iterative cycle.
            (EU AI ACT Ref: Subcontrol {titleNumber}.{selectedTab + 1})
          </Typography>
          {activeSection === "Overview" && <DropDowns value={dropdown2Value} onChange={setDropdown2Value} />}
          {["Evidence", "Auditor Feedback"].includes(activeSection) && (
            <AuditorFeedback activeSection={activeSection} />
          )}
        </Box>

        <Stack
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            mt: 2,
          }}
        >
          <Stack gap={theme.spacing(4)} sx={{ display: "flex", flexDirection: "row" }}>
            <Button variant="contained" onClick={() => console.log("Previous Subcontrol clicked")} sx={buttonStyle} disableRipple>
              &lt;- Previous Subcontrol
            </Button>
            <Button variant="contained" onClick={() => console.log("Next Subcontrol clicked")} sx={buttonStyle} disableRipple>
              Next Subcontrol -&gt;
            </Button>
          </Stack>
          <Button variant="contained" onClick={handleSave} sx={{ ...buttonStyle, width: 68 }} disableRipple>
            Save
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
};

export default CustomModal;

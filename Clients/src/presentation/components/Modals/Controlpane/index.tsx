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

import React, { useState } from "react";
import DropDowns from "../../Inputs/Dropdowns";
import AuditorFeedback from "../ComplianceFeedback/ComplianceFeedback";

interface CustomModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  content: string;
  onConfirm: () => void;
}

const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  setIsOpen,
  title,
}) => {
  const theme = useTheme();
  // State for the date input
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<string>("Overview");

  const handleClose = () => setIsOpen(false);

  const handleSelectedTab = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const buttonTabStyles = {
    backgroundColor: "#EAECF0",
    color: "Black",
    borderColor: "#EAECF0",
    fontWeight: 500,
    boxShadow: "none",
    textTransform: "none",
  };

  const buttonStyle = {
    marginRight: 1,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: "#4C7DE7",
    width: 173,
    height: 34,
    fontSize: 13,
    fontWeight: 400,
    textTransform: "none",
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
          width: { xs: 300, md: 600, lg: 900 },
          height: 900,
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: theme.shape.borderRadius,
          boxShadow: 24,
          p: theme.spacing(20),
          "&:focus": {
            outline: "none",
          },
        }}
      >
        <Typography fontSize={16} fontWeight={600} sx={{ textAlign: "left" }}>
          {title}
        </Typography>
        <Typography fontSize={13}>
          To ensure that the risk management system is a continuous iterative
          process that is planned, run, and regularly reviewed and updated
          throughout the entire lifecycle of the high-risk AI system.
        </Typography>
        <DropDowns />
        <Divider sx={{ borderColor: "#C2C2C2", mt: 3 }} />

        <Box sx={{ width: "100%", bgcolor: "background.paper" }}>
          <Tabs
            value={selectedTab}
            onChange={handleSelectedTab}
            indicatorColor="primary"
            textColor="primary"
            sx={{ justifyContent: "flex-start" }}
          >
            <Tab label="Subcontrol 1" sx={{ textTransform: "none" }} />
            <Tab label="Subcontrol 2" sx={{ textTransform: "none" }} />
            <Tab label="Subcontrol 3" sx={{ textTransform: "none" }} />
            <Tab label="Subcontrol 4" sx={{ textTransform: "none" }} />
          </Tabs>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 2 }}>
          <Button
            variant={getVariant(activeSection, "Overview")}
            onClick={() => handleSectionChange("Overview")}
            sx={{
              ...buttonTabStyles,
              backgroundColor:
                activeSection === "Overview" ? "#EAECF0" : "transparent",
              fontWeight: activeSection === "Overview" ? "500" : 300,
            }}
          >
            Overview
          </Button>
          <Button
            variant={getVariant(activeSection, "Evidence")}
            onClick={() => handleSectionChange("Evidence")}
            sx={{
              ...buttonTabStyles,
              backgroundColor:
                activeSection === "Evidence" ? "#EAECF0" : "transparent",
              fontWeight: activeSection === "Evidence" ? "500" : 300,
            }}
          >
            Evidence
          </Button>
          <Button
            variant={getVariant(activeSection, "Auditor Feedback")}
            onClick={() => handleSectionChange("Auditor Feedback")}
            sx={{
              ...buttonTabStyles,
              backgroundColor:
                activeSection === "Auditor Feedback"
                  ? "#EAECF0"
                  : "transparent",
              fontWeight: activeSection === "Auditor Feedback" ? "500" : 300,
            }}
          >
            Auditor Feedback
          </Button>
        </Box>

        {/* Dynamic Content Based on Active Section */}
        <Box sx={{ mt: 2 }}>
          <Typography
            fontSize={16}
            fontWeight={600}
            sx={{ textAlign: "left", mb: 3 }}
          >
            Subcontrol 19.1
          </Typography>
          <Typography variant="body1" sx={{ mb: 5 }}>
            Plan and execute the risk management process as a continuous
            iterative cycle. (EU AI ACT Ref: Subcontrol 19.1)
          </Typography>
          {activeSection === "Overview" && (
            <Typography variant="body1">
              <DropDowns />
            </Typography>
          )}
          {["Evidence", "Auditor Feedback"].includes(activeSection) && (
            <AuditorFeedback activeSection={activeSection} />
          )}
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 8 }}>
          <Box>
            <Button
              variant="contained"
              onClick={() => console.log("Previous Subcontrol clicked")}
              sx={buttonStyle}
            >
              &lt;- Previous Subcontrol
            </Button>
            <Button
              variant="contained"
              onClick={() => console.log("Next Subcontrol clicked")}
              sx={buttonStyle}
            >
              Next Subcontrol -&gt;
            </Button>
          </Box>
          <Button
            variant="contained"
            onClick={() => console.log("Save clicked")}
            sx={{
              ...buttonStyle,
              width: 68,
            }}
          >
            Save
          </Button>
        </Box>
      </Stack>
    </Modal>
  );
};

export default CustomModal;

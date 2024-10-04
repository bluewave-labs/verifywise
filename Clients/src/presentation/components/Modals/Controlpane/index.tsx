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
  IconButton,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

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
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<string>("Overview");

  const extractNumberFromTitle = (title: string) => {
    const match = title.match(/\d+/);
    return match ? match[0] : "0"; 
  };

  const titleNumber = extractNumberFromTitle(title);

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
          width: { xs: 300, md: 600, lg: 816 },
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
        <IconButton
          onClick={handleClose}
          sx={{
            position: "absolute",
            top: theme.spacing(2),
            right: theme.spacing(2),
          }}
          disableRipple
        >
          <CloseIcon  />
        </IconButton>

        <Typography fontSize={16} fontWeight={600} sx={{ textAlign: "left" }}>
          {title}
        </Typography>
        <Typography fontSize={13}>
          To ensure that the risk management system is a continuous iterative
          process that is planned, run, and regularly reviewed and updated
          throughout the entire lifecycle of the high-risk AI system.
        </Typography>
        <DropDowns />
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

        <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 2 }}>
          <Button
            variant={getVariant(activeSection, "Overview")}
            onClick={() => handleSectionChange("Overview")}
            disableRipple
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
            disableRipple
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
            disableRipple
            sx={{
              ...buttonTabStyles,
              backgroundColor:
                activeSection === "Auditor Feedback"
                  ? "#EAECF0"
                  : "transparent",
              fontWeight: activeSection === "Auditor Feedback" ? "500" : 300,
            }}
          >
            Auditor feedback
          </Button>
        </Box>

        {/* Dynamic Content Based on Active Section */}
        <Box sx={{ mt: 2 }}>
          <Typography
            fontSize={16}
            fontWeight={600}
            sx={{ textAlign: "left", mb: 3 }}
          >
            Subcontrol {titleNumber}.{selectedTab + 1}
          </Typography>
          <Typography variant="body1" sx={{ mb: 5 }}>
            Plan and execute the risk management process as a continuous
            iterative cycle. (EU AI ACT Ref: Subcontrol {titleNumber}.{selectedTab + 1})
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
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Stack
            gap={theme.spacing(4)}
            sx={{ display: "flex", flexDirection: "row" }}
          >
            <Button
              variant="contained"
              onClick={() => console.log("Previous Subcontrol clicked")}
              sx={buttonStyle}
              disableRipple
            >
              &lt;- Previous Subcontrol
            </Button>
            <Button
              variant="contained"
              onClick={() => console.log("Next Subcontrol clicked")}
              sx={buttonStyle}
              disableRipple
            >
              Next Subcontrol -&gt;
            </Button>
          </Stack>
          <Button
            variant="contained"
            onClick={() => console.log("Save clicked")}
            sx={{
              ...buttonStyle,
              width: 68,
            }}
            disableRipple
          >
            Save
          </Button>
        </Box>
      </Stack>
    </Modal>
  );
};

export default CustomModal;
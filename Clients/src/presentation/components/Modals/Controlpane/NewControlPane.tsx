import {
  Box,
  Button,
  Divider,
  Modal,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import DropDowns from "../../Inputs/Dropdowns";
import { useState } from "react";
import AuditorFeedback from "../ComplianceFeedback/ComplianceFeedback";

const NewControlPane = ({
  id,
  isOpen,
  handleClose,
  title,
  content,
  subControls,
  OnSave,
}: {
  id: string;
  isOpen: boolean;
  handleClose: () => void;
  title: string;
  content: string;
  subControls: any[];
  OnSave?: () => void;
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<string>("Overview");
  const [values, setValues] = useState({
    controlVale: {
      
    },
    subControlValues: {
      
    },
  });
  const handleSelectedTab = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const getVariant = (activeSection: string, section: string) => {
    return activeSection === section ? "contained" : "outlined";
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
      backgroundColor: "#175CD3 ",
    },
  };

  return (
    <Modal
      id={`${id}-modal`}
      open={isOpen}
      onClose={handleClose}
      className="new-control-pane-modal"
    >
      <Stack
        className="new-control-pane-modal-frame"
        sx={{
          gap: theme.spacing(4),
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
          maxHeight: "90vh",
          overflowY: "auto",
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
            {id} {title}
          </Typography>
          <CloseIcon onClick={handleClose} style={{ cursor: "pointer" }} />
        </Stack>
        <Typography fontSize={13}>{content}</Typography>
        <DropDowns />
        <Divider sx={{ borderColor: "#C2C2C2", mt: theme.spacing(3) }} />
        <Box sx={{ width: "100%", bgcolor: "#FCFCFD" }}>
          <Tabs
            value={selectedTab}
            onChange={handleSelectedTab}
            indicatorColor="primary"
            textColor="primary"
            sx={{ justifyContent: "flex-start" }}
          >
            {subControls.map((subControl) => (
              <Tab
                id={`${id}.${subControl.id}`}
                key={subControl.id}
                label={`Subcontrol ${subControl.id}`}
                disableRipple
                sx={{ textTransform: "none" }}
              />
            ))}
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
          {["Overview", "Evidence", "Auditor Feedback"].map(
            (section, index) => (
              <Button
                key={index}
                variant={getVariant(activeSection, section)}
                onClick={() => handleSectionChange(section)}
                disableRipple
                sx={{
                  ...buttonTabStyles,
                  backgroundColor:
                    activeSection === section ? "#EAECF0" : "transparent",
                  fontWeight: activeSection === section ? "500" : 300,
                }}
              >
                {section}
              </Button>
            )
          )}
        </Stack>
        <Box>
          <Typography
            fontSize={16}
            fontWeight={600}
            sx={{ textAlign: "left", mb: 3 }}
          >
            {`${id}.${subControls[selectedTab].id}`}{" "}
            {subControls[selectedTab].title}
          </Typography>
          <Typography sx={{ mb: 5 }}>
            {subControls[selectedTab].description}
          </Typography>
          {activeSection === "Overview" && (
            <Typography>
              <DropDowns />
            </Typography>
          )}
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
            onClick={OnSave}
            sx={{
              ...buttonStyle,
              width: 68,
              "&:hover": {
                backgroundColor: "#175CD3 ",
              },
            }}
            disableRipple
          >
            Save
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
};

export default NewControlPane;

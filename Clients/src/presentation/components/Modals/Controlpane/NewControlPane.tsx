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
import { Dayjs } from "dayjs";
import { apiServices } from "../../../../infrastructure/api/networkServices";

interface SubControlState {
  controlId: string;
  subControlId: string;
  subControlTitle: string;
  subControlDescription: string;
  status: string | number;
  approver: string | number;
  riskReview: string | number;
  owner: string | number;
  reviewer: string | number;
  description: string;
  date: Dayjs | null;
  evidence: string;
  feedback: string;
}

interface State {
  controlId: string;
  controlTitle: string;
  controlDescription: string;
  status: string | number;
  approver: string | number;
  riskReview: string | number;
  owner: string | number;
  reviewer: string | number;
  description: string;
  date: Dayjs | null;
  subControls: SubControlState[];
}

const NewControlPane = ({
  id,
  numbering,
  isOpen,
  handleClose,
  title,
  content,
  subControls,
  controlCategory,
  OnSave,
}: {
  id: string;
  numbering: string;
  isOpen: boolean;
  handleClose: () => void;
  title: string;
  content: string;
  subControls: any[];
  controlCategory: string;
  OnSave?: (state: State) => void;
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<string>("Overview");

  const initialSubControlState = subControls.map((subControl) => ({
    controlId: id,
    subControlId: subControl.id,
    subControlTitle: subControl.title,
    subControlDescription: subControl.description,
    status: "Choose status", // Set default value
    approver: "Choose approver", // Set default value
    riskReview: "Acceptable risk", // Set default value
    owner: "Choose owner", // Set default value
    reviewer: "Choose reviewer", // Set default value
    description: "",
    date: null,
    evidence: "",
    feedback: "",
  }));

  const [state, setState] = useState<State>({
    controlId: id,
    controlTitle: title,
    controlDescription: content,
    status: "Choose status", // Set default value
    approver: "Choose approver", // Set default value
    riskReview: "Acceptable risk", // Set default value
    owner: "Choose owner", // Set default value
    reviewer: "Choose reviewer", // Set default value
    description: "",
    date: null,
    subControls: initialSubControlState,
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

  const handleSubControlStateChange = (
    index: number,
    newState: Partial<SubControlState>
  ) => {
    setState((prevState) => {
      const updatedSubControls = [...prevState.subControls];
      updatedSubControls[index] = { ...updatedSubControls[index], ...newState };
      return { ...prevState, subControls: updatedSubControls };
    });
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

  const handleSave = async () => {
    const controlToSave = {
      controlCategoryTitle: controlCategory,
      control: state,
    };
    console.log(controlToSave);

    try {
      const response = await apiServices.post(
        "/projects/saveControls",
        controlToSave
      );
      console.log("Controls saved successfully:", response);
    } catch (error) {
      console.error("Error saving controls:", error);
    }
    if (OnSave) {
      OnSave(state);
    }
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
            {numbering} {title}
          </Typography>
          <CloseIcon onClick={handleClose} style={{ cursor: "pointer" }} />
        </Stack>
        <Typography fontSize={13}>{content}</Typography>
        <DropDowns
          elementId={`control-${id}`}
          state={state}
          setState={(newState) => setState({ ...state, ...newState })}
        />{" "}
        {/* this is working fine */}
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
            {`${numbering}.${subControls[selectedTab].id}`}{" "}
            {subControls[selectedTab].title}
          </Typography>
          <Typography sx={{ mb: 5 }}>
            {subControls[selectedTab].description}
          </Typography>
          {activeSection === "Overview" && (
            <Typography>
              <DropDowns
                elementId={`sub-control-${id}.${subControls[selectedTab].subControlId}`}
                state={state.subControls[selectedTab]}
                setState={(newState) =>
                  handleSubControlStateChange(selectedTab, newState)
                }
              />
            </Typography>
          )}
          {activeSection === "Evidence" && (
            <AuditorFeedback
              activeSection={activeSection}
              feedback={state.subControls[selectedTab].evidence}
              onChange={(e) => {
                const updatedSubControls = [...state.subControls];
                updatedSubControls[selectedTab].evidence = e.target.value;
                setState({ ...state, subControls: updatedSubControls });
              }}
            />
          )}
          {activeSection === "Auditor Feedback" && (
            <AuditorFeedback
              activeSection={activeSection}
              feedback={state.subControls[selectedTab].feedback}
              onChange={(e) => {
                const updatedSubControls = [...state.subControls];
                updatedSubControls[selectedTab].feedback = e.target.value;
                setState({ ...state, subControls: updatedSubControls });
              }}
            />
          )}
        </Box>
        <Stack
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            mt: 2,
          }}
        >
          <Button
            variant="contained"
            onClick={handleSave}
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

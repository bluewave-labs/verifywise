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
import { createNewUser } from "../../../../application/repository/entity.repository";
import DualButtonModal from "../../../vw-v2-components/Dialogs/DualButtonModal";
import { Subcontrol } from "../../../../domain/Subcontrol";
import { Control } from "../../../../domain/Control";

const NewControlPane = ({
  data,
  isOpen,
  handleClose,
  controlCategoryId,
  OnSave,
}: {
  data: Control;
  isOpen: boolean;
  handleClose: () => void;
  controlCategoryId: string;
  OnSave?: (state: Control) => void;
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<string>("Overview");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const initialSubControlState = data.subControls!.map(
    (subControl: Subcontrol, index: number) => ({
      control_id: subControl.control_id,
      id: subControl.id,
      order_no: index,
      title: subControl.title,
      description: subControl.description,
      status: subControl.status,
      approver: subControl.approver,
      risk_review: subControl.risk_review,
      owner: subControl.owner,
      reviewer: subControl.reviewer,
      implementation_details: subControl.implementation_details,
      due_date: subControl.due_date,
      evidence_description: subControl.evidence_description,
      feedback_description: subControl.feedback_description,
      evidence_files: subControl.evidence_files,
      feedback_files: subControl.feedback_files,
    })
  );

  const [state, setState] = useState<Control>(() => ({
    id: data.id,
    title: data.title,
    description: data.description,
    status: data.status,
    approver: data.approver,
    risk_review: data.risk_review,
    owner: data.owner,
    reviewer: data.reviewer,
    implementation_details: data.implementation_details,
    due_date: data.due_date,
    control_category_id: data.control_category_id, // Added missing property

    subControls: initialSubControlState,
  }));

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
    newState: Partial<Subcontrol>
  ) => {
    setState((prevState) => {
      const updatedSubControls = [...prevState.subControls!];
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

  const handleSave = () => {
    setIsModalOpen(true);
  };

  const confirmSave = async () => {
    const controlToSave = {
      state,
    };
    console.log("controlToSave : ", controlToSave);
    // try {
    //   const response = await apiServices.post(
    //     "/controls/saveControls",
    //     controlToSave
    //   );
    //   console.log("Controls saved successfully:", response);
    // } catch (error) {
    //   console.error("Error saving controls:", error);
    // }
    if (OnSave) {
      OnSave(state);
    }
    setIsModalOpen(false);
  };

  return (
    <Modal
      id={`${data.id}-modal`}
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
            {`${controlCategoryId + "." + data.order_no}`} {data.title}
          </Typography>
          <CloseIcon onClick={handleClose} style={{ cursor: "pointer" }} />
        </Stack>
        <Typography fontSize={13}>{data.description}</Typography>
        <DropDowns
          isControl={true}
          elementId={`control-${data.id}`}
          state={state} // Fallback to `data` if `initialValues` isn't set yet
          setState={(newState) =>
            setState((prevState) => ({
              ...prevState,
              ...newState,
            }))
          }
        />

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
            {data.subControls!.map((subControl) => (
              <Tab
                id={`${data.id}.${subControl.id}`}
                key={subControl.id}
                label={`Subcontrol ${subControl.order_no}`}
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
            {`${controlCategoryId}.${data.order_no}.${
              data.subControls![selectedTab].order_no
            }`}{" "}
            {data.subControls![selectedTab].title}
          </Typography>
          <Typography sx={{ mb: 5, fontSize: 13 }}>
            {data.subControls![selectedTab].description}
          </Typography>
          {activeSection === "Overview" && (
            <Typography fontSize={13}>
              <DropDowns
                isControl={false}
                elementId={`sub-control-${data.order_no}.${
                  data.subControls![selectedTab].id
                }`}
                state={state?.subControls?.[selectedTab]}
                setState={(newState) =>
                  handleSubControlStateChange(selectedTab, newState)
                }
              />
            </Typography>
          )}
          {activeSection === "Evidence" && (
            <AuditorFeedback
              activeSection={activeSection}
              feedback={state.subControls![selectedTab].evidence_description}
              onChange={(e) => {
                const updatedSubControls = [...state.subControls!];
                updatedSubControls[selectedTab].evidence_description =
                  e.target.value;
                setState({ ...state, subControls: updatedSubControls });
              }}
            />
          )}
          {activeSection === "Auditor Feedback" && (
            <AuditorFeedback
              activeSection={activeSection}
              feedback={state.subControls![selectedTab].feedback_description}
              onChange={(e) => {
                const updatedSubControls = [...state.subControls!];
                updatedSubControls[selectedTab].feedback_description =
                  e.target.value;
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
        {isModalOpen && (
          <DualButtonModal
            title="Confirm Save"
            body={
              <Typography>
                Are you sure you want to save the changes?
              </Typography>
            }
            cancelText="Cancel"
            proceedText="Save"
            onCancel={() => setIsModalOpen(false)}
            onProceed={confirmSave}
            proceedButtonColor="primary"
            proceedButtonVariant="contained"
          />
        )}
      </Stack>
    </Modal>
  );
};

export default NewControlPane;

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
import { updateEntityById } from "../../../../application/repository/entity.repository";
import DualButtonModal from "../../../vw-v2-components/Dialogs/DualButtonModal";
import { Subcontrol } from "../../../../domain/Subcontrol";
import { Control } from "../../../../domain/Control";
import Alert from "../../Alert";
import VWToast from "../../../vw-v2-components/Toast";
import SaveIcon from "@mui/icons-material/Save";
import VWButton from "../../../vw-v2-components/Buttons";

const tabStyle = {
  textTransform: "none",
  fontWeight: 400,
  alignItems: "flex-start",
  justifyContent: "flex-end",
  padding: "16px 0 7px",
  minHeight: "20px",
  "&.Mui-selected": {
    color: "#13715B",
  },
};

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
  controlCategoryId?: string;
  OnSave?: (state: Control) => void;
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<string>("Overview");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sanitizeField = (value: string | undefined | null): string => {
    if (!value || value === "undefined") {
      return "";
    }
    return value;
  };

  const initialSubControlState = data
    .subControls!.slice()
    .sort((a, b) => a.order_no! - b.order_no!)
    .map((subControl: Subcontrol) => ({
      control_id: subControl.control_id,
      id: subControl.id,
      order_no: subControl.order_no,
      title: subControl.title,
      description: subControl.description,
      status: subControl.status,
      approver: subControl.approver,
      risk_review: subControl.risk_review,
      owner: subControl.owner,
      reviewer: subControl.reviewer,
      implementation_details: subControl.implementation_details,
      due_date: subControl.due_date,
      evidence_description: sanitizeField(subControl.evidence_description),
      feedback_description: sanitizeField(subControl.feedback_description),
      evidence_files: subControl.evidence_files,
      feedback_files: subControl.feedback_files,
    }));

  const [state, setState] = useState<Control>(() => ({
    order_no: data.order_no,
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
      const updatedSubControls = prevState.subControls!.map((sc, i) =>
        i === index ? { ...sc, ...newState } : { ...sc }
      );
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

  const handleSave = () => {
    setIsModalOpen(true);
  };

  const confirmSave = async () => {
    console.log("state controlToSave : ", state);
    setIsSubmitting(true);
    try {
      const response = await updateEntityById({
        routeUrl: `/controls/saveControls/${state.id}`,
        body: state,
      });
      console.log("Controls updated successfully:", response);
      setAlert({ type: "success", message: "Controls updated successfully" });
      if (OnSave) {
        OnSave(state);
      }
      setTimeout(() => {
        setAlert(null);
        handleClose();
        setIsSubmitting(false);
      }, 3000);
    } catch (error) {
      console.error("Error updating controls:", error);
      setAlert({ type: "error", message: "Error updating controls" });
      setIsSubmitting(false);
    }
    setIsModalOpen(false);
  };

  const handleCloseWrapper = () => {
    handleClose();
  };

  return (
    <>
      {alert && (
        <Box
          sx={{
            position: "fixed",
            top: theme.spacing(2),
            right: theme.spacing(2),
            zIndex: 1400,
          }}
        >
          <Alert
            variant={alert.type}
            body={alert.message}
            isToast={true}
            onClick={() => setAlert(null)}
          />
        </Box>
      )}

      {isSubmitting && (
        <Stack
          sx={{
            width: "100%",
            height: "100%",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            zIndex: 9999,
          }}
        >
          <VWToast title="Saving control. Please wait..." />
        </Stack>
      )}

      {isModalOpen && (
        <DualButtonModal
          title="Confirm Save"
          body={
            <Typography textTransform={"none"}>
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
      <Modal
        id={`${data.id}-modal`}
        open={isOpen}
        onClose={handleCloseWrapper}
        className="new-control-pane-modal"
        sx={{ zIndex: 1100 }}
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
            <Typography
              fontSize={16}
              fontWeight={600}
              sx={{ textAlign: "left" }}
            >
              {`${controlCategoryId + "." + data.order_no}`} {data.title}
            </Typography>
            <Box
              component="div"
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleCloseWrapper();
              }}
              sx={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                padding: "8px",
                "&:hover": {
                  opacity: 0.8,
                },
              }}
            >
              <CloseIcon />
            </Box>
          </Stack>
          <Typography fontSize={13}>{data.description}</Typography>
          <DropDowns
            key={`control-${data.id}`}
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
              TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
              sx={{
                minHeight: "20px",
                "& .MuiTabs-flexContainer": { columnGap: "34px" },
              }}
            >
              {state.subControls!.map((subControl, index) => (
                <Tab
                  id={`${data.id}.${subControl.id}`}
                  key={subControl.id}
                  label={`Subcontrol ${index + 1}`}
                  disableRipple
                  sx={tabStyle}
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
                  key={`sub-control-${data.order_no}.${
                    state.subControls![selectedTab].id
                  }.${index}`}
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
                state.subControls![selectedTab].order_no
              }`}{" "}
              {state.subControls![selectedTab].title}
            </Typography>
            <Typography sx={{ mb: 5, fontSize: 13 }}>
              {state.subControls![selectedTab].description}
            </Typography>
            {activeSection === "Overview" && (
              <Typography fontSize={13}>
                <DropDowns
                  key={`sub-control-${data.order_no}.${
                    state.subControls![selectedTab].id
                  }`}
                  isControl={false}
                  elementId={`sub-control-${data.order_no}.${
                    state.subControls![selectedTab].id
                  }`}
                  state={state.subControls![selectedTab]}
                  setState={(newState) =>
                    handleSubControlStateChange(selectedTab, newState)
                  }
                />
              </Typography>
            )}
            {activeSection === "Evidence" && (
              <AuditorFeedback
                key={`sub-control-${data.order_no}.${
                  state.subControls![selectedTab].id
                }.evidence`}
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
                key={`sub-control-${data.order_no}.${
                  state.subControls![selectedTab].id
                }.auditor-feedback`}
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
            <VWButton
              variant="contained"
              text="Save"
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 2,
              }}
              onClick={handleSave}
              icon={<SaveIcon />}
            />
          </Stack>
        </Stack>
      </Modal>
    </>
  );
};

export default NewControlPane;

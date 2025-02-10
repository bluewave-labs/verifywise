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
import { useState, useEffect, useContext } from "react";
import AuditorFeedback from "../ComplianceFeedback/ComplianceFeedback";
import { createNewUser } from "../../../../application/repository/entity.repository";
import DualButtonModal from "../../../vw-v2-components/Dialogs/DualButtonModal";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import { State, SubControlState } from "./paneInterfaces";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";

const NewControlPane = ({
  id,
  numbering,
  isOpen,
  handleClose,
  title,
  content,
  subControls,
  controlCategory,
  controlCategoryId,
  OnSave,
  controlGroupId,
}: {
  id: string;
  numbering: string;
  isOpen: boolean;
  handleClose: () => void;
  title: string;
  content: string;
  subControls: any[];
  controlCategory: string;
  controlCategoryId: string;
  OnSave?: (state: State) => void;
  controlGroupId: string;
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<string>("Overview");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialValues, setInitialValues] = useState<State>();
  const { dashboardValues } = useContext(VerifyWiseContext);

  useEffect(() => {
    console.log("useEffect triggered with id:", id);
    const fetchControl = async () => {
      try {
        console.log("Fetching control...");
        const response = await createNewUser({
          routeUrl: `/controls/compliance/${controlGroupId}`,
          body: {
            controlTitle: title,
            controlDescription: content,
          },
        });
        if (response.status === 200) {
          console.log("response.data ", response);
          setInitialValues(response.data);
        } else {
          console.log("Error: ", response.status);
        }
      } catch (error) {
        console.error("Error fetching control:", error);
      }
    };
    fetchControl();
  }, [id]);

  const initialSubControlState = subControls.map(
    (subControl: SubControlState, index) => ({
      control_id: initialValues?.subControls[index]?.control_id || id,
      subControlId: initialValues?.subControls[index]?.id || subControl.id,
      subControlTitle:
        initialValues?.subControls[index]?.subControlTitle || subControl.title,
      subControlDescription:
        initialValues?.subControls[index]?.subControlDescription ||
        subControl.subControlDescription,
      status: initialValues?.subControls[index]?.status || subControl.status,
      approver:
        initialValues?.subControls[index]?.approver || subControl.approver,
      riskReview:
        initialValues?.subControls[index]?.riskReview || subControl.riskReview,
      owner: initialValues?.subControls[index]?.owner || subControl.owner,
      reviewer:
        initialValues?.subControls[index]?.reviewer || subControl.reviewer,
      description:
        initialValues?.subControls[index]?.description ||
        subControl.description,
      date: initialValues?.subControls[index]?.date || subControl.date,
      evidence:
        initialValues?.subControls[index]?.evidence || subControl.evidence,
      feedback:
        initialValues?.subControls[index]?.feedback || subControl.feedback,
    })
  );

  const [state, setState] = useState<State>({
    control: {
      id: id,
      controlTitle: title,
      controlDescription: content,
      status: initialValues?.control?.status || "",
      approver: initialValues?.control?.approver || "",
      riskReview: initialValues?.control?.riskReview || "",
      owner: initialValues?.control?.owner || "",
      reviewer: initialValues?.control?.reviewer || "",
      description: initialValues?.control?.description || "",
      date: initialValues?.control?.date || null,
    },
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

  const handleSave = () => {
    setIsModalOpen(true);
  };

  const confirmSave = async () => {
    console.log(
      "projectId: dashboardValues.selectedProjectId",
      dashboardValues.selectedProjectId
    );
    const controlToSave = {
      controlCategoryTitle: controlCategory,
      controlCategoryId: controlCategoryId,
      control: state,
      projectId:
        dashboardValues.selectedProjectId ||
        parseInt(localStorage.getItem("selectedProjectId") || "0", 10),
    };
    console.log("controlToSave : ", controlToSave);
    try {
      const response = await apiServices.post(
        "/controls/saveControls",
        controlToSave
      );
      console.log("Controls saved successfully:", response);
    } catch (error) {
      console.error("Error saving controls:", error);
    }
    if (OnSave) {
      OnSave(state);
    }
    setIsModalOpen(false);
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
          isControl={true}
          elementId={`control-${id}`}
          state={initialValues?.control}
          setState={(newState) =>
            setState((prevState) => ({
              ...prevState,
              control: { ...prevState.control, ...newState },
            }))
          } // Update the control state correctly
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
          <Typography sx={{ mb: 5, fontSize: 13 }}>
            {subControls[selectedTab].description}
          </Typography>
          {activeSection === "Overview" && (
            <Typography fontSize={13}>
              <DropDowns
                isControl={false}
                elementId={`sub-control-${id}.${subControls[selectedTab].id}`}
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

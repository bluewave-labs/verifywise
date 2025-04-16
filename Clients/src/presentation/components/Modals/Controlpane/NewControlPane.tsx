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
import { useState, useContext } from "react";
import AuditorFeedback from "../ComplianceFeedback/ComplianceFeedback";
import { updateEntityById } from "../../../../application/repository/entity.repository";
import { Subcontrol } from "../../../../domain/Subcontrol";
import { Control } from "../../../../domain/Control";
import {  FileData } from "../../../../domain/File";
import Alert from "../../Alert";
import VWToast from "../../../vw-v2-components/Toast";
import SaveIcon from "@mui/icons-material/Save";
import VWButton from "../../../vw-v2-components/Buttons";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";

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
  onComplianceUpdate,
}: {
  data: Control;
  isOpen: boolean;
  handleClose: () => void;
  controlCategoryId?: string;
  OnSave?: (state: Control) => void;
  onComplianceUpdate?: () => void;
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<string>("Overview");
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
    showOverlay?: boolean;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletedFilesIds, setDeletedFilesIds] = useState<number[]>([]);
  const [uploadFiles, setUploadFiles] = useState<{
    [key: string]: {
      evidence: FileData[];
      feedback: FileData[];
    };
  }>({});
  const context = useContext(VerifyWiseContext);

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
    setState(prevState => ({
      ...prevState,
      subControls: prevState.subControls!.map((sc) => ({
        ...sc,
        evidence_files: sc.evidence_files || [],
        feedback_files: sc.feedback_files || []
      }))
    }));
    setSelectedTab(newValue);
  };

  const getVariant = (activeSection: string, section: string) => {
    return activeSection === section ? "contained" : "outlined";
  };

  const handleSectionChange = (section: string) => {
    setState(prevState => ({
      ...prevState,
      subControls: prevState.subControls!.map(sc => ({
        ...sc,
        evidence_files: sc.evidence_files || [],
        feedback_files: sc.feedback_files || []
      }))
    }));
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

  const getUploadFilesForSubcontrol = (subcontrolId: string, type: 'evidence' | 'feedback') => {
    return uploadFiles[subcontrolId]?.[type] || [];
  };

  const setUploadFilesForSubcontrol = (subcontrolId: string, type: 'evidence' | 'feedback', files: FileData[]) => {
    setUploadFiles(prev => ({
      ...prev,
      [subcontrolId]: {
        ...prev[subcontrolId],
        [type]: files
      }
    }));
  };

  const confirmSave = async () => {
    console.log("state controlToSave : ", state);
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Add control level fields
      formData.append('title', state.title || '');
      formData.append('description', state.description || '');
      formData.append('status', state.status || '');
      formData.append('approver', state.approver?.toString() || '');
      formData.append('risk_review', state.risk_review || '');
      formData.append('owner', state.owner?.toString() || '');
      formData.append('reviewer', state.reviewer?.toString() || '');
      formData.append('due_date', state.due_date ? new Date(state.due_date).toISOString().split('T')[0] : '');
      formData.append('implementation_details', state.implementation_details || '');
      formData.append('order_no', state.order_no?.toString() || '');

      // Add subcontrols as a JSON string
      const subControlsForJson = state.subControls?.map(sc => ({
        id: sc.id,
        title: sc.title,
        description: sc.description,
        order_no: sc.order_no,
        status: sc.status,
        approver: sc.approver,
        risk_review: sc.risk_review,
        owner: sc.owner,
        reviewer: sc.reviewer,
        due_date: sc.due_date,
        implementation_details: sc.implementation_details,
        evidence_description: sc.evidence_description,
        feedback_description: sc.feedback_description
      }));
      formData.append('subControls', JSON.stringify(subControlsForJson));

      // Add files for each subcontrol
      state.subControls?.forEach(sc => {
        const scId = sc.id?.toString();
        if (!scId) return;

        // Get both existing files and pending uploads for evidence
        const evidenceFiles = [
          ...(Array.isArray(sc.evidence_files) ? sc.evidence_files : []),
          ...(uploadFiles[scId]?.evidence || [])
        ];

        // Get both existing files and pending uploads for feedback
        const feedbackFiles = [
          ...(Array.isArray(sc.feedback_files) ? sc.feedback_files : []),
          ...(uploadFiles[scId]?.feedback || [])
        ];

        // Add evidence files to form data
        evidenceFiles.forEach(fileData => {
          if (fileData.data instanceof Blob) {
            const fileToUpload = fileData.data instanceof File
              ? fileData.data
              : new File([fileData.data], fileData.fileName, { type: fileData.type });
            formData.append(`evidence_files_${sc.id}`, fileToUpload);
          }
        });

        // Add feedback files to form data
        feedbackFiles.forEach(fileData => {
          if (fileData.data instanceof Blob) {
            const fileToUpload = fileData.data instanceof File
              ? fileData.data
              : new File([fileData.data], fileData.fileName, { type: fileData.type });
            formData.append(`feedback_files_${sc.id}`, fileToUpload);
          }
        });
      });

      // Add user and project info
      formData.append('user_id', context?.userId?.toString() || '');
      formData.append('project_id', context?.currentProjectId?.toString() || '');

      // Add delete array if needed (you might want to track deleted files)
      formData.append('delete', JSON.stringify(deletedFilesIds));

      const response = await updateEntityById({
        routeUrl: `/controls/saveControls/${state.id}`,
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        console.log("Controls updated successfully:", response);
        setIsSubmitting(false);
        
        // Clear upload files after successful save
        setUploadFiles({});
        
        // Notify parent components about success
        OnSave?.(state);
        onComplianceUpdate?.();
        
        // Close the modal
        handleClose();
      } else {
        console.error("Error updating controls");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error updating controls:", error);
      setIsSubmitting(false);
    }
  };

  const handleCloseWrapper = () => {
    handleClose();
  };

  return (
    <>
      {alert && (
        <>
          {alert.showOverlay && (
            <Box
              sx={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                zIndex: 9998,
              }}
            />
          )}
          <Box
            sx={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 9999,
              width: "100%",
              maxWidth: "400px",
              textAlign: "center"
            }}
          >
            <Alert
              variant={alert.type}
              body={alert.message}
              isToast={true}
              onClick={() => setAlert(null)}
              sx={{
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
              }}
            />
          </Box>
        </>
      )}

      {isSubmitting && <VWToast title="Saving control. Please wait..." />}

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
              component="span"
              fontSize={16}
              fontWeight={600}
              sx={{ textAlign: "left" }}
            >
              {`${controlCategoryId + "." + data.order_no}`} {data.title}
            </Typography>
            <Box
              component="span"
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
          <Typography component="span" fontSize={13}>{data.description}</Typography>
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
                  key={`sub-control-${data.order_no}.${state.subControls![selectedTab].id
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
              component="span"
              fontSize={16}
              fontWeight={600}
              sx={{ textAlign: "left", mb: 3 }}
            >
              {`${controlCategoryId}.${data.order_no}.${state.subControls![selectedTab].order_no}`}{" "}
              {state.subControls![selectedTab].title}
            </Typography>
            <Typography component="span" sx={{ mb: 5, fontSize: 13 }}>
              {state.subControls![selectedTab].description}
            </Typography>
            {activeSection === "Overview" && (
              <Typography component="span" fontSize={13}>
                <DropDowns
                  key={`sub-control-${data.order_no}.${state.subControls![selectedTab].id}`}
                  isControl={false}
                  elementId={`sub-control-${data.order_no}.${state.subControls![selectedTab].id}`}
                  state={state.subControls![selectedTab]}
                  setState={(newState) =>
                    handleSubControlStateChange(selectedTab, newState)
                  }
                />
              </Typography>
            )}
            {activeSection === "Evidence" && (
              <AuditorFeedback
                key={`sub-control-${data.order_no}.${state.subControls![selectedTab].id}.evidence`}
                activeSection={activeSection}
                feedback={state.subControls![selectedTab].evidence_description}
                onChange={(e) => {
                  const updatedSubControls = [...state.subControls!];
                  updatedSubControls[selectedTab].evidence_description = e.target.value;
                  setState({ ...state, subControls: updatedSubControls });
                }}
                files={Array.isArray(state.subControls![selectedTab].evidence_files) ? state.subControls![selectedTab].evidence_files : []}
                onFilesChange={(files) => {
                  const updatedSubControls = [...state.subControls!];
                  updatedSubControls[selectedTab].evidence_files = files;
                  setState({ ...state, subControls: updatedSubControls });
                }}
                deletedFilesIds={deletedFilesIds}
                onDeletedFilesChange={setDeletedFilesIds}
                uploadFiles={getUploadFilesForSubcontrol(state.subControls![selectedTab].id?.toString() || '', 'evidence')}
                onUploadFilesChange={(files) => setUploadFilesForSubcontrol(state.subControls![selectedTab].id?.toString() || '', 'evidence', files)}
              />
            )}
            {activeSection === "Auditor Feedback" && (
              <AuditorFeedback
                key={`sub-control-${data.order_no}.${state.subControls![selectedTab].id}.auditor-feedback`}
                activeSection={activeSection}
                feedback={state.subControls![selectedTab].feedback_description}
                onChange={(e) => {
                  const updatedSubControls = [...state.subControls!];
                  updatedSubControls[selectedTab].feedback_description = e.target.value;
                  setState({ ...state, subControls: updatedSubControls });
                }}
                files={Array.isArray(state.subControls![selectedTab].feedback_files) ? state.subControls![selectedTab].feedback_files : []}
                onFilesChange={(files) => {
                  const updatedSubControls = [...state.subControls!];
                  updatedSubControls[selectedTab].feedback_files = files;
                  setState({ ...state, subControls: updatedSubControls });
                }}
                deletedFilesIds={deletedFilesIds}
                onDeletedFilesChange={setDeletedFilesIds}
                uploadFiles={getUploadFilesForSubcontrol(state.subControls![selectedTab].id?.toString() || '', 'feedback')}
                onUploadFilesChange={(files) => setUploadFilesForSubcontrol(state.subControls![selectedTab].id?.toString() || '', 'feedback', files)}
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
              onClick={confirmSave}
              icon={<SaveIcon />}
            />
          </Stack>
        </Stack>
      </Modal>
    </>
  );
};

export default NewControlPane;

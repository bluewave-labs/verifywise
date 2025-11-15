import {
  Box,
  Button,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import DropDowns from "../../Inputs/Dropdowns";
import { useState, useEffect } from "react";
import AuditorFeedback from "../ComplianceFeedback/ComplianceFeedback";
import { Subcontrol } from "../../../../domain/types/Subcontrol";
import { Control } from "../../../../domain/types/Control";
import { FileData } from "../../../../domain/types/File";
import Alert from "../../Alert";
import CustomizableToast from "../../Toast";
import StandardModal from "../StandardModal";

import {
  AlertBox,
  styles,
} from "../../../pages/ComplianceTracker/1.0ComplianceTracker/styles";
import { handleAlert } from "../../../../application/tools/alertUtils";
import { AlertProps } from "../../../../domain/interfaces/iAlert";
import allowedRoles from "../../../../application/constants/permissions";
import { updateControl } from "../../../../application/repository/control_eu_act.repository";
import { useAuth } from "../../../../application/hooks/useAuth";
import { useSearchParams } from "react-router-dom";

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
  OnError,
  onComplianceUpdate,
  projectId,
}: {
  data: Control;
  isOpen: boolean;
  handleClose: () => void;
  controlCategoryId?: string;
  OnSave?: (state: Control) => void;
  OnError?: () => void;
  onComplianceUpdate?: () => void;
  projectId: number;
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<string>("Overview");
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletedFilesIds, setDeletedFilesIds] = useState<number[]>([]);
  const [uploadFiles, setUploadFiles] = useState<{
    [key: string]: {
      evidence: FileData[];
      feedback: FileData[];
    };
  }>({});
  const { userRoleName, userId } = useAuth();
  const isEditingDisabled =
    !allowedRoles.frameworks.edit.includes(userRoleName);
  const isAuditingDisabled =
    !allowedRoles.frameworks.audit.includes(userRoleName);
  const [searchParams] = useSearchParams();
  const subControlId = searchParams.get("subControlId");
  const isEvidence = searchParams.get("isEvidence");

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
    id: data.id,
    title: data.title,
    description: data.description,
    order_no: data.order_no,
    control_category_id: data.control_category_id,
    subControls: initialSubControlState || [],
  }));

  useEffect(() => {
    if (subControlId && data.subControls && data.subControls?.length > 0) {
      const subControl = data.subControls.find(
        (sc) => sc.id === Number(subControlId)
      );
      if (subControl) {
        const sorted = (data.subControls || [])
          .slice()
          .sort((a, b) => (a.order_no ?? 0) - (b.order_no ?? 0));
        const idx = sorted.findIndex((sc) => sc.id === subControl.id);
        setSelectedTab(idx >= 0 ? idx : 0);
        setActiveSection(
          isEvidence === null
            ? "Overview"
            : isEvidence === "true"
            ? "Evidence"
            : "Auditor Feedback"
        );
      }
    }
  }, [subControlId, data, isEvidence]);

  const handleSelectedTab = (_: React.SyntheticEvent, newValue: number) => {
    setState((prevState) => ({
      ...prevState,
      subControls: prevState.subControls!.map((sc) => ({
        ...sc,
        evidence_files: sc.evidence_files || [],
        feedback_files: sc.feedback_files || [],
      })),
    }));
    setSelectedTab(newValue);
  };

  const getVariant = (activeSection: string, section: string) => {
    return activeSection === section ? "contained" : "outlined";
  };

  const handleSectionChange = (section: string) => {
    setState((prevState) => ({
      ...prevState,
      subControls: prevState.subControls!.map((sc) => ({
        ...sc,
        evidence_files: sc.evidence_files || [],
        feedback_files: sc.feedback_files || [],
      })),
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

  const getUploadFilesForSubcontrol = (
    subcontrolId: string,
    type: "evidence" | "feedback"
  ) => {
    return uploadFiles[subcontrolId]?.[type] || [];
  };

  const setUploadFilesForSubcontrol = (
    subcontrolId: string,
    type: "evidence" | "feedback",
    files: FileData[]
  ) => {
    setUploadFiles((prev) => ({
      ...prev,
      [subcontrolId]: {
        ...prev[subcontrolId],
        [type]: files,
      },
    }));
    if (deletedFilesIds.length > 0 || files.length > 0) {
      handleAlert({
        variant: "info",
        body: "Please save the changes to save the file changes.",
        setAlert,
      });
    }
  };

  const confirmSave = async () => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Add control level fields (structural fields only - status fields removed)
      formData.append("title", state.title || "");
      formData.append("description", state.description || "");
      formData.append("order_no", state.order_no?.toString() || "");

      // Add subcontrols as a JSON string
      const subControlsForJson = state.subControls?.map((sc) => ({
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
        feedback_description: sc.feedback_description,
      }));
      formData.append("subControls", JSON.stringify(subControlsForJson));

      // Add files for each subcontrol
      state.subControls?.forEach((sc) => {
        const scId = sc.id?.toString();
        if (!scId) return;

        // Get both existing files and pending uploads for evidence
        const evidenceFiles = [
          ...(Array.isArray(sc.evidence_files) ? sc.evidence_files : []),
          ...(uploadFiles[scId]?.evidence || []),
        ];

        // Get both existing files and pending uploads for feedback
        const feedbackFiles = [
          ...(Array.isArray(sc.feedback_files) ? sc.feedback_files : []),
          ...(uploadFiles[scId]?.feedback || []),
        ];

        // Add evidence files to form data
        evidenceFiles.forEach((fileData) => {
          if (fileData.data instanceof Blob) {
            const fileToUpload =
              fileData.data instanceof File
                ? fileData.data
                : new File([fileData.data], fileData.fileName, {
                    type: fileData.type,
                  });
            formData.append(`evidence_files_${sc.id}`, fileToUpload);
          }
        });

        // Add feedback files to form data
        feedbackFiles.forEach((fileData) => {
          if (fileData.data instanceof Blob) {
            const fileToUpload =
              fileData.data instanceof File
                ? fileData.data
                : new File([fileData.data], fileData.fileName, {
                    type: fileData.type,
                  });
            formData.append(`feedback_files_${sc.id}`, fileToUpload);
          }
        });
      });

      // Add user and project info
      formData.append("user_id", userId?.toString() || "1");
      formData.append("project_id", projectId.toString());

      // Add delete array if needed (you might want to track deleted files)
      formData.append("delete", JSON.stringify(deletedFilesIds));

      const response = await updateControl({
        controlId: state.id,
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        setIsSubmitting(false);

        // Clear upload files after successful save
        setUploadFiles({});

        // Notify parent components about success
        OnSave?.(state);
        onComplianceUpdate?.();

        // Close the modal
        handleClose();
      } else {
        console.error("Failed to save control changes. Please try again.");
        setIsSubmitting(false);
        // Notify parent components about error
        OnError?.();
        // Close the modal
        handleClose();
      }
    } catch (error) {
      console.error("Failed to save control changes. Please try again.", error);
      setIsSubmitting(false);
      // Notify parent components about error
      OnError?.();
      // Close the modal
      handleClose();
    }
  };

  return (
    <>
      {alert && (
        <AlertBox>
          <Alert
            variant={alert.variant}
            body={alert.body}
            isToast={true}
            onClick={() => setAlert(null)}
            sx={styles.alert}
          />
        </AlertBox>
      )}

      {isSubmitting && (
        <CustomizableToast title="Saving control. Please wait..." />
      )}

      <StandardModal
        isOpen={isOpen}
        onClose={handleClose}
        title={`${controlCategoryId}.${data.order_no} ${data.title}`}
        description={data.description || ""}
        onSubmit={confirmSave}
        submitButtonText="Save"
        isSubmitting={isSubmitting}
        maxWidth="800px"
      >
        <Stack spacing={6}>
          {/* Control-level fields removed - only subcontrols have these fields now */}
          <Box sx={{ width: "100%", bgcolor: "#FCFCFD", mt: -3 }}>
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
            <Stack direction="column" justifyContent="space-between">
              <Typography
                component="span"
                fontSize={16}
                fontWeight={600}
                sx={{ textAlign: "left", mb: 3 }}
              >
                {`${controlCategoryId}.${data.order_no}.${
                  state.subControls![selectedTab].order_no
                }`}{" "}
                {state.subControls![selectedTab].title}
              </Typography>
              <Typography component="span" sx={{ mb: 5, fontSize: 13 }}>
                {state.subControls![selectedTab].description}
              </Typography>
            </Stack>
            {activeSection === "Overview" && (
              <Typography component="span" fontSize={13}>
                <DropDowns
                  key={`sub-control-${data.order_no}.${
                    state.subControls![selectedTab].id
                  }`}
                  isControl={false}
                  elementId={`sub-control-${data.order_no}.${
                    state.subControls![selectedTab].id
                  }`}
                  projectId={projectId}
                  state={state.subControls![selectedTab]}
                  setState={(newState) =>
                    handleSubControlStateChange(selectedTab, newState)
                  }
                  readOnly={isEditingDisabled}
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
                files={
                  Array.isArray(state.subControls![selectedTab].evidence_files)
                    ? state.subControls![selectedTab].evidence_files
                    : []
                }
                onFilesChange={(files) => {
                  const updatedSubControls = [...state.subControls!];
                  updatedSubControls[selectedTab].evidence_files = files;
                  setState({ ...state, subControls: updatedSubControls });
                }}
                deletedFilesIds={deletedFilesIds}
                onDeletedFilesChange={setDeletedFilesIds}
                uploadFiles={getUploadFilesForSubcontrol(
                  state.subControls![selectedTab].id?.toString() || "",
                  "evidence"
                )}
                onUploadFilesChange={(files) =>
                  setUploadFilesForSubcontrol(
                    state.subControls![selectedTab].id?.toString() || "",
                    "evidence",
                    files
                  )
                }
                readOnly={isEditingDisabled}
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
                files={
                  Array.isArray(state.subControls![selectedTab].feedback_files)
                    ? state.subControls![selectedTab].feedback_files
                    : []
                }
                onFilesChange={(files) => {
                  const updatedSubControls = [...state.subControls!];
                  updatedSubControls[selectedTab].feedback_files = files;
                  setState({ ...state, subControls: updatedSubControls });
                }}
                deletedFilesIds={deletedFilesIds}
                onDeletedFilesChange={setDeletedFilesIds}
                uploadFiles={getUploadFilesForSubcontrol(
                  state.subControls![selectedTab].id?.toString() || "",
                  "feedback"
                )}
                onUploadFilesChange={(files) =>
                  setUploadFilesForSubcontrol(
                    state.subControls![selectedTab].id?.toString() || "",
                    "feedback",
                    files
                  )
                }
                readOnly={isAuditingDisabled}
              />
            )}
          </Box>
        </Stack>
      </StandardModal>
    </>
  );
};

export default NewControlPane;

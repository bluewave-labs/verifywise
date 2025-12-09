import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Stack,
  Typography,
  Chip,
  Tab,
  Tabs,
  Button,
  IconButton,
} from "@mui/material";
import { X as CloseIcon, Download as DownloadIcon, Trash2 as DeleteIcon } from "lucide-react";
import { useState, useCallback, Suspense, lazy } from "react";
import { EUAIActQuestionDrawerProps, EUAIActFormData, EUAIACT_STATUS_OPTIONS } from "./types";
import RichTextEditor from "../../RichTextEditor";
import Select from "../../Inputs/Select";
import Alert from "../../Alert";
import { AlertProps } from "../../../../domain/interfaces/iAlert";
import { handleAlert } from "../../../../application/tools/alertUtils";
import { updateEUAIActAnswerById } from "../../../../application/repository/question.repository";
import { useAuth } from "../../../../application/hooks/useAuth";
import allowedRoles from "../../../../application/constants/permissions";
import LinkedRisksPopup from "../../LinkedRisks";

const NotesTab = lazy(() => import("../../Notes/NotesTab"));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      style={{
        width: "100%",
      }}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const EUAIActQuestionDrawerDialog = ({
  open,
  onClose,
  question,
  subtopic,
  currentProjectId,
  onSaveSuccess,
}: EUAIActQuestionDrawerProps) => {
  const { userRoleName, userId } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<EUAIActFormData>({
    answer: question?.answer || "",
    status: question?.status || "notStarted",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<any[]>(question?.evidence_files || []);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [deletedFiles, setDeletedFiles] = useState<number[]>([]);
  const [isLinkedRisksModalOpen, setIsLinkedRisksModalOpen] = useState(false);
  const [selectedRisks, setSelectedRisks] = useState<number[]>([]);
  const [deletedRisks, setDeletedRisks] = useState<number[]>([]);

  const isEditingDisabled = !(allowedRoles?.frameworks?.edit || []).includes(
    userRoleName || ""
  );

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFormChange = (field: keyof EUAIActFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAnswerChange = (answer: string) => {
    const cleanedAnswer = answer?.replace(/^<p>|<\/p>$/g, "") || "";
    setFormData((prev) => ({
      ...prev,
      answer: cleanedAnswer || "",
    }));
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadFiles((prev) => [...prev, ...files]);
  }, []);

  const handleRemoveFile = (fileId: string) => {
    const id = parseInt(fileId);
    if (!isNaN(id)) {
      setDeletedFiles((prev) => [...prev, id]);
      setEvidenceFiles((prev) => prev.filter((f) => f.id !== fileId));
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const formDataToSend = new FormData();
      formDataToSend.append("answer", formData.answer);
      formDataToSend.append("status", formData.status);
      formDataToSend.append("user_id", userId?.toString() || "");
      formDataToSend.append("project_id", currentProjectId.toString());
      formDataToSend.append("delete", JSON.stringify(deletedFiles));
      formDataToSend.append("risksDelete", JSON.stringify(deletedRisks));
      formDataToSend.append("risksMitigated", JSON.stringify(selectedRisks));

      // Append new files
      uploadFiles.forEach((file) => {
        formDataToSend.append("files", file);
      });

      const response = await updateEUAIActAnswerById({
        answerId: question.answer_id,
        body: formDataToSend,
      });

      if (response.status === 202) {
        setFormData({
          answer: response.data.data.answer || "",
          status: response.data.data.status || "notStarted",
        });
        setEvidenceFiles(response.data.data.evidence_files || []);
        setUploadFiles([]);
        setDeletedFiles([]);
        setSelectedRisks([]);
        setDeletedRisks([]);

        handleAlert({
          variant: "success",
          body: "Question updated successfully",
          setAlert,
        });

        // Trigger parent refresh with green flash
        onSaveSuccess(true, "Question updated successfully", question.question_id);
      } else {
        handleAlert({
          variant: "error",
          body: "Something went wrong, please try again",
          setAlert,
        });
      }
    } catch (error) {
      console.error("Error saving question:", error);
      handleAlert({
        variant: "error",
        body: "Something went wrong, please try again",
        setAlert,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "90vh",
          overflow: "visible",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #d0d5dd",
          padding: "16px",
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#344054" }}>
            {subtopic?.title}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon size={20} />
        </IconButton>
      </DialogTitle>

      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{
          borderBottom: "1px solid #d0d5dd",
          backgroundColor: "#f9fafb",
          paddingX: "16px",
        }}
        indicatorColor="primary"
      >
        <Tab label="Details" value={0} />
        <Tab label="Evidence" value={1} />
        <Tab label="Cross mappings" value={2} />
        <Tab label="Notes" value={3} />
      </Tabs>

      <DialogContent sx={{ padding: 0, overflow: "visible" }}>
        {/* Tab 1: Details */}
        <TabPanel value={tabValue} index={0}>
          <Stack sx={{ gap: 3 }}>
            {/* Read-only Question Panel */}
            <Box
              sx={{
                border: "1px solid #eee",
                padding: "12px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
              }}
            >
              <Typography sx={{ fontSize: 13, color: "#344054" }}>
                {question?.question}
              </Typography>
              {question?.hint && (
                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#666",
                    marginTop: "8px",
                    fontStyle: "italic",
                  }}
                >
                  💡 Hint: {question.hint}
                </Typography>
              )}
            </Box>

            {/* Priority & Required Badges */}
            <Stack sx={{ flexDirection: "row", gap: 1, alignItems: "center" }}>
              {question?.priority_level && (
                <Chip
                  label={question.priority_level}
                  size="small"
                  sx={{
                    backgroundColor: "#f0f0f0",
                    color: "#344054",
                  }}
                />
              )}
              {question?.is_required && (
                <Chip label="Required" size="small" sx={{ backgroundColor: "#e8f5e9" }} />
              )}
            </Stack>

            {/* Answer Field */}
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}>
                Answer
              </Typography>
              <RichTextEditor
                onContentChange={handleAnswerChange}
                initialContent={formData.answer}
                isEditable={!isEditingDisabled}
                headerSx={{
                  borderRadius: "4px 4px 0 0",
                  borderTop: "1px solid #d0d5dd",
                  borderColor: "#d0d5dd",
                }}
                bodySx={{
                  borderColor: "#d0d5dd",
                  borderRadius: "0 0 4px 4px",
                  "& .ProseMirror > p": {
                    margin: 0,
                  },
                }}
              />
            </Box>

            {/* Status Field */}
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}>
                Status
              </Typography>
              <Select
                id="status-select"
                items={EUAIACT_STATUS_OPTIONS.map((option) => ({
                  _id: option.id,
                  name: option.name,
                }))}
                value={formData.status}
                onChange={(e) => handleFormChange("status", String(e.target.value))}
                getOptionValue={(item) => String(item._id)}
                sx={{ width: 200 }}
                disabled={isEditingDisabled}
              />
            </Box>

            {/* Action Buttons */}
            <Stack sx={{ flexDirection: "row", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isEditingDisabled || isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button variant="outlined" onClick={onClose}>
                Close
              </Button>
            </Stack>
          </Stack>
        </TabPanel>

        {/* Tab 2: Evidence */}
        <TabPanel value={tabValue} index={1}>
          <Stack sx={{ gap: 2 }}>
            {/* Upload Button */}
            <Box>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={isEditingDisabled}
                id="evidence-upload"
                style={{ display: "none" }}
              />
              <Button
                variant="contained"
                component="label"
                htmlFor="evidence-upload"
                disabled={isEditingDisabled}
              >
                Add evidence files
              </Button>
            </Box>

            {/* File Counters */}
            <Stack sx={{ gap: 1 }}>
              <Typography sx={{ fontSize: 12, color: "#666" }}>
                {evidenceFiles.length} files attached
              </Typography>
              {uploadFiles.length > 0 && (
                <Typography sx={{ fontSize: 12, color: "#666" }}>
                  +{uploadFiles.length} pending upload
                </Typography>
              )}
              {deletedFiles.length > 0 && (
                <Typography sx={{ fontSize: 12, color: "#666" }}>
                  -{deletedFiles.length} pending delete
                </Typography>
              )}
            </Stack>

            {/* Existing Files */}
            {evidenceFiles.length > 0 && (
              <Box sx={{ gap: 1, display: "flex", flexDirection: "column" }}>
                {evidenceFiles.map((file) => (
                  <Box
                    key={file.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px",
                      border: "1px solid #d0d5dd",
                      borderRadius: "4px",
                    }}
                  >
                    <Typography sx={{ fontSize: 12 }}>{file.fileName}</Typography>
                    <Stack sx={{ flexDirection: "row", gap: 1 }}>
                      <IconButton size="small">
                        <DownloadIcon size={14} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveFile(file.id)}
                        disabled={isEditingDisabled}
                      >
                        <DeleteIcon size={14} />
                      </IconButton>
                    </Stack>
                  </Box>
                ))}
              </Box>
            )}

            {/* Pending Upload Files */}
            {uploadFiles.length > 0 && (
              <Box sx={{ gap: 1, display: "flex", flexDirection: "column" }}>
                {uploadFiles.map((file, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      padding: "8px",
                      backgroundColor: "#FFFBEB",
                      border: "1px solid #FEF3C7",
                      borderRadius: "4px",
                    }}
                  >
                    <Typography sx={{ fontSize: 12 }}>{file.name}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Stack>
        </TabPanel>

        {/* Tab 3: Cross Mappings (Risks) */}
        <TabPanel value={tabValue} index={2}>
          <Stack sx={{ gap: 2 }}>
            {/* Add/Remove Risks Button */}
            <Button
              variant="contained"
              onClick={() => setIsLinkedRisksModalOpen(true)}
              disabled={isEditingDisabled}
            >
              Add/remove risks
            </Button>

            {/* Risk Counters */}
            <Stack sx={{ gap: 1 }}>
              <Typography sx={{ fontSize: 12, color: "#666" }}>
                {question?.risks?.length || 0} risks linked
              </Typography>
              {selectedRisks.length > 0 && (
                <Typography sx={{ fontSize: 12, color: "#666" }}>
                  +{selectedRisks.length} pending save
                </Typography>
              )}
              {deletedRisks.length > 0 && (
                <Typography sx={{ fontSize: 12, color: "#666" }}>
                  -{deletedRisks.length} pending delete
                </Typography>
              )}
            </Stack>

            {/* Linked Risks Modal */}
            {isLinkedRisksModalOpen && (
              <Suspense fallback={<div>Loading...</div>}>
                <LinkedRisksPopup
                  onClose={() => setIsLinkedRisksModalOpen(false)}
                  currentRisks={(question?.risks || [])
                    .concat(selectedRisks)
                    .filter((risk) => !deletedRisks.includes(risk))}
                  setSelectecRisks={setSelectedRisks}
                  _setDeletedRisks={setDeletedRisks}
                  projectId={currentProjectId}
                />
              </Suspense>
            )}
          </Stack>
        </TabPanel>

        {/* Tab 4: Notes */}
        <TabPanel value={tabValue} index={3}>
          <Suspense fallback={<div>Loading notes...</div>}>
            <NotesTab
              key={`eu-ai-act-question-${question.question_id}`}
              attachedTo="EU_AI_ACT_QUESTION"
              attachedToId={question.question_id?.toString() || ""}
            />
          </Suspense>
        </TabPanel>
      </DialogContent>

      {/* Alert */}
      {alert && <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />}
    </Dialog>
  );
};

export default EUAIActQuestionDrawerDialog;

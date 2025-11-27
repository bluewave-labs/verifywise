import React, { useState, useEffect } from "react";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Box } from "@mui/material";
import { TabContext, TabPanel } from "@mui/lab";
import { Button, CircularProgress } from "@mui/material";
import { Stack } from "@mui/material";
import { Divider, Drawer, Typography } from "@mui/material";
import { X as CloseIcon, Save as SaveIcon } from "lucide-react";

import Field from "../../Inputs/Field";
import Select from "../../Inputs/Select";
import DatePicker from "../../Inputs/Datepicker";
import ChipInput from "../../Inputs/ChipInput";
import CustomizableButton from "../../Button/CustomizableButton";
import Alert from "../../Alert";
import TabBar from "../../TabBar";
import {
  NISTAIRMFDrawerProps,
  NISTAIRMFStatus,
} from "../../../pages/Framework/NIST-AI-RMF/types";
import { AlertProps } from "../../../../domain/interfaces/iAlert";
import { updateEntityById } from "../../../../application/repository/entity.repository";
import { useAuth } from "../../../../application/hooks/useAuth";
import useUsers from "../../../../application/hooks/useUsers";
import { User } from "../../../../domain/types/User";
import { FileData } from "../../../../domain/types/File";
import { getFileById } from "../../../../application/repository/file.repository";
import allowedRoles from "../../../../application/constants/permissions";

export const inputStyles = {
  minWidth: 200,
  maxWidth: "100%",
  flexGrow: 1,
  height: 34,
};

const NISTAIRMFDrawerDialog: React.FC<NISTAIRMFDrawerProps> = ({
  open,
  onClose,
  onSaveSuccess,
  subcategory,
  category,
  function: functionType,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState("details");

  const { userRoleName, userId } = useAuth();
  const { users } = useUsers();

  const isEditingDisabled =
    !allowedRoles.frameworks.edit.includes(userRoleName);
  const isAuditingDisabled =
    !allowedRoles.frameworks.audit.includes(userRoleName);

  // Filter users to only show project members
  useEffect(() => {
    if (users?.length > 0) {
      // Since we don't have project data, use all users
      setProjectMembers(users);
    }
  }, [users]);

  // Load evidence files when subcategory changes
  useEffect(() => {
    if (subcategory?.evidence_links) {
      setEvidenceFiles(subcategory.evidence_links as unknown as FileData[]);
    } else {
      setEvidenceFiles([]);
    }
    // Reset upload and deleted files
    setUploadFiles([]);
    setDeletedFiles([]);
  }, [subcategory]);

  const [formData, setFormData] = useState({
    status: NISTAIRMFStatus.NOT_STARTED,
    owner: "",
    reviewer: "",
    approver: "",
    auditor_feedback: "",
    implementation_description: "",
    tags: [] as string[],
  });

  const [date, setDate] = useState<Dayjs | null>(null);

  // File upload state
  const [evidenceFiles, setEvidenceFiles] = useState<FileData[]>([]);
  const [uploadFiles, setUploadFiles] = useState<FileData[]>([]);
  const [deletedFiles, setDeletedFiles] = useState<string[]>([]);

  const statusOptions = [
    { id: NISTAIRMFStatus.NOT_STARTED, name: "Not started" },
    { id: NISTAIRMFStatus.DRAFT, name: "Draft" },
    { id: NISTAIRMFStatus.IN_PROGRESS, name: "In progress" },
    { id: NISTAIRMFStatus.AWAITING_REVIEW, name: "Awaiting review" },
    { id: NISTAIRMFStatus.AWAITING_APPROVAL, name: "Awaiting approval" },
    { id: NISTAIRMFStatus.IMPLEMENTED, name: "Implemented" },
    { id: NISTAIRMFStatus.NEEDS_REWORK, name: "Needs rework" },
  ];

  const tabs = [
    {
      label: "Details",
      value: "details",
      icon: "FileText" as const,
    },
    {
      label: "Evidence",
      value: "evidences",
      icon: "FolderOpen" as const,
    },
  ];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const inputStyles = {
    minWidth: 200,
    maxWidth: "100%",
    flexGrow: 1,
    height: 34,
  };

  // Populate form data when subcategory changes
  useEffect(() => {
    if (subcategory) {
      setFormData({
        status: subcategory.status || NISTAIRMFStatus.NOT_STARTED,
        owner: subcategory.owner?.toString() || "",
        reviewer: subcategory.reviewer?.toString() || "",
        approver: subcategory.approver?.toString() || "",
        auditor_feedback: subcategory.auditor_feedback || "",
        implementation_description:
          subcategory.implementation_description || "",
        tags: subcategory.tags || [],
      });

      // Set the date if it exists in the fetched data
      if (subcategory.due_date) {
        setDate(dayjs(subcategory.due_date));
      } else {
        setDate(null);
      }
    } else {
      // Reset form when no subcategory
      setFormData({
        status: NISTAIRMFStatus.NOT_STARTED,
        owner: "",
        reviewer: "",
        approver: "",
        auditor_feedback: "",
        implementation_description: "",
        tags: [],
      });
      setDate(null);
    }
  }, [subcategory]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectChange = (field: string) => (event: any) => {
    const value = event.target.value.toString();
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAlert = ({
    variant,
    body,
  }: {
    variant: "success" | "error" | "warning" | "info";
    body: string;
  }) => {
    setAlert({ variant, body });
    setTimeout(() => setAlert(null), 3000); // 3 seconds
  };

  // File handling functions
  const handleAddFiles = (files: File[]) => {
    const newFiles: FileData[] = files.map((file) => ({
      id: (Date.now() + Math.random()).toString(), // Temporary string ID
      fileName: file.name,
      size: file.size,
      type: file.type,
      data: file,
      uploadDate: new Date().toISOString(),
      uploader: "Current User",
    }));

    setUploadFiles((prev) => [...prev, ...newFiles]);
    handleAlert({
      variant: "info",
      body: `${files.length} file(s) added. Please save to apply changes.`,
    });
  };

  const handleDeleteEvidenceFile = (fileId: string) => {
    setEvidenceFiles((prev) => prev.filter((file) => file.id !== fileId));
    setDeletedFiles((prev) => [...prev, fileId]);
    handleAlert({
      variant: "info",
      body: "File marked for deletion. Please save to apply changes.",
    });
  };

  const handleDeleteUploadFile = (fileId: string) => {
    setUploadFiles((prev) => prev.filter((file) => file.id !== fileId));
    handleAlert({
      variant: "info",
      body: "File removed from upload queue.",
    });
  };

  const handleEvidenceFileDownload = async (
    fileId: string,
    fileName: string
  ) => {
    try {
      // Use /files/:id endpoint for evidence files (not file-manager)
      // This avoids project access checks since evidence files are linked to subcategories
      // Use arraybuffer and create Blob manually for better compatibility
      const response = await getFileById({
        id: fileId,
        responseType: "arraybuffer",
      });

      // Create Blob from arraybuffer
      const blob = new Blob([response], { type: "application/octet-stream" });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      handleAlert({
        variant: "success",
        body: "File downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      handleAlert({
        variant: "error",
        body: "Failed to download file. Please try again.",
      });
    }
  };

  const handleSave = async () => {
    if (!subcategory?.id) {
      handleAlert({
        variant: "error",
        body: "No subcategory selected for update",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Always use FormData to support both file and regular updates (ISO pattern)
      const formDataToSend = new FormData();

      // Add form fields
      formDataToSend.append("status", formData.status);
      formDataToSend.append(
        "implementation_description",
        formData.implementation_description
      );
      formDataToSend.append("auditor_feedback", formData.auditor_feedback);
      formDataToSend.append("tags", JSON.stringify(formData.tags));

      if (formData.owner) formDataToSend.append("owner", formData.owner);
      if (formData.reviewer)
        formDataToSend.append("reviewer", formData.reviewer);
      if (formData.approver)
        formDataToSend.append("approver", formData.approver);
      if (date) formDataToSend.append("due_date", date.toISOString());

      // Add file handling fields (ISO pattern)
      // Note: project_id is handled by backend - it gets user's actual project
      formDataToSend.append("user_id", userId?.toString() || "1");
      formDataToSend.append("delete", JSON.stringify(deletedFiles));

      // Add uploaded files - use the exact same pattern as ISO frameworks
      uploadFiles.forEach((file: FileData) => {
        if (file.data instanceof Blob) {
          const fileToUpload =
            file.data instanceof File
              ? file.data
              : new File([file.data!], file.fileName, { type: file.type });
          formDataToSend.append("files", fileToUpload);
        }
      });

      const response = await updateEntityById({
        routeUrl: `/nist-ai-rmf/subcategories/${subcategory.id}`,
        body: formDataToSend,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        const hasFiles = uploadFiles.length > 0 || deletedFiles.length > 0;
        setAlert({
          variant: "success",
          body: hasFiles
            ? "Subcategory updated successfully with files"
            : "Subcategory updated successfully",
        });
        setTimeout(() => setAlert(null), 3000); // 3 seconds

        onSaveSuccess?.(
          true,
          "Subcategory updated successfully",
          subcategory.id
        );
        onClose();
      } else {
        throw new Error(
          response.data?.message || "Failed to update subcategory"
        );
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update subcategory";
      setAlert({
        variant: "error",
        body: errorMessage,
      });
      setTimeout(() => setAlert(null), 3000); // 3 seconds
      onSaveSuccess?.(false, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Drawer
        className="nist-ai-rmf-drawer-dialog"
        open={open}
        onClose={(_event, reason) => {
          if (reason !== "backdropClick") {
            onClose();
          }
        }}
        sx={{
          width: 600,
          margin: 0,
          "& .MuiDrawer-paper": {
            margin: 0,
            borderRadius: 0,
          },
        }}
        anchor="right"
      >
        <Stack
          className="nist-ai-rmf-drawer-dialog-content"
          sx={{
            width: 600,
          }}
        >
          {/* Loading State */}
          {isLoading && (
            <Stack
              sx={{
                width: 600,
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>
                Loading subcategory data...
              </Typography>
            </Stack>
          )}

          {/* Main Content */}
          {!isLoading && (
            <>
              {/* Header */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                padding="15px 20px"
              >
                <Typography fontSize={15} fontWeight={700}>
                  {functionType} {category?.index}.{subcategory?.index}
                </Typography>
                <Button
                  onClick={onClose}
                  sx={{
                    minWidth: "0",
                    padding: "5px",
                  }}
                >
                  <CloseIcon size={20} color="#667085" />
                </Button>
              </Stack>

              <Divider />

              {/* Tabs */}
              <TabContext value={activeTab}>
                <Box sx={{ padding: "0 20px" }}>
                  <TabBar
                    tabs={tabs}
                    activeTab={activeTab}
                    onChange={handleTabChange}
                  />
                </Box>

                {/* Description Section - Details Tab */}
                <TabPanel value="details" sx={{ padding: 0 }}>
                  <Stack padding="15px 20px" gap="15px">
                    <Stack
                      sx={{
                        border: `1px solid #eee`,
                        padding: "10px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                      }}
                    >
                      <Typography fontSize={13}>
                        <strong>Description:</strong> {subcategory?.description}
                      </Typography>
                    </Stack>

                    <Stack>
                      <Typography fontSize={13} sx={{ marginBottom: "5px" }}>
                        Implementation description:
                      </Typography>
                      <Field
                        type="description"
                        value={formData.implementation_description}
                        onChange={(e) =>
                          handleFieldChange(
                            "implementation_description",
                            e.target.value
                          )
                        }
                        sx={{
                          cursor: "text",
                          "& .field field-decription field-input MuiInputBase-root MuiInputBase-input":
                            {
                              height: "73px",
                            },
                        }}
                        placeholder="Enter implementation details and how this subcategory is being addressed..."
                        disabled={isEditingDisabled}
                      />
                    </Stack>
                  </Stack>

                  <Divider />

                  {/* Status Assignment Section */}
                  <Stack padding="15px 20px" gap="24px">
                    <Select
                      id="status"
                      label="Status:"
                      value={formData.status}
                      onChange={handleSelectChange("status")}
                      items={statusOptions.map((status) => ({
                        _id: status.id,
                        name: status.name,
                      }))}
                      sx={inputStyles}
                      placeholder={"Select status"}
                      disabled={isEditingDisabled}
                    />

                    <Select
                      id="Owner"
                      label="Owner:"
                      value={formData.owner ? parseInt(formData.owner) : ""}
                      onChange={handleSelectChange("owner")}
                      items={projectMembers.map((user) => ({
                        _id: user.id,
                        name: `${user.name}`,
                        email: user.email,
                        surname: user.surname,
                      }))}
                      sx={inputStyles}
                      placeholder={"Select owner"}
                      disabled={isEditingDisabled}
                    />

                    <Select
                      id="Reviewer"
                      label="Reviewer:"
                      value={
                        formData.reviewer ? parseInt(formData.reviewer) : ""
                      }
                      onChange={handleSelectChange("reviewer")}
                      items={projectMembers.map((user) => ({
                        _id: user.id,
                        name: `${user.name}`,
                        email: user.email,
                        surname: user.surname,
                      }))}
                      sx={inputStyles}
                      placeholder={"Select reviewer"}
                      disabled={isEditingDisabled}
                    />

                    <Select
                      id="Approver"
                      label="Approver:"
                      value={
                        formData.approver ? parseInt(formData.approver) : ""
                      }
                      onChange={handleSelectChange("approver")}
                      items={projectMembers.map((user) => ({
                        _id: user.id,
                        name: `${user.name}`,
                        email: user.email,
                        surname: user.surname,
                      }))}
                      sx={inputStyles}
                      placeholder={"Select approver"}
                      disabled={isEditingDisabled}
                    />

                    <DatePicker
                      label="Due date:"
                      sx={inputStyles}
                      date={date}
                      disabled={isEditingDisabled}
                      handleDateChange={(newDate) => {
                        setDate(newDate);
                      }}
                    />

                    <Stack>
                      <Typography fontSize={13} sx={{ marginBottom: "5px" }}>
                        Auditor feedback:
                      </Typography>
                      <Field
                        type="description"
                        value={formData.auditor_feedback}
                        onChange={(e) =>
                          handleFieldChange("auditor_feedback", e.target.value)
                        }
                        sx={{
                          cursor: "text",
                          "& .field field-decription field-input MuiInputBase-root MuiInputBase-input":
                            {
                              height: "73px",
                            },
                        }}
                        placeholder="Enter any feedback from the internal or external audits..."
                        disabled={isAuditingDisabled}
                      />
                    </Stack>

                    <Stack>
                      <Typography fontSize={13} sx={{ marginBottom: "5px" }}>
                        Tags:
                      </Typography>
                      <ChipInput
                        id="tags"
                        value={formData.tags}
                        onChange={(newValue) =>
                          setFormData((prev) => ({
                            ...prev,
                            tags: newValue,
                          }))
                        }
                        placeholder="Add tags..."
                        disabled={isEditingDisabled}
                        sx={{
                          ...inputStyles,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "5px",
                            minHeight: "34px",
                          },
                          "& .MuiChip-root": {
                            borderRadius: "4px",
                            height: "22px",
                            margin: "1px 2px",
                            fontSize: "13px",
                          },
                        }}
                      />
                    </Stack>
                  </Stack>
                </TabPanel>

                {/* Evidences Tab */}
                <TabPanel value="evidences" sx={{ padding: "15px 20px" }}>
                  <Stack spacing={3}>
                    {/* Existing Evidence Files */}
                    {evidenceFiles.length > 0 && (
                      <Stack spacing={2}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          Attached Evidence Files ({evidenceFiles.length})
                        </Typography>
                        {evidenceFiles.map((file) => (
                          <Box
                            key={file.id}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: 2,
                              border: `1px solid #EAECF0`,
                              borderRadius: 1,
                              backgroundColor: "#FFFFFF",
                              "&:hover": {
                                backgroundColor: "#F9FAFB",
                              },
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              <SaveIcon size={20} color="#475467" />
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    color: "#1F2937",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {file.fileName}
                                </Typography>
                                <Typography variant="caption" color="#6B7280">
                                  {file.size &&
                                    `${(file.size / 1024).toFixed(1)} KB`}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                size="small"
                                variant="text"
                                color="primary"
                                onClick={() => {
                                  handleEvidenceFileDownload(
                                    file.id,
                                    file.fileName
                                  );
                                }}
                                sx={{ minWidth: "auto", padding: "4px 8px" }}
                              >
                                Download
                              </Button>
                              <Button
                                size="small"
                                variant="text"
                                color="error"
                                onClick={() =>
                                  handleDeleteEvidenceFile(file.id)
                                }
                                disabled={isEditingDisabled}
                                sx={{ minWidth: "auto", padding: "4px 8px" }}
                              >
                                Delete
                              </Button>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    )}

                    {/* File Upload Section */}
                    <Box sx={{ mt: 2 }}>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                        style={{ display: "none" }}
                        id="evidence-file-input"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            handleAddFiles(files);
                          }
                          e.target.value = ""; // Reset input
                        }}
                      />
                      <Button
                        variant="outlined"
                        component="label"
                        htmlFor="evidence-file-input"
                        disabled={isEditingDisabled}
                        sx={{
                          borderColor: "#13715B",
                          color: "#13715B",
                          "&:hover": {
                            borderColor: "#0e5c47",
                            backgroundColor: "rgba(19, 113, 91, 0.04)",
                          },
                          "&:disabled": {
                            borderColor: "#cccccc",
                            color: "#cccccc",
                          },
                        }}
                      >
                        Add evidence files
                      </Button>
                    </Box>

                    {/* Upload Queue Files */}
                    {uploadFiles.length > 0 && (
                      <Stack spacing={2}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          Files Ready to Upload ({uploadFiles.length})
                        </Typography>
                        {uploadFiles.map((file) => (
                          <Box
                            key={file.id}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: 2,
                              border: `1px solid #FEF3C7`,
                              borderRadius: 1,
                              backgroundColor: "#FFFBEB",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              <SaveIcon size={20} color="#D97706" />
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    color: "#92400E",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {file.fileName}
                                </Typography>
                                <Typography variant="caption" color="#B45309">
                                  {file.size &&
                                    `${(file.size / 1024).toFixed(1)} KB`}
                                </Typography>
                              </Box>
                            </Box>
                            <Button
                              size="small"
                              variant="text"
                              color="error"
                              onClick={() => handleDeleteUploadFile(file.id)}
                              sx={{ minWidth: "auto", padding: "4px 8px" }}
                            >
                              Remove
                            </Button>
                          </Box>
                        ))}
                      </Stack>
                    )}

                    {evidenceFiles.length === 0 && uploadFiles.length === 0 && (
                      <Box
                        sx={{
                          textAlign: "center",
                          py: 4,
                          color: "#6B7280",
                          border: `2px dashed #D1D5DB`,
                          borderRadius: 1,
                          backgroundColor: "#F9FAFB",
                        }}
                      >
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          No evidence files uploaded yet
                        </Typography>
                        <Typography variant="caption" color="#9CA3AF">
                          Click "Add evidence files" to upload documentation for
                          this subcategory
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </TabPanel>

              </TabContext>

              <Divider />

              {/* Footer */}
              <Stack
                className="nist-ai-rmf-drawer-dialog-footer"
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  padding: "15px 20px",
                  marginTop: "auto",
                }}
              >
                <CustomizableButton
                  variant="contained"
                  text="Save"
                  sx={{
                    backgroundColor: "#13715B",
                    border: "1px solid #13715B",
                    gap: 2,
                    minWidth: "120px",
                    height: "36px",
                  }}
                  onClick={handleSave}
                  icon={<SaveIcon size={16} />}
                />
              </Stack>
            </>
          )}
        </Stack>
      </Drawer>

      {/* Alert Component */}
      {alert && (
        <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />
      )}
    </>
  );
};

export default NISTAIRMFDrawerDialog;

import React, { useState, useEffect } from "react";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
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
import {
  NISTAIRMFDrawerProps,
  NISTAIRMFStatus,
} from "../../../pages/Framework/NIST-AI-RMF/types";
import { AlertProps } from "../../../../domain/interfaces/iAlert";
import { updateEntityById } from "../../../../application/repository/entity.repository";
import { useAuth } from "../../../../application/hooks/useAuth";
import useUsers from "../../../../application/hooks/useUsers";
import { User } from "../../../../domain/types/User";
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

  const { userRoleName } = useAuth();
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

  const statusOptions = [
    { id: NISTAIRMFStatus.NOT_STARTED, name: "Not started" },
    { id: NISTAIRMFStatus.IN_PROGRESS, name: "In progress" },
    { id: NISTAIRMFStatus.IMPLEMENTED, name: "Implemented" },
    { id: NISTAIRMFStatus.REQUIRES_ATTENTION, name: "Requires attention" },
    { id: NISTAIRMFStatus.AUDITED, name: "Audited" },
    { id: NISTAIRMFStatus.NOT_APPLICABLE, name: "Not Applicable" },
  ];

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
        implementation_description: subcategory.implementation_description || "",
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
      const updateData = {
        id: subcategory.id,
        status: formData.status,
        owner: formData.owner ? parseInt(formData.owner) : null,
        reviewer: formData.reviewer ? parseInt(formData.reviewer) : null,
        approver: formData.approver ? parseInt(formData.approver) : null,
        due_date: date ? date.toISOString() : null,
        auditor_feedback: formData.auditor_feedback,
        implementation_description: formData.implementation_description,
        tags: formData.tags,
      };

      const response = await updateEntityById({
        routeUrl: `/nist-ai-rmf/subcategories/${subcategory.id}`,
        body: updateData,
      });

      if (response.status === 200) {
        setAlert({
          variant: "success",
          body: "Subcategory updated successfully",
        });
        setTimeout(() => setAlert(null), 3000);  // 3 seconds

        onSaveSuccess?.(true, "Subcategory updated successfully", subcategory.id);
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
      setTimeout(() => setAlert(null), 3000);  // 3 seconds
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

              {/* Description Section */}
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
                    Implementation Description:
                  </Typography>
                  <Field
                    type="description"
                    value={formData.implementation_description}
                    onChange={(e) =>
                      handleFieldChange("implementation_description", e.target.value)
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
                  value={formData.reviewer ? parseInt(formData.reviewer) : ""}
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
                  value={formData.approver ? parseInt(formData.approver) : ""}
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
                    Auditor Feedback:
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

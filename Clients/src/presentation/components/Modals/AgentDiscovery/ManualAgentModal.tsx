import React, { useState, useEffect, useCallback } from "react";
import {
  Drawer,
  Stack,
  Typography,
  Divider,
  IconButton,
  useTheme,
} from "@mui/material";
import { X } from "lucide-react";
import Field from "../../Inputs/Field";
import SelectComponent from "../../Inputs/Select";
import { CustomizableButton } from "../../button/customizable-button";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import { getAllEntities } from "../../../../application/repository/entity.repository";

interface ManualAgentModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSuccess: () => void;
}

const PRIMITIVE_TYPES = [
  { _id: "agent", name: "Agent" },
  { _id: "assistant", name: "Assistant" },
  { _id: "bot", name: "Bot" },
  { _id: "copilot", name: "Copilot" },
  { _id: "workflow", name: "Workflow" },
  { _id: "function", name: "Function" },
  { _id: "other", name: "Other" },
];

const ManualAgentModal: React.FC<ManualAgentModalProps> = ({
  isOpen,
  setIsOpen,
  onSuccess,
}) => {
  const theme = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    display_name: "",
    primitive_type: "",
    owner_id: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchUsers = useCallback(async () => {
    try {
      const response = await getAllEntities({ routeUrl: "/users" });
      const usersData = Array.isArray(response?.data) ? response.data : [];
      setUsers(
        usersData.map((u: { id: number; name: string; surname: string }) => ({
          _id: String(u.id),
          name: `${u.name} ${u.surname}`.trim(),
        }))
      );
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, fetchUsers]);

  const handleClose = () => {
    setIsOpen(false);
    setFormData({ display_name: "", primitive_type: "", owner_id: "", notes: "" });
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.display_name.trim()) {
      newErrors.display_name = "Display name is required";
    }
    if (!formData.primitive_type) {
      newErrors.primitive_type = "Type is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await apiServices.post("/agent-primitives", {
        display_name: formData.display_name.trim(),
        primitive_type: formData.primitive_type,
        owner_id: formData.owner_id.trim() || undefined,
        metadata: formData.notes.trim() ? { notes: formData.notes.trim() } : {},
      });
      handleClose();
      onSuccess();
    } catch (error) {
      console.error("Failed to create agent:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={handleClose}
      PaperProps={{ sx: { width: 440, backgroundColor: theme.palette.background.modal || "#FCFCFD" } }}
    >
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ p: "16px 24px" }}
      >
        <Typography fontSize={16} fontWeight={600}>
          Add agent manually
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <X size={20} />
        </IconButton>
      </Stack>

      <Divider />

      {/* Form content */}
      <Stack sx={{ p: "24px", gap: "20px", flex: 1, overflow: "auto" }}>
        <Field
          id="display_name"
          label="Display name"
          placeholder="e.g. Sales Assistant Bot"
          value={formData.display_name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, display_name: e.target.value }))
          }
          isRequired
          error={errors.display_name}
        />

        <SelectComponent
          id="primitive_type"
          label="Type"
          placeholder="Select type"
          value={formData.primitive_type}
          items={PRIMITIVE_TYPES}
          isRequired
          error={errors.primitive_type}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              primitive_type: e.target.value as string,
            }))
          }
        />

        <SelectComponent
          id="owner_id"
          label="Owner"
          placeholder="Select owner"
          value={formData.owner_id}
          items={users}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              owner_id: e.target.value as string,
            }))
          }
        />

        <Field
          id="notes"
          label="Notes"
          type="description"
          rows={2}
          placeholder="Any additional context about this agent"
          value={formData.notes}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
        />
      </Stack>

      {/* Footer */}
      <Divider />
      <Stack direction="row" justifyContent="flex-end" gap={1} sx={{ p: "16px 24px" }}>
        <CustomizableButton
          variant="outlined"
          sx={{ border: "1px solid #d0d5dd" }}
          onClick={handleClose}
        >
          Cancel
        </CustomizableButton>
        <CustomizableButton
          variant="contained"
          sx={{ backgroundColor: "#13715B", border: "1px solid #13715B" }}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Adding..." : "Add agent"}
        </CustomizableButton>
      </Stack>
    </Drawer>
  );
};

export default ManualAgentModal;

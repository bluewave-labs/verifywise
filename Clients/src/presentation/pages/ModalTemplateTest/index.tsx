import React, { useState } from "react";
import { Stack, Typography, Box } from "@mui/material";
import ModalTemplate from "../../components/Modals/ModalTemplate";
import CustomizableButton from "../../components/Button/CustomizableButton";
import Field from "../../components/Inputs/Field";
import SelectComponent from "../../components/Inputs/Select";

const ModalTemplateTest: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
  });

  const roleOptions = [
    { _id: "admin", name: "Admin" },
    { _id: "editor", name: "Editor" },
    { _id: "viewer", name: "Viewer" },
  ];

  const handleSubmit = () => {
    console.log("Form submitted:", formData);
    setIsModalOpen(false);
  };

  return (
    <Stack
      sx={{
        padding: "40px",
        minHeight: "100vh",
        backgroundColor: "#F9FAFB",
      }}
    >
      <Stack spacing={3} maxWidth="800px">
        <Typography variant="h4" fontWeight={600}>
          Modal Template Preview
        </Typography>

        <Typography color="#475467">
          This is a test page to preview the new modal template design. Click the button below to see the modal.
        </Typography>

        <Box>
          <CustomizableButton
            variant="contained"
            text="Open Modal Template"
            onClick={() => setIsModalOpen(true)}
            sx={{
              backgroundColor: "#13715B",
              "&:hover": {
                backgroundColor: "#0F5A47",
              },
            }}
          />
        </Box>

        <Stack spacing={2} sx={{ marginTop: "40px" }}>
          <Typography variant="h6" fontWeight={600}>
            Design Features:
          </Typography>
          <Stack component="ul" spacing={1} sx={{ paddingLeft: "20px" }}>
            <Typography component="li">
              <strong>Header Section:</strong> Light background (#F9FAFB) with bottom border (#EAECF0)
            </Typography>
            <Typography component="li">
              <strong>Title:</strong> 18px, semibold, dark text (#101828)
            </Typography>
            <Typography component="li">
              <strong>Description:</strong> 14px, regular, gray text (#475467)
            </Typography>
            <Typography component="li">
              <strong>Content Area:</strong> White background with 24px padding
            </Typography>
            <Typography component="li">
              <strong>Footer Section:</strong> Light background (#F9FAFB) with top border (#EAECF0)
            </Typography>
            <Typography component="li">
              <strong>Buttons:</strong> Right-aligned with proper spacing
            </Typography>
          </Stack>
        </Stack>
      </Stack>

      <ModalTemplate
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add a new user"
        description="Enter user details to create a new account with appropriate permissions"
        onSubmit={handleSubmit}
        submitButtonText="Create User"
        cancelButtonText="Cancel"
      >
        <Stack spacing={3}>
          {/* Sample Form Content */}
          <Field
            label="Full Name"
            width="100%"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter full name"
            isRequired
          />

          <Field
            label="Email Address"
            width="100%"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@example.com"
            isRequired
          />

          <SelectComponent
            id="role-select"
            label="Role"
            items={roleOptions}
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            placeholder="Select role"
            sx={{ width: "100%" }}
          />

          <Box
            sx={{
              padding: "16px",
              backgroundColor: "#F9FAFB",
              borderRadius: "8px",
              border: "1px solid #EAECF0",
            }}
          >
            <Typography fontSize={13} color="#475467">
              <strong>Note:</strong> This is sample content to demonstrate the modal template.
              The actual form fields and content will vary based on the specific use case.
            </Typography>
          </Box>
        </Stack>
      </ModalTemplate>
    </Stack>
  );
};

export default ModalTemplateTest;

import React from "react";
import { Modal, Stack, Box, Typography } from "@mui/material";
import { X as CloseIcon } from "lucide-react";
import CustomizableButton from "../../Button/CustomizableButton";

interface ModalTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  submitButtonText?: string;
  cancelButtonText?: string;
  isSubmitting?: boolean;
  maxWidth?: string;
}

const ModalTemplate: React.FC<ModalTemplateProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  onSubmit,
  submitButtonText = "Save",
  cancelButtonText = "Cancel",
  isSubmitting = false,
  maxWidth = "760px",
}) => {
  return (
    <Modal
      open={isOpen}
      onClose={(_event, reason) => {
        if (reason !== "backdropClick") {
          onClose();
        }
      }}
      sx={{ overflowY: "scroll" }}
    >
      <Stack
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "fit-content",
          minWidth: "600px",
          maxWidth: maxWidth,
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          overflow: "hidden",
          "&:focus": {
            outline: "none",
          },
        }}
      >
        {/* Header Section with Background */}
        <Stack
          sx={{
            backgroundColor: "#F9FAFB",
            borderBottom: "1px solid #EAECF0",
            padding: "20px 24px",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Stack spacing={0.5}>
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#101828",
                  lineHeight: "28px",
                }}
              >
                {title}
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: "#475467",
                  lineHeight: "20px",
                }}
              >
                {description}
              </Typography>
            </Stack>
            <Box
              component="span"
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClose();
                }
              }}
              sx={{
                cursor: "pointer",
                color: "#98A2B3",
                display: "flex",
                alignItems: "center",
                padding: "4px",
                borderRadius: "4px",
                "&:hover": {
                  backgroundColor: "#F2F4F7",
                },
              }}
            >
              <CloseIcon size={20} />
            </Box>
          </Stack>
        </Stack>

        {/* Content Section */}
        <Stack
          sx={{
            padding: "24px",
            flex: 1,
            overflow: "auto",
            maxHeight: "calc(80vh - 180px)",
          }}
        >
          {children}
        </Stack>

        {/* Footer Section with Background */}
        <Stack
          direction="row"
          justifyContent="flex-end"
          spacing={2}
          sx={{
            backgroundColor: "#F9FAFB",
            borderTop: "1px solid #EAECF0",
            padding: "16px 24px",
          }}
        >
          <CustomizableButton
            variant="outlined"
            text={cancelButtonText}
            onClick={onClose}
            sx={{
              minWidth: "80px",
              height: "40px",
              border: "1px solid #D0D5DD",
              color: "#344054",
              "&:hover": {
                backgroundColor: "#F9FAFB",
                border: "1px solid #D0D5DD",
              },
            }}
          />
          {onSubmit && (
            <CustomizableButton
              variant="contained"
              text={submitButtonText}
              onClick={onSubmit}
              isDisabled={isSubmitting}
              sx={{
                minWidth: "80px",
                height: "40px",
                backgroundColor: "#13715B",
                "&:hover": {
                  backgroundColor: "#0F5A47",
                },
              }}
            />
          )}
        </Stack>
      </Stack>
    </Modal>
  );
};

export default ModalTemplate;

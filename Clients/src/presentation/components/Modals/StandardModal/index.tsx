/**
 * StandardModal - A reusable modal component with consistent styling for form-based modals
 *
 * @component
 * @example
 * // Basic usage
 * <StandardModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Add new item"
 *   description="Fill in the details below to create a new item"
 *   onSubmit={handleSave}
 * >
 *   <Stack spacing={6}>
 *     <Field label="Name" value={name} onChange={handleChange} />
 *   </Stack>
 * </StandardModal>
 *
 * @example
 * // Advanced usage with all props
 * <StandardModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title={isEdit ? "Edit Item" : "Add New Item"}
 *   description="Provide detailed information about the item"
 *   onSubmit={handleSave}
 *   submitButtonText={isEdit ? "Update" : "Create"}
 *   cancelButtonText="Cancel"
 *   isSubmitting={isSubmitting}
 *   maxWidth="1000px"
 * >
 *   <Stack spacing={6}>
 *     <Stack direction="row" spacing={6}>
 *       <Field label="Name" width={220} />
 *       <Select label="Category" width={220} />
 *     </Stack>
 *   </Stack>
 * </StandardModal>
 *
 * Features:
 * - Gradient header with title and description
 * - Gradient footer with Cancel/Save buttons
 * - Content box with 16px border radius and subtle border
 * - ESC key to close
 * - Focus trapping for accessibility
 * - Backdrop click prevention
 * - Automatic scroll handling for long content
 * - Consistent 48px spacing (use spacing={6} in your content)
 * - 34px button height standard
 *
 * Design System:
 * - Header background: linear-gradient(180deg, #F8FAFB 0%, #F3F5F8 100%)
 * - Footer background: linear-gradient(180deg, #F3F5F8 0%, #F8FAFB 100%)
 * - Border color: #E0E4E9
 * - Title: 15px, weight 600
 * - Description: 12px, color #475467
 * - Content box: 16px border radius, white background
 * - Spacing: Use spacing={6} (48px) between form sections
 *
 * @see NewModelRisk - Example implementation
 * @see NewModelInventory - Example implementation
 * @see NewVendor - Example implementation
 * @see NewRisk - Example implementation
 */

import React from "react";
import { Modal, Stack, Box, Typography } from "@mui/material";
import { X as CloseIcon } from "lucide-react";
import CustomizableButton from "../../Button/CustomizableButton";

interface StandardModalProps {
  /** Controls whether the modal is visible */
  isOpen: boolean;

  /** Callback function called when modal should close (ESC key, X button, Cancel button) */
  onClose: () => void;

  /** Main title displayed in the header (15px, bold) */
  title: string;

  /** Descriptive text displayed below the title (12px, gray) */
  description: string;

  /** Form content to be rendered inside the modal. Wrap in <Stack spacing={6}> for consistent spacing */
  children: React.ReactNode;

  /** Optional callback called when Save/Submit button is clicked. If not provided, no submit button is shown */
  onSubmit?: () => void;

  /** Text for the submit button (default: "Save") */
  submitButtonText?: string;

  /** Text for the cancel button (default: "Cancel") */
  cancelButtonText?: string;

  /** When true, disables the submit button (useful during API calls) */
  isSubmitting?: boolean;

  /** Maximum width of the modal (default: "760px"). Use "800px" for wider forms, "1000px" for two-column layouts */
  maxWidth?: string;

  /** Custom footer content to replace default Cancel/Save buttons. Use for modals with special navigation like multi-step wizards */
  customFooter?: React.ReactNode;

  /** When true, hides the footer entirely. Use for read-only modals that don't need action buttons */
  hideFooter?: boolean;

  /** Optional custom actions to display in the header (e.g., history button). Rendered to the left of the close button */
  headerActions?: React.ReactNode;

  /** When true, expands the modal height for additional content. Default height is 630px, expanded uses min(740px, 90vh - 180px) */
  expandedHeight?: boolean;
}

const StandardModal: React.FC<StandardModalProps> = ({
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
  customFooter,
  hideFooter = false,
  headerActions,
  expandedHeight = false,
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
          transition: "max-width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          "&:focus": {
            outline: "none",
          },
        }}
      >
        {/* Header Section with Background */}
        <Stack
          sx={{
            background: "linear-gradient(180deg, #F8FAFB 0%, #F3F5F8 100%)",
            borderBottom: "1px solid #E0E4E9",
            padding: "16px 24px",
            paddingBottom: "36px",
            marginBottom: "-20px",
            zIndex: 0,
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
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#101828",
                  lineHeight: "28px",
                }}
              >
                {title}
              </Typography>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: "#475467",
                  lineHeight: "20px",
                }}
              >
                {description}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              {headerActions}
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
        </Stack>

        {/* Content Section */}
        <Box
          sx={{
            padding: "20px",
            flex: "0 1 auto",
            overflow: "auto",
            maxHeight: expandedHeight ? "min(740px, calc(90vh - 180px))" : "660px",
            border: "1px solid #E0E4E9",
            borderRadius: "16px",
            backgroundColor: "#FFFFFF",
            zIndex: 1,
            position: "relative",
          }}
          onWheelCapture={(e) => {
            const target = e.currentTarget;
            const atTop = target.scrollTop === 0;
            const atBottom = target.scrollHeight - target.scrollTop === target.clientHeight;

            // Only prevent propagation if we can actually scroll
            if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
              e.stopPropagation();
            } else if (!atTop && !atBottom) {
              // If we're in the middle, always stop propagation
              e.stopPropagation();
            }
          }}
        >
          {children}
        </Box>

        {/* Footer Section with Background */}
        {!hideFooter && (
          <Stack
            direction="row"
            justifyContent={customFooter ? "space-between" : "flex-end"}
            spacing={6}
            sx={{
              background: "linear-gradient(180deg, #F3F5F8 0%, #F8FAFB 100%)",
              borderTop: "1px solid #E0E4E9",
              padding: "12px 24px",
              paddingTop: "32px",
              marginTop: "-20px",
              zIndex: 0,
            }}
          >
            {customFooter ? (
              customFooter
            ) : (
              <>
                <CustomizableButton
                  variant="outlined"
                  text={cancelButtonText}
                  onClick={onClose}
                  sx={{
                    minWidth: "80px",
                    height: "34px",
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
                      height: "34px",
                      backgroundColor: "#13715B",
                      "&:hover:not(.Mui-disabled)": {
                        backgroundColor: "#0F5A47",
                      },
                      "&.Mui-disabled": {
                        backgroundColor: "#E5E7EB",
                        color: "#9CA3AF",
                        cursor: "not-allowed",
                      },
                    }}
                  />
                )}
              </>
            )}
          </Stack>
        )}
      </Stack>
    </Modal>
  );
};

export default StandardModal;

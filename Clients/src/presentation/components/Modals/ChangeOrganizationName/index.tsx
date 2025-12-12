/**
 * ChangeOrganizationNameModal - Modal for updating organization name on first login
 *
 * This modal appears when users first log in after registration, allowing them to
 * customize their auto-generated organization name (e.g., "John's Organization").
 *
 * @component
 * @example
 * <ChangeOrganizationNameModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   currentOrgName="John's Organization"
 *   onSuccess={() => console.log('Organization name updated')}
 * />
 */

import React, { useState, Suspense } from "react";
import { Stack } from "@mui/material";
import StandardModal from "../StandardModal";
import Field from "../../Inputs/Field";
import { UpdateMyOrganization } from "../../../../application/repository/organization.repository";
import { logEngine } from "../../../../application/tools/log.engine";
import useUsers from "../../../../application/hooks/useUsers";
import Alert from "../../Alert";

interface ChangeOrganizationNameModalProps {
  /** Controls whether the modal is visible */
  isOpen: boolean;

  /** Callback function called when modal should close */
  onClose: () => void;

  /** Current organization name (auto-generated) */
  currentOrgName: string;

  /** ID of the organization to update */
  organizationId: number;

  /** Callback function called when organization name is successfully updated */
  onSuccess?: () => void;
}

const ChangeOrganizationNameModal: React.FC<ChangeOrganizationNameModalProps> = ({
  isOpen,
  onClose,
  currentOrgName,
  organizationId,
  onSuccess,
}) => {
  // Start with empty field - user must explicitly enter organization name
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { users } = useUsers();
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  const handleSave = async () => {
    // Validate organization name
    if (!organizationName.trim()) {
      setError("Organization name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await UpdateMyOrganization({
        routeUrl: `/organizations/${organizationId}`,
        body: { name: organizationName.trim() },
      });

      logEngine({
        type: "info",
        message: `Organization name updated to: ${organizationName}`,
        users,
      });

      setAlert({
        variant: "success",
        body: "Organization name updated successfully!",
      });

      // Wait a moment before closing to show success message
      setTimeout(() => {
        setAlert(null);
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      logEngine({
        type: "error",
        message: `Failed to update organization name: ${(err as Error).message}`,
        users,
      });

      setAlert({
        variant: "error",
        body: "Failed to update organization name. Please try again.",
      });

      setTimeout(() => setAlert(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <>
      {alert && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant={alert.variant}
            title={alert.title}
            body={alert.body}
            isToast={true}
            onClick={() => setAlert(null)}
          />
        </Suspense>
      )}
      <StandardModal
        isOpen={isOpen}
        onClose={handleSkip}
        title="Name your organization"
        description="Enter a name for your organization to get started."
        onSubmit={handleSave}
        submitButtonText="Save"
        cancelButtonText="Skip for now"
        isSubmitting={isSubmitting || !organizationName.trim()}
        maxWidth="600px"
      >
        <Stack spacing={6}>
          <Field
            label="Organization name"
            isRequired
            placeholder="Enter your organization name"
            value={organizationName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setOrganizationName(e.target.value);
              setError("");
            }}
            error={error}
            disabled={isSubmitting}
          />
        </Stack>
      </StandardModal>
    </>
  );
};

export default ChangeOrganizationNameModal;

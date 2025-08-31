import { Stack, useTheme, Box, Divider, CircularProgress, Typography, Button as MUIButton } from "@mui/material";
import Field from "../../../components/Inputs/Field";
import CustomizableButton from "../../../vw-v2-components/Buttons";
import SaveIcon from "@mui/icons-material/Save";
import {
  useState,
  useCallback,
  ChangeEvent,
  useEffect,
  useContext,
  useRef,
} from "react";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import {
  CreateMyOrganization,
  GetMyOrganization,
  UpdateMyOrganization,
} from "../../../../application/repository/organization.repository";
import Alert from "../../../components/Alert";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import allowedRoles from "../../../../application/constants/permissions";
import DualButtonModal from "../../../vw-v2-components/Dialogs/DualButtonModal";
import { uploadAITrustCentreLogo, deleteAITrustCentreLogo } from "../../../../application/repository/aiTrustCentre.repository";
import { extractUserToken } from "../../../../application/tools/extractToken";
import { getAuthToken } from "../../../../application/redux/auth/getAuthToken";
import { apiServices } from "../../../../infrastructure/api/networkServices";

interface AlertState {
  variant: "success" | "info" | "warning" | "error";
  title?: string;
  body: string;
  isToast?: boolean;
}

const Organization = () => {
  const { userRoleName, organizationId } = useContext(VerifyWiseContext);
  const isEditingDisabled = !allowedRoles.organizations.edit.includes(userRoleName);
  const isCreatingDisabled = !allowedRoles.organizations.create.includes(userRoleName);

  // Organization states
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [organizationName, setOrganizationName] = useState("");
  const [organizationNameError, setOrganizationNameError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [organizationExists, setOrganizationExists] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Logo states
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoRemoving, setLogoRemoving] = useState(false);
  const [isRemoveLogoModalOpen, setIsRemoveLogoModalOpen] = useState(false);
  const [selectedLogoPreview, setSelectedLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const [alert, setAlert] = useState<AlertState | null>(null);

  // Utility function to show alerts
  const showAlert = useCallback((variant: AlertState['variant'], title: string, body: string) => {
    setAlert({ variant, title, body, isToast: false });
  }, []);

  // Utility function to clear preview and revoke URLs
  const clearLogoPreview = useCallback(() => {
    if (selectedLogoPreview) {
      URL.revokeObjectURL(selectedLogoPreview);
      setSelectedLogoPreview(null);
    }
  }, [selectedLogoPreview]);

  // Function to fetch logo and convert Buffer to Blob URL
  const fetchLogoAsBlobUrl = useCallback(async (tenantId: string): Promise<string | null> => {
    try {
      const authToken = getAuthToken();
      const response = await apiServices.get(`/aiTrustCentre/${tenantId}/logo`, {
        responseType: 'json',
        headers: { Authorization: `Bearer ${authToken}` }
      });

      const responseData = response.data as any;
      if (responseData?.data?.logo?.content?.data) {
        const bufferData = new Uint8Array(responseData.data.logo.content.data);
        const blob = new Blob([bufferData], { type: 'image/png' });
        return URL.createObjectURL(blob);
      }
      return null;
    } catch (error) {
      console.error('Error fetching logo:', error);
      return null;
    }
  }, []);

  // Fetch organization data and logo
  const fetchOrganization = useCallback(async () => {
    try {
      const organizations = await GetMyOrganization({
        routeUrl: `/organizations/${organizationId}`,
      });
      const org = organizations.data.data;
      setOrganizationName(org.name || "");
      setOrganizationExists(true);
      setHasChanges(false);

      // Fetch logo if organization exists
      if (org.id) {
        setLogoLoading(true);
        try {
          const authToken = getAuthToken();
          const tokenData = extractUserToken(authToken);
          const tenantId = tokenData?.tenantId;

          if (tenantId) {
            const logoBlobUrl = await fetchLogoAsBlobUrl(tenantId);
            if (logoBlobUrl) {
              setLogoUrl(logoBlobUrl);
            }
          }
        } catch (error) {
          console.log('No existing logo found or error fetching logo:', error);
        } finally {
          setLogoLoading(false);
        }
      }
    } catch (error) {
      setOrganizationExists(false);
      setOrganizationName("");
      setHasChanges(false);
    }
  }, [organizationId, fetchLogoAsBlobUrl]);

  // Handle organization name changes
  const handleOrganizationNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOrganizationName(value);
    setHasChanges(true);

    const validation = checkStringValidation("Organization name", value, 2, 50, false, false);
    setOrganizationNameError(validation.accepted ? null : validation.message);
    setIsSaveDisabled(!value.trim() || !validation.accepted);
  }, []);

  // Handle logo file selection and upload
  const handleLogoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      showAlert("error", "Invalid File", 'Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showAlert("error", "File Too Large", 'File size must be less than 5MB');
      return;
    }

    // Create preview and upload
    const previewUrl = URL.createObjectURL(file);
    setSelectedLogoPreview(previewUrl);
    setLogoUploading(true);

    try {
      const response = await uploadAITrustCentreLogo(file);

      if (response?.data?.logo) {
        const authToken = getAuthToken();
        const tokenData = extractUserToken(authToken);
        const tenantId = tokenData?.tenantId;

        if (tenantId) {
          const logoBlobUrl = await fetchLogoAsBlobUrl(tenantId);
          if (logoBlobUrl) {
            setLogoUrl(logoBlobUrl);
            showAlert("success", "Logo Uploaded", response.data.message || "Organization logo uploaded successfully");
          } else {
            showAlert("error", "Upload Failed", 'Failed to load uploaded logo');
          }
        } else {
          showAlert("error", "Upload Failed", 'Failed to get tenant information');
        }
      }
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      showAlert("error", "Upload Failed", error.message || 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
      clearLogoPreview();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [fetchLogoAsBlobUrl, showAlert, clearLogoPreview]);

  // Logo removal handlers
  const handleRemoveLogo = useCallback(() => setIsRemoveLogoModalOpen(true), []);
  const handleRemoveLogoCancel = useCallback(() => setIsRemoveLogoModalOpen(false), []);

  const handleRemoveLogoConfirm = useCallback(async () => {
    setLogoRemoving(true);
    try {
      await deleteAITrustCentreLogo();

      // Clear logo and previews
      if (logoUrl && logoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoUrl);
      }
      setLogoUrl(null);
      clearLogoPreview();

      setIsRemoveLogoModalOpen(false);
      showAlert("success", "Logo Removed", "Organization logo removed successfully");
    } catch (error) {
      console.error('Error removing logo:', error);
      showAlert("error", "Remove Failed", 'Failed to remove logo. Please try again.');
    } finally {
      setLogoRemoving(false);
    }
  }, [logoUrl, clearLogoPreview, showAlert]);

  // Organization CRUD handlers
  const handleCreate = useCallback(async () => {
    if (!organizationName.trim() || organizationNameError) {
      console.log("Validation error: Organization name is required or invalid");
      return;
    }

    setIsLoading(true);
    try {
      const response = await CreateMyOrganization({
        routeUrl: "/organizations",
        body: { name: organizationName },
      });

      showAlert("success", "Organization Created", "The organization was created successfully.");

      if (response && response.id) {
        setOrganizationName(response.name || "");
        setOrganizationExists(true);
        setHasChanges(false);
      }
      await fetchOrganization();
    } catch (error) {
      showAlert("error", "Error", "Failed to create organization.");
    } finally {
      setTimeout(() => setIsLoading(false), 1500);
    }
  }, [organizationName, organizationNameError, fetchOrganization, showAlert]);

  const handleUpdate = useCallback(async () => {
    if (!organizationName.trim() || organizationNameError || !organizationId) {
      console.log("Validation error: Organization name is required, invalid, or no organization ID");
      return;
    }

    setIsLoading(true);
    try {
      const response = await UpdateMyOrganization({
        routeUrl: `/organizations/${organizationId}`,
        body: { name: organizationName },
      });

      showAlert("success", "Organization Updated", "The organization was updated successfully.");

      if (response && response.id) {
        setOrganizationName(response.name || "");
        setHasChanges(false);
      }
      await fetchOrganization();
    } catch (error) {
      showAlert("error", "Error", "Failed to update organization.");
    } finally {
      setTimeout(() => setIsLoading(false), 1500);
    }
  }, [organizationName, organizationNameError, organizationId, fetchOrganization, showAlert]);

  // Effects
  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Cleanup function to revoke object URLs when component unmounts
  useEffect(() => {
    return () => {
      clearLogoPreview();
      if (logoUrl && logoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoUrl);
      }
    };
  }, [clearLogoPreview, logoUrl]);

  return (
    <Stack className="organization-container" sx={{ mt: 3, maxWidth: 790 }}>
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={false}
          onClick={() => setAlert(null)}
        />
      )}
      <Stack
        className="organization-form"
        sx={{ pt: theme.spacing(20) }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: { xs: "column", md: "row" },
            mb: 3,
            width: "100%",
          }}
        >
          {/* Organization Name Section */}
          <Stack sx={{ width: { xs: "100%", md: "40%" } }}>
            <Field
              id="Organization name"
              label="Organization name"
              value={organizationName}
              onChange={handleOrganizationNameChange}
              sx={{ mb: 2, backgroundColor: "#FFFFFF" }}
              error={organizationNameError || undefined}
              disabled={isEditingDisabled}
              placeholder="e.g. My Organization"
            />
            <CustomizableButton
              variant="contained"
              text="Save"
              sx={{
                width: 90,
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 2,
                mt: 3,
              }}
              icon={
                isLoading ? (
                  <CircularProgress size={20} sx={{ color: "#13715B" }} />
                ) : (
                  <SaveIcon />
                )
              }
              onClick={organizationExists ? handleUpdate : handleCreate}
              isDisabled={
                isSaveDisabled ||
                !!organizationNameError ||
                (organizationExists ? isEditingDisabled : isCreatingDisabled) ||
                (!hasChanges && organizationExists) ||
                isLoading
              }
            />
          </Stack>

          {/* Organization Logo Section */}
          <Stack sx={{ width: { xs: "100%", md: "40%", alignItems: 'center' } }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 1 }}>
              Organization Logo
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{
                width: 100,
                height: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: '2px dashed #ddd',
                backgroundColor: '#fafafa',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  borderColor: '#999',
                  backgroundColor: '#f5f5f5'
                }
              }}>
                {logoUploading || logoLoading ? (
                  <CircularProgress size={24} />
                ) : selectedLogoPreview ? (
                  <Box
                    component="img"
                    src={selectedLogoPreview}
                    alt="Selected Logo Preview"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: 1
                    }}
                  />
                ) : logoUrl ? (
                  <Box
                    component="img"
                    src={logoUrl}
                    alt="Organization Logo"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: 1
                    }}
                  />
                ) : (
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Typography sx={{ fontSize: 10, color: '#888', textAlign: 'center' }}>
                      Logo
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <MUIButton
                variant="text"
                sx={{
                  fontSize: 12,
                  textTransform: 'none',
                  color: logoUrl ? '#666' : '#ccc',
                  '&:hover': {
                    backgroundColor: logoUrl ? 'rgba(102, 102, 102, 0.04)' : 'transparent'
                  }
                }}
                onClick={handleRemoveLogo}
                disabled={!logoUrl || logoRemoving || logoUploading || logoLoading}
              >
                {logoRemoving ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Removing...
                  </>
                ) : (
                  'Delete'
                )}
              </MUIButton>
              <MUIButton
                variant="text"
                component="label"
                disableRipple
                sx={{
                  fontSize: 12,
                  textTransform: 'none',
                  color: '#13715B',
                  '&:hover': {
                    backgroundColor: 'transparent !important'
                  },
                  '&:active': {
                    backgroundColor: 'transparent !important'
                  }
                }}
                disabled={logoUploading || logoLoading}
              >
                {logoUploading ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Uploading...
                  </>
                ) : logoLoading ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Loading...
                  </>
                ) : (
                  'Update'
                )}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                />
              </MUIButton>
            </Box>
            {/* Logo requirements info */}
            <Typography
              sx={{
                fontSize: 11,
                color: '#666',
                textAlign: 'center',
                mt: 1,
                lineHeight: 1.4
              }}
            >
              Recommended: 200×200px • Max size: 5MB • Formats: PNG, JPG, GIF
            </Typography>
          </Stack>
        </Box>
        <Divider sx={{ borderColor: "#C2C2C2", mt: theme.spacing(3) }} />
      </Stack>

      {/* Remove Logo Confirmation Modal */}
      {isRemoveLogoModalOpen && (
        <DualButtonModal
          title="Confirm Logo Removal"
          body={
            <Typography fontSize={13}>
              Are you sure you want to remove the organization logo? This action cannot be undone.
            </Typography>
          }
          cancelText="Cancel"
          proceedText={logoRemoving ? "Removing..." : "Remove"}
          onCancel={handleRemoveLogoCancel}
          onProceed={handleRemoveLogoConfirm}
          proceedButtonColor="error"
          proceedButtonVariant="contained"
          TitleFontSize={0}
        />
      )}
    </Stack>
  );
};

export default Organization;

import {
  Stack,
  useTheme,
  Box,
  Divider,
  CircularProgress,
  Button,
  Typography,
} from "@mui/material";
import Field from "../../../components/Inputs/Field";
import CustomizableButton from "../../../vw-v2-components/Buttons";
import SaveIcon from "@mui/icons-material/Save";
import {
  useState,
  useCallback,
  ChangeEvent,
  useEffect,
  useContext,
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
// import FileUploadModal from "../../../components/Modals/FileUpload";

interface AlertState {
  variant: "success" | "info" | "warning" | "error";
  title?: string;
  body: string;
  isToast?: boolean;
}

const Organization = () => {
  const { userRoleName, organizationData, setOrganizationData } =
    useContext(VerifyWiseContext);
  const isEditingDisabled =
    !allowedRoles.organizations.edit.includes(userRoleName);
  const isCreatingDisabled =
    !allowedRoles.organizations.create.includes(userRoleName);
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [organizationName, setOrganizationName] = useState("");
  const [organizationNameError, setOrganizationNameError] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [organizationExists, setOrganizationExists] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  //logo
  const [organizationLogo, setOrganizationLogo] = useState<File | null>(null);
  const [organizationLogoUrl, setOrganizationLogoUrl] = useState<string | null>(
    null
  );
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchOrganization = useCallback(async () => {
    try {
      const organizations = await GetMyOrganization({
        routeUrl: "/organizations",
      });
      if (
        Array.isArray(organizations.data.data) &&
        organizations.data.data.length > 0
      ) {
        const org = organizations.data.data[0];
        setOrganizationId(org.id);
        setOrganizationName(org.name || "");
        setOrganizationLogoUrl(org.logo || null);
        setOrganizationExists(true);
        setHasChanges(false);

        if (setOrganizationData) {
          setOrganizationData(org);
        }
      } else {
        setOrganizationExists(false);
        setOrganizationId(null);
        setOrganizationName("");
        setOrganizationLogoUrl(null);
        setHasChanges(false);

        if (setOrganizationData) {
          setOrganizationData(null);
        }
      }
    } catch (error) {
      setOrganizationExists(false);
      setOrganizationId(null);
      setOrganizationName("");
      setOrganizationLogoUrl(null);
      setHasChanges(false);

      if (setOrganizationData) {
        setOrganizationData(null);
      }
    }
  }, [setOrganizationData]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleOrganizationNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setOrganizationName(value);
      setHasChanges(true);

      const validation = checkStringValidation(
        "Organization name",
        value,
        2,
        50,
        false,
        false
      );
      setOrganizationNameError(validation.accepted ? null : validation.message);
      setIsSaveDisabled(!value.trim() || !validation.accepted);
    },
    []
  );

  const handleCreate = async () => {
    if (!organizationName.trim()) {
      console.log("Validation error: Organization name is required");
      return;
    }
    if (organizationNameError) {
      console.log("Validation error:", organizationNameError);
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", organizationName);
      if (organizationLogo) {
        formData.append("logo", organizationLogo);
      }

      const response = await CreateMyOrganization({
        routeUrl: "/organizations",
        body: formData,
        headers: {},
      });
      setAlert({
        variant: "success",
        title: "Organization Created",
        body: "The organization was created successfully.",
        isToast: false,
      });
      if (response && response.id) {
        setOrganizationId(response.id);
        setOrganizationName(response.name || "");
        setOrganizationExists(true);
        setHasChanges(false);
      }
      await fetchOrganization();
    } catch (error) {
      setAlert({
        variant: "error",
        title: "Error",
        body: "Failed to create organization.",
        isToast: false,
      });
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  };

  const handleUpdate = async () => {
    if (!organizationName.trim()) {
      console.log("Validation error: Organization name is required");
      return;
    }
    if (organizationNameError) {
      console.log("Validation error:", organizationNameError);
      return;
    }
    if (!organizationId) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", organizationName);
      if (organizationLogo) {
        formData.append("logo", organizationLogo);
      }

      const response = await UpdateMyOrganization({
        routeUrl: `/organizations/${organizationId}`,
        body: formData,
        headers: {},
      });
      setAlert({
        variant: "success",
        title: "Organization Updated",
        body: "The organization was updated successfully.",
        isToast: false,
      });
      if (response && response.id) {
        setOrganizationId(response.id);
        setOrganizationName(response.name || "");
        setOrganizationLogoUrl(response.logo || null);
        setHasChanges(false);

        if (setOrganizationData) {
          setOrganizationData(response);
        }
      }
      await fetchOrganization();
    } catch (error) {
      setAlert({
        variant: "error",
        title: "Error",
        body: "Failed to update organization.",
        isToast: false,
      });
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  };

  const handleDeleteLogo = async () => {
    if (!organizationId) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", organizationName);
      formData.append("logo", "");

      await UpdateMyOrganization({
        routeUrl: `/organizations/${organizationId}`,
        body: formData,
        headers: {},
      });
      setOrganizationLogo(null);
      setOrganizationLogoUrl(null);
      setHasChanges(false);

      if (setOrganizationData && organizationData) {
        const updatedOrg = { ...organizationData, logo: undefined };
        setOrganizationData(updatedOrg);
      }

      setAlert({
        variant: "success",
        title: "Logo Deleted",
        body: "The organization logo was deleted successfully.",
        isToast: false,
      });

      await fetchOrganization();
    } catch (error) {
      setAlert({
        variant: "error",
        title: "Error",
        body: "Failed to delete logo.",
        isToast: false,
      });
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  };

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
        sx={{
          pt: theme.spacing(20),
        }}
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
          {/* logo display and actions */}
          <Stack
            sx={{
              width: { xs: "100%", md: "50%" },
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Organization Logo
            </Typography>

            {organizationLogoUrl ? (
              <img
                src={organizationLogoUrl}
                alt="Organization Logo"
                style={{
                  width: 120,
                  height: 120,
                  objectFit: "cover",
                  border: "2px solid #e0e0e0",
                  borderRadius: "50%",
                  marginBottom: 16,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  border: "2px dashed #ccc",
                  borderRadius: "50%",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#888",
                  backgroundColor: "#f9f9f9",
                }}
              >
                No Logo
              </Box>
            )}

            {/* Buttons */}
            <Stack direction="row" spacing={2}>
              <Button
                color="primary"
                size="small"
                onClick={handleDeleteLogo}
                disabled={!organizationLogoUrl || isLoading}
                sx={{
                  color: "#000000",
                  border: "1px solid #e0e0e0",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                    border: "1px solid #d0d0d0",
                  },
                  "&:disabled": {
                    color: "#ccc",
                    border: "1px solid #e0e0e0",
                  },
                }}
              >
                Delete
              </Button>
              <Button
                color="primary"
                onClick={() => setIsUploadModalOpen(true)}
                size="small"
                disabled={isLoading}
                sx={{
                  backgroundColor: "#0f604d",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#0d5043",
                  },
                  "&:disabled": {
                    backgroundColor: "#ccc",
                  },
                }}
              >
                Update
              </Button>
            </Stack>
          </Stack>
        </Box>
        <Divider sx={{ borderColor: "#C2C2C2", mt: theme.spacing(3) }} />
      </Stack>
      {/* File Upload Modal */}
      {/* <FileUploadModal
        uploadProps={{
          open: isUploadModalOpen,
          onClose: () => setIsUploadModalOpen(false),
          onFileChanged: (file: File) => {
            console.log("file selected:", file);
            setOrganizationLogo(file);
            setOrganizationLogoUrl(URL.createObjectURL(file));
            setHasChanges(true);
            setIsUploadModalOpen(false);
          },
          allowedFileTypes: [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/gif",
          ],
        }}
      /> */}
      {/* temorary simple input for testing  */}
      {isUploadModalOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setIsUploadModalOpen(false)}
        >
          <Box
            sx={{
              backgroundColor: "white",
              padding: 4,
              borderRadius: 2,
              minWidth: 300,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" gutterBottom>
              Upload Logo
            </Typography>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  console.log("file selected:", file);
                  setOrganizationLogo(file);
                  setOrganizationLogoUrl(URL.createObjectURL(file));
                  setHasChanges(true);
                  setIsUploadModalOpen(false);
                }
              }}
            />
            <Button onClick={() => setIsUploadModalOpen(false)} sx={{ mt: 2 }}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </Stack>
  );
};

export default Organization;

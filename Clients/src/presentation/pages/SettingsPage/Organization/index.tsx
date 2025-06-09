import { Stack, useTheme, Box, Divider, CircularProgress } from "@mui/material";
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

interface AlertState {
  variant: "success" | "info" | "warning" | "error";
  title?: string;
  body: string;
  isToast?: boolean;
}

const Organization = () => {
  const { userRoleName } = useContext(VerifyWiseContext);
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
        setOrganizationExists(true);
        setHasChanges(false);
      } else {
        setOrganizationExists(false);
        setOrganizationId(null);
        setOrganizationName("");
        setHasChanges(false);
      }
    } catch (error) {
      setOrganizationExists(false);
      setOrganizationId(null);
      setOrganizationName("");
      setHasChanges(false);
    }
  }, []);

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
      const response = await CreateMyOrganization({
        routeUrl: "/organizations",
        body: {
          name: organizationName,
        },
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
      const response = await UpdateMyOrganization({
        routeUrl: `/organizations/${organizationId}`,
        body: {
          name: organizationName,
        },
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
        setHasChanges(false);
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
        </Box>
        <Divider sx={{ borderColor: "#C2C2C2", mt: theme.spacing(3) }} />
      </Stack>
    </Stack>
  );
};

export default Organization;

import {
  Stack,
  useTheme,
  Typography,
  Box,
  Divider,
  Tooltip,
} from "@mui/material";
import Field from "../../../components/Inputs/Field";
import CustomizableButton from "../../../vw-v2-components/Buttons";
import SaveIcon from "@mui/icons-material/Save";
import {
  useState,
  useRef,
  useCallback,
  ChangeEvent,
  useEffect,
  useContext,
} from "react";
import Avatar from "../../../components/Avatar/VWAvatar/index";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import {
  CreateMyOrganization,
  GetMyOrganization,
  UpdateMyOrganization,
} from "../../../../application/repository/organization.repository";
import CustomizableToast from "../../../vw-v2-components/Toast";
import Alert from "../../../components/Alert";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import allowedRoles from "../../../../application/constants/permissions";

interface OrganizationData {
  firstname: string;
  lastname: string;
  email: string;
  pathToImage: string;
}

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
  const [organizationLogo, setOrganizationLogo] = useState<string>(
    "/placeholder.svg?height=80&width=80"
  );
  const [showToast, setShowToast] = useState(false);
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
        setOrganizationLogo(org.logo || "/placeholder.svg?height=80&width=80");
        setOrganizationExists(true);
        setHasChanges(false);
      } else {
        setOrganizationExists(false);
        setOrganizationId(null);
        setOrganizationName("");
        setOrganizationLogo("/placeholder.svg?height=80&width=80");
        setHasChanges(false);
      }
    } catch (error) {
      setOrganizationExists(false);
      setOrganizationId(null);
      setOrganizationName("");
      setOrganizationLogo("/placeholder.svg?height=80&width=80");
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

    setShowToast(true);
    try {
      const response = await CreateMyOrganization({
        routeUrl: "/organizations",
        body: {
          name: organizationName,
          logo:
            organizationLogo !== "/placeholder.svg?height=80&width=80"
              ? organizationLogo
              : null,
        },
      });
      setShowToast(false);
      setAlert({
        variant: "success",
        title: "Organization Created",
        body: "The organization was created successfully.",
        isToast: false,
      });
      if (response && response.id) {
        setOrganizationId(response.id);
        setOrganizationName(response.name || "");
        setOrganizationLogo(
          response.logo || "/placeholder.svg?height=80&width=80"
        );
        setOrganizationExists(true);
        setHasChanges(false);
      }
      await fetchOrganization();
    } catch (error) {
      setShowToast(false);
      setAlert({
        variant: "error",
        title: "Error",
        body: "Failed to create organization.",
        isToast: false,
      });
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

    setShowToast(true);
    try {
      const response = await UpdateMyOrganization({
        routeUrl: `/organizations/${organizationId}`,
        body: {
          name: organizationName,
          logo:
            organizationLogo !== "/placeholder.svg?height=80&width=80"
              ? organizationLogo
              : null,
        },
      });
      setShowToast(false);
      setAlert({
        variant: "success",
        title: "Organization Updated",
        body: "The organization was updated successfully.",
        isToast: false,
      });
      if (response && response.id) {
        setOrganizationId(response.id);
        setOrganizationName(response.name || "");
        setOrganizationLogo(
          response.logo || "/placeholder.svg?height=80&width=80"
        );
        setHasChanges(false);
      }
      await fetchOrganization();
    } catch (error) {
      setShowToast(false);
      setAlert({
        variant: "error",
        title: "Error",
        body: "Failed to update organization.",
        isToast: false,
      });
    }
  };

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const file = event.target.files?.[0];
      if (file) {
        const newLogoUrl = URL.createObjectURL(file);
        setOrganizationLogo(newLogoUrl);
        setHasChanges(true);
      }
    },
    []
  );

  const handleUpdateLogo = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  const handleDeleteLogo = useCallback((): void => {
    setOrganizationLogo("/placeholder.svg?height=80&width=80");
    setHasChanges(true);
  }, []);

  const organizationData: OrganizationData = {
    firstname: organizationName
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join(""),
    lastname: "",
    email: "",
    pathToImage: organizationLogo,
  };

  return (
    <Stack className="organization-container" sx={{ mt: 3, maxWidth: 790 }}>
      {showToast && <CustomizableToast />}
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
              icon={<SaveIcon />}
              onClick={organizationExists ? handleUpdate : handleCreate}
              isDisabled={
                isSaveDisabled ||
                !!organizationNameError ||
                (organizationExists ? isEditingDisabled : isCreatingDisabled) ||
                (!hasChanges && organizationExists)
              }
            />
          </Stack>
          <Box
            sx={{
              textAlign: { xs: "left", md: "center" },
              pb: theme.spacing(10),
            }}
          >
            <Stack
              direction="column"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
            >
              <Typography
                fontWeight="600"
                variant="subtitle1"
                color="#344054"
                pb={theme.spacing(5)}
              >
                Organization Logo
              </Typography>
              <Avatar
                user={organizationData}
                size="large"
                sx={{ width: 100, height: 100 }}
              />
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleFileChange}
                disabled={isEditingDisabled}
              />
              <Stack
                direction="row"
                spacing={2}
                alignItems={"center"}
                sx={{ paddingTop: theme.spacing(10) }}
              >
                <Tooltip
                  title="Only administrators are permitted to delete the organization's logo."
                  disableHoverListener={!isEditingDisabled}
                >
                  <span>
                    <Typography
                      sx={{
                        color: "#667085",
                        cursor: isEditingDisabled ? "not-allowed" : "pointer",
                        textDecoration: "none",
                        "&:hover": {
                          textDecoration: isEditingDisabled
                            ? "none"
                            : "underline",
                        },
                        fontSize: 13,
                        opacity: isEditingDisabled ? 0.6 : 1,
                      }}
                      onClick={isEditingDisabled ? undefined : handleDeleteLogo}
                    >
                      Delete
                    </Typography>
                  </span>
                </Tooltip>
                <Tooltip
                  title="Only administrators are permitted to update the organization's logo."
                  disableHoverListener={!isEditingDisabled}
                >
                  <span>
                    <Typography
                      sx={{
                        color: "#13715B",
                        cursor: isEditingDisabled ? "not-allowed" : "pointer",
                        textDecoration: "none",
                        "&:hover": {
                          textDecoration: isEditingDisabled
                            ? "none"
                            : "underline",
                        },
                        paddingLeft: theme.spacing(5),
                        fontSize: 13,
                        opacity: isEditingDisabled ? 0.6 : 1,
                      }}
                      onClick={isEditingDisabled ? undefined : handleUpdateLogo}
                    >
                      Update
                    </Typography>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>
        </Box>
        <Divider sx={{ borderColor: "#C2C2C2", mt: theme.spacing(3) }} />
      </Stack>
    </Stack>
  );
};

export default Organization;

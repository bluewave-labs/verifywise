import {
  Stack,
  useTheme,
  Box,
  CircularProgress,
  Typography,
  IconButton,
  Chip,
} from "@mui/material";
import { useState, useCallback, useEffect } from "react";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import { Plus as PlusIcon, Trash2 as DeleteIcon, Copy as CopyIcon } from "lucide-react";
import Alert from "../../../components/Alert";
import DualButtonModal from "../../../components/Dialogs/DualButtonModal";
import Field from "../../../components/Inputs/Field";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import { createApiToken, deleteApiToken, getApiTokens } from "../../../../application/repository/tokens.repository";
import allowedRoles from "../../../../application/constants/permissions";
import { useAuth } from "../../../../application/hooks/useAuth";
import { alertState } from "../../../../domain/interfaces/iAlert";

interface ApiToken {
  id: number;
  name: string;
  token?: string;
  expires_at: string;
  created_at: string;
  created_by: number;
}

const ApiKeys = () => {
  const { userRoleName } = useAuth();
  const theme = useTheme();
  const isDisabled = !allowedRoles.apiKeys?.manage?.includes(userRoleName);

  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<ApiToken | null>(null);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenNameError, setNewTokenNameError] = useState<string | null>(null);
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);
  const [alert, setAlert] = useState<alertState | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<number | null>(null);
  const [hoveredTokenId, setHoveredTokenId] = useState<number | null>(null);

  const showAlert = useCallback(
    (variant: alertState["variant"], title: string, body: string) => {
      setAlert({ variant, title, body });
    },
    []
  );

  const fetchTokens = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getApiTokens({ routeUrl: "/tokens" });
      if (response && response.data && response.data.data) {
        setTokens(response.data.data);
      }
    } catch (error) {
      showAlert("error", "Error", "Failed to fetch API tokens");
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleTokenNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewTokenName(value);

    const validation = checkStringValidation("Token name", value, 3, 50, false, false);
    setNewTokenNameError(validation.accepted ? null : validation.message);
  }, []);

  const handleCreateToken = useCallback(async () => {
    if (!newTokenName.trim() || newTokenNameError || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await createApiToken({
        routeUrl: "/tokens",
        body: { name: newTokenName },
      });

      if (response && response.data && response.data.data) {
        const createdToken = response.data.data;
        setNewlyCreatedToken(createdToken.token || null);
        await fetchTokens();
        setNewTokenName("");
        setNewTokenNameError(null);
      }
    } catch (error) {
      // Extract more specific error message from response
      let errorMessage = "Failed to create API token";

      // Handle CustomException objects (thrown by networkServices.ts)
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as any).message;
        if (typeof message === 'string') {
          errorMessage = message;
        }
      }
      // Handle HTTP response errors
      else if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        } else if (response?.data?.error) {
          errorMessage = response.data.error;
        } else if (response?.data?.data) {
          // Sometimes the message is nested in data.data
          errorMessage = response.data.data;
        } else if (response?.status === 409) {
          errorMessage = "A token with this name already exists. Please use a different name.";
        } else if (response?.status === 400) {
          errorMessage = "Invalid token name. Please check your input and try again.";
        } else if (response?.status === 429) {
          errorMessage = "You have reached the maximum number of API tokens allowed.";
        } else if (response?.status >= 500) {
          errorMessage = "Server error occurred while creating API token. Please try again later.";
        }
      }

      // Only log unexpected errors to console, not business rule violations
      if (!errorMessage.includes("Token limit reached") && !errorMessage.includes("already exists")) {
        console.error("Unexpected API token creation error:", error);
      }

      showAlert("error", "Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [newTokenName, newTokenNameError, isLoading, fetchTokens, showAlert]);

  const isCreateButtonDisabled = !newTokenName.trim() || !!newTokenNameError || isLoading;

  const handleDeleteToken = useCallback(async () => {
    if (!tokenToDelete) return;

    setIsLoading(true);
    try {
      await deleteApiToken({
        routeUrl: `/tokens/${tokenToDelete.id}`,
      });

      showAlert("success", "Token Deleted", "API token deleted successfully");
      await fetchTokens();
      setIsDeleteModalOpen(false);
      setTokenToDelete(null);
    } catch (error) {
      showAlert("error", "Error", "Failed to delete API token");
    } finally {
      setIsLoading(false);
    }
  }, [tokenToDelete, fetchTokens, showAlert]);

  const handleCopyToken = useCallback((token: string, tokenId: number) => {
    navigator.clipboard.writeText(token);
    setCopiedTokenId(tokenId);
    setTimeout(() => setCopiedTokenId(null), 2000);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setNewTokenName("");
    setNewTokenNameError(null);
    setNewlyCreatedToken(null);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isTokenExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  return (
    <Stack sx={{ mt: 3, maxWidth: 1000 }}>
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={false}
          onClick={() => setAlert(null)}
        />
      )}

      <Stack sx={{ pt: theme.spacing(20) }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#000000" }}>
                API Keys
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#666666", mt: 0.5, mb: 3 }}>
                Manage your API keys for programmatic access to VerifyWise features
              </Typography>
            </Box>
            {tokens.length > 0 && (
              <CustomizableButton
                variant="contained"
                text="Create new key"
                icon={<PlusIcon size={16} />}
                onClick={() => setIsCreateModalOpen(true)}
                isDisabled={isDisabled}
                sx={{
                  backgroundColor: "#13715B",
                  color: "#fff",
                  "&:hover": { backgroundColor: "#0e5c47" },
                }}
              />
            )}
          </Box>

        {isLoading && tokens.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : tokens.length === 0 ? (
          <Box
            sx={{
              border: "2px dashed #e5e7eb",
              borderRadius: "12px",
              p: 6,
              textAlign: "center",
              backgroundColor: "#fafbfc",
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "#f0fdf4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                mb: 2,
              }}
            >
              <PlusIcon size={24} color="#13715B" />
            </Box>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#000000", mb: 1 }}>
              No API keys yet
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#666666", mb: 3 }}>
              Create your first API key to enable programmatic access to your account
            </Typography>
            <CustomizableButton
              variant="contained"
              text="Create API key"
              icon={<PlusIcon size={16} />}
              onClick={() => setIsCreateModalOpen(true)}
              isDisabled={isDisabled}
              sx={{
                backgroundColor: "#13715B",
                color: "#fff",
                "&:hover": { backgroundColor: "#0e5c47" },
              }}
            />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {tokens.map((token) => (
              <Box
                key={token.id}
                onMouseEnter={() => setHoveredTokenId(token.id)}
                onMouseLeave={() => setHoveredTokenId(null)}
                sx={{
                  border: "1.5px solid #eaecf0",
                  borderRadius: "4px",
                  p: 4,
                  backgroundColor: hoveredTokenId === token.id ? "#f8fffe" : "#ffffff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.2s ease-in-out",
                  cursor: "default",
                  boxShadow: hoveredTokenId === token.id ? "0 2px 8px rgba(19, 113, 91, 0.08)" : "none",
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#000000",
                    mb: 2,
                    letterSpacing: "0.01em",
                  }}>
                    {token.name}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Chip
                      label={isTokenExpired(token.expires_at) ? "Expired" : "Active"}
                      sx={{
                        backgroundColor: isTokenExpired(token.expires_at) ? "#ffebee" : "#c8e6c9",
                        color: isTokenExpired(token.expires_at) ? "#d32f2f" : "#388e3c",
                        fontWeight: 500,
                        fontSize: "11px",
                        height: "20px",
                        borderRadius: "4px",
                        "& .MuiChip-label": {
                          padding: "0 8px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        },
                      }}
                    />
                    <Typography sx={{ fontSize: 12, color: "#999999" }}>
                      •
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#444444" }}>
                      Created {formatDate(token.created_at)}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#999999" }}>
                      •
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#444444" }}>
                      {isTokenExpired(token.expires_at) ? "Expired" : "Expires"} {formatDate(token.expires_at)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <IconButton
                    onClick={() => {
                      setTokenToDelete(token);
                      setIsDeleteModalOpen(true);
                    }}
                    disableRipple
                    disabled={isDisabled}
                    sx={{
                      color: "#DC2626",
                      opacity: hoveredTokenId === token.id ? 1 : 0.6,
                      transition: "opacity 0.2s ease-in-out",
                      "&:hover": {
                        backgroundColor: "#FEF2F2",
                      },
                      "&:disabled": {
                        opacity: 0.3,
                      },
                    }}
                  >
                    <DeleteIcon size={18} />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Stack>

      {/* Create Token Modal */}
      {isCreateModalOpen && !newlyCreatedToken && (
        <DualButtonModal
          title="Create New API Key"
          body={
            <Stack spacing={3}>
              <Typography sx={{ fontSize: 13, color: "#000000", mb: 1 }}>
                Create a new API key for programmatic access to your account.
              </Typography>
              <Field
                id="token-name"
                label="Key name"
                value={newTokenName}
                onChange={handleTokenNameChange}
                error={newTokenNameError || undefined}
                placeholder="e.g. Production API Key"
                sx={{ backgroundColor: "#FFFFFF" }}
                isRequired
              />
            </Stack>
          }
          cancelText="Cancel"
          proceedText={isLoading ? "Creating..." : "Create"}
          onCancel={handleCloseCreateModal}
          onProceed={handleCreateToken}
          proceedButtonColor="primary"
          proceedButtonVariant="contained"
          TitleFontSize={0}
          confirmBtnSx={{
            backgroundColor: isCreateButtonDisabled ? "#ccc" : "#13715B",
            color: isCreateButtonDisabled ? "#666" : "#fff",
            cursor: isCreateButtonDisabled ? "not-allowed" : "pointer",
            opacity: isCreateButtonDisabled ? 0.6 : 1,
            "&:hover": {
              backgroundColor: isCreateButtonDisabled ? "#ccc" : "#0e5c47",
            },
          }}
        />
      )}

      {/* Token Created Modal */}
      {isCreateModalOpen && newlyCreatedToken && (
        <>
          <Box
            onClick={handleCloseCreateModal}
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1299,
            }}
          />
          <Stack
            sx={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1300,
              backgroundColor: "white",
              padding: "16px",
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              maxWidth: "440px",
              width: "100%",
            }}
          >
            <Stack sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
                API key created
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#000000", mb: 3 }}>
                Your API key has been created successfully. Make sure to copy it now as it won't be shown again.
              </Typography>
              <Box>
                <Box
                  sx={{
                    backgroundColor: "#ecfdf3",
                    border: "1.5px solid #13715B",
                    borderRadius: "4px",
                    p: 2.5,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontFamily: "monospace",
                      color: "#000000",
                      wordBreak: "break-all",
                      flex: 1,
                      fontWeight: 500,
                    }}
                  >
                    {newlyCreatedToken}
                  </Typography>
                  <IconButton
                    onClick={() => handleCopyToken(newlyCreatedToken, -1)}
                    disableRipple
                    sx={{
                      color: copiedTokenId === -1 ? "#13715B" : "#666666",
                      backgroundColor: copiedTokenId === -1 ? "#f0fdf4" : "transparent",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        backgroundColor: "#f0fdf4",
                        color: "#13715B",
                      },
                    }}
                  >
                    <CopyIcon size={18} />
                  </IconButton>
                </Box>
                <Box sx={{ height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography sx={{
                    fontSize: 12,
                    color: "#13715B",
                    fontWeight: 500,
                    opacity: copiedTokenId === -1 ? 1 : 0,
                    transition: "opacity 0.2s ease-in-out",
                  }}>
                    ✓ Copied to clipboard!
                  </Typography>
                </Box>
              </Box>
            </Stack>
            <Stack sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center" }}>
              <CustomizableButton
                text="I copied the key"
                variant="contained"
                sx={{
                  backgroundColor: "#13715B",
                  color: "#fff",
                  px: "32px",
                  "&:hover": { backgroundColor: "#0e5c47" }
                }}
                onClick={handleCloseCreateModal}
              />
            </Stack>
          </Stack>
        </>
      )}

      {/* Delete Token Modal */}
      {isDeleteModalOpen && tokenToDelete && (
        <DualButtonModal
          title="Delete API Key"
          body={
            <Typography fontSize={13}>
              Are you sure you want to delete the API key "{tokenToDelete.name}"? This action cannot be undone and any applications using this key will lose access.
            </Typography>
          }
          cancelText="Cancel"
          proceedText={isLoading ? "Deleting..." : "Delete"}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setTokenToDelete(null);
          }}
          onProceed={handleDeleteToken}
          proceedButtonColor="error"
          proceedButtonVariant="contained"
          TitleFontSize={0}
        />
      )}
    </Stack>
  );
};

export default ApiKeys;

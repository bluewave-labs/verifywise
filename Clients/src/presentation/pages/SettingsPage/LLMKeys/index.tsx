import {
  Stack,
  useTheme,
  Box,
  CircularProgress,
  Typography,
  IconButton,
  Collapse,
} from "@mui/material";
import { useState, useCallback, useEffect } from "react";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import { Plus as PlusIcon, Trash2 as DeleteIcon, Edit as EditIcon } from "lucide-react";
import Alert from "../../../components/Alert";
import DualButtonModal from "../../../components/Dialogs/DualButtonModal";
import Field from "../../../components/Inputs/Field";
import allowedRoles from "../../../../application/constants/permissions";
import { useAuth } from "../../../../application/hooks/useAuth";
import { LLMKeysModel } from "../../../../domain/models/Common/llmKeys/llmKeys.model";
import { createLLMKey, deleteLLMKey, editLLMKey, getLLMKeys } from "../../../../application/repository/llmKeys.repository";
import { displayFormattedDate } from "../../../tools/isoDateToString";

interface AlertState {
  variant: "success" | "info" | "warning" | "error";
  title?: string;
  body: string;
  isToast?: boolean;
}

const LLMKeys = () => {
  const { userRoleName } = useAuth();
  const theme = useTheme();
  const isDisabled = !allowedRoles.llmKeys?.manage?.includes(userRoleName);

  const [keys, setKeys] = useState<LLMKeysModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [keyToEdit, setKeyToEdit] = useState<string>("");
  const [keyToDelete, setKeyToDelete] = useState<LLMKeysModel | null>(null);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [hoveredKeyId, setHoveredKeyId] = useState<number | null>(null);
  const [deletingKeyId, setDeletingKeyId] = useState<number | null>(null);
  const [formName, setFormName] = useState<string>("");
  const [formKey, setFormKey] = useState<string>("");

  const showAlert = useCallback(
    (variant: AlertState["variant"], title: string, body: string) => {
      setAlert({ variant, title, body, isToast: false });
    },
    []
  );

  const fetchLLMKeys = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getLLMKeys();
      if (response && response.data && response.data.data) {
        setKeys(response.data.data);
      }
    } catch (error) {
      showAlert("error", "Error", "Failed to fetch LLM Keys");
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchLLMKeys();
  }, [fetchLLMKeys]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const isCreateButtonDisabled =  !formKey || !formName || isLoading;

  const handleCreateKey = useCallback(async () => {
    const formData = {
      name: formName,
      key: formKey,
    };
    setIsLoading(true);
    try {
      const response = await createLLMKey({ body: formData });
      if (response && response.data) {
        showAlert("success", "Success", "LLM Key created successfully");
        fetchLLMKeys();
      }
    } catch (error) {
      showAlert("error", "Error", "Failed to create LLM Key");
    } finally {
      setIsLoading(false);
      handleCloseCreateModal();
    }
  }, [fetchLLMKeys, formKey, formName, showAlert]);


  const handleEditKey = useCallback(async () => {
    const formData = {
      name: formName,
      key: formKey,
    };
    setIsLoading(true);
    try {
      const response = await editLLMKey({ id: keyToEdit, body: formData });
      if (response && response.data) {
        showAlert("success", "Success", "LLM Key editd successfully");
        fetchLLMKeys();
      }
    } catch (error) {
      showAlert("error", "Error", "Failed to edit LLM Key");
    } finally {
      setIsLoading(false);
      handleCloseCreateModal();
    }
  }, [fetchLLMKeys, formKey, formName, showAlert]);

  const handleDeleteKey = useCallback(async () => {
    console.log("Deleting key:", keyToDelete);
    if (!keyToDelete) return;
    setIsLoading(true);
    setDeletingKeyId(keyToDelete.id);
    try {
      const response = await deleteLLMKey(keyToDelete.id.toString());
      if (response && response.data) {
        showAlert("success", "Success", "LLM Key deleted successfully");
        fetchLLMKeys();
      }
    } catch (error) {
      showAlert("error", "Error", "Failed to delete LLM Key");
    } finally {
      setIsLoading(false);
      setDeletingKeyId(null);
      setIsDeleteModalOpen(false);
      setKeyToDelete(null);
    }
  }, [keyToDelete]);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setFormKey("");
    setFormName("");
  }, []);

  const handleEditButtonClick = useCallback((key: LLMKeysModel) => {
    setKeyToEdit(key.id.toString());
    setFormName(key.name);
    setFormKey(key.key);
    setIsEditModalOpen(true);
  }, []);


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
            {keys.length > 0 && (
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

        {isLoading && keys.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : keys.length === 0 ? (
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
              No LLM keys yet
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#666666", mb: 3 }}>
              Add your first LLM API key to enable access to your VerifyWise Advisor.
            </Typography>
            <CustomizableButton
              text="Add API key"
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
            {keys.map((key) => (
              <Collapse
                key={key.id}
                in={deletingKeyId !== key.id}
                timeout={300}
              >
                <Box
                  onMouseEnter={() => setHoveredKeyId(key.id)}
                  onMouseLeave={() => setHoveredKeyId(null)}
                  sx={{
                    border: "1.5px solid #eaecf0",
                    borderRadius: "4px",
                    p: 4,
                    backgroundColor: hoveredKeyId === key.id ? "#f8fffe" : "#ffffff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.3s ease-in-out",
                    cursor: "default",
                    boxShadow: hoveredKeyId === key.id ? "0 2px 8px rgba(19, 113, 91, 0.08)" : "none",
                    opacity: deletingKeyId === key.id ? 0 : 1,
                    transform: deletingKeyId === key.id ? "translateY(-20px)" : "translateY(0)",
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
                    {key.name}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Typography sx={{ fontSize: 12, color: "#999999" }}>
                      Created{" "}
                      <Typography component="span" sx={{ fontSize: 12, fontWeight: 600, color: "#000000" }}>
                        {displayFormattedDate(key.created_at || "")}
                      </Typography>
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditButtonClick(key);
                    }}
                    disableRipple
                    disabled={isDisabled}
                    sx={{
                      opacity: hoveredKeyId === key.id ? 1 : 0.6,
                      transition: "opacity 0.2s ease-in-out",
                      "&:hover": {
                        backgroundColor: "#FEF2F2",
                      },
                      "&:disabled": {
                        opacity: 0.3,
                      },
                    }}
                  >
                    <EditIcon size={18} />
                  </IconButton>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setKeyToDelete(key);
                      setIsDeleteModalOpen(true);
                    }}
                    disableRipple
                    disabled={isDisabled}
                    sx={{
                      color: "#DC2626",
                      opacity: hoveredKeyId === key.id ? 1 : 0.6,
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
              </Collapse>
            ))}
          </Box>
        )}
      </Stack>

      {/* Create Key Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <DualButtonModal
          title="Create New API Key"
          body={
            <Stack spacing={3}>
              <Typography sx={{ fontSize: 13, color: "#000000", mb: 1 }}>
                {isCreateModalOpen ? 'Create a new API key for access to your Verifywise Advisor.': "Edit your AI API key details below."} 
              </Typography>
              <Field
                id="key-name"
                label="Name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Open AI API Key"
                isRequired
              />
              <Field
                id="key-value"
                label="Key"
                value={formKey}
                onChange={(e) => setFormKey(e.target.value)}
                isRequired
              />
            </Stack>
          }
          cancelText="Cancel"
          proceedText={isLoading ? "Creating..." : isCreateModalOpen ? "Create": "Edit"}
          onCancel={handleCloseCreateModal}
          onProceed={isCreateModalOpen ? handleCreateKey: handleEditKey}
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

      {/* Delete Key Modal */}
      {isDeleteModalOpen && keyToDelete && (
        <DualButtonModal
          title="Delete API Key"
          body={
            <Typography fontSize={13}>
              Are you sure you want to delete the API key "{keyToDelete.name}"? This action cannot be undone and any applications using this key will lose access.
            </Typography>
          }
          cancelText="Cancel"
          proceedText={isLoading ? "Deleting..." : "Delete"}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setKeyToDelete(null);
          }}
          onProceed={handleDeleteKey}
          proceedButtonColor="error"
          proceedButtonVariant="contained"
          TitleFontSize={0}
        />
      )}
    </Stack>
  );
};

export default LLMKeys;

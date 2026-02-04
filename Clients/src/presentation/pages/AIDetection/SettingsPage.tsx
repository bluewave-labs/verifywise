/**
 * @fileoverview AI Detection Settings Page
 *
 * Settings page for AI Detection configuration.
 * Currently supports GitHub token management for private repository access.
 *
 * @module pages/AIDetection/SettingsPage
 */

import { useState, useEffect, useCallback, Suspense } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import {
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
} from "lucide-react";
import TabBar from "../../components/TabBar";
import Field from "../../components/Inputs/Field";
import { CustomizableButton } from "../../components/Button/CustomizableButton";
import Alert from "../../components/Alert";
import {
  getGitHubTokenStatus,
  saveGitHubToken,
  deleteGitHubToken,
  testGitHubToken,
  GitHubTokenStatus,
  GitHubTokenTestResult,
} from "../../../application/repository/githubToken.repository";

interface ToastAlert {
  variant: "success" | "error" | "warning" | "info";
  body: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("github");
  const [tokenStatus, setTokenStatus] = useState<GitHubTokenStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState("");
  const [tokenNameInput, setTokenNameInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alert, setAlert] = useState<ToastAlert | null>(null);

  // Load token status on mount
  const loadTokenStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const status = await getGitHubTokenStatus();
      setTokenStatus(status);
    } catch (err) {
      console.error("Failed to load token status:", err);
      setAlert({ variant: "error", body: "Failed to load token status" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTokenStatus();
  }, [loadTokenStatus]);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [alert]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const handleTestToken = async () => {
    if (!tokenInput.trim()) {
      setAlert({ variant: "error", body: "Please enter a token to test" });
      return;
    }

    setIsTesting(true);

    try {
      const result: GitHubTokenTestResult = await testGitHubToken(tokenInput);
      if (result.valid) {
        setAlert({ variant: "success", body: "Token is valid" });
      } else {
        setAlert({ variant: "error", body: result.error || "Token is invalid" });
      }
    } catch (err) {
      setAlert({ variant: "error", body: err instanceof Error ? err.message : "Failed to test token" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) {
      setAlert({ variant: "error", body: "Please enter a token" });
      return;
    }

    setIsSaving(true);

    try {
      const status = await saveGitHubToken(
        tokenInput,
        tokenNameInput.trim() || undefined
      );
      setTokenStatus(status);
      setTokenInput("");
      setTokenNameInput("");
      setAlert({ variant: "success", body: "GitHub token saved successfully" });
    } catch (err) {
      setAlert({ variant: "error", body: err instanceof Error ? err.message : "Failed to save token" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteToken = async () => {
    setIsDeleting(true);

    try {
      await deleteGitHubToken();
      setTokenStatus({ configured: false });
      setAlert({ variant: "success", body: "GitHub token deleted successfully" });
    } catch (err) {
      setAlert({ variant: "error", body: err instanceof Error ? err.message : "Failed to delete token" });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 300,
        }}
      >
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <>
      {/* Toast notification */}
      {alert && (
        <Suspense fallback={null}>
          <Alert
            variant={alert.variant}
            body={alert.body}
            isToast={true}
            onClick={() => setAlert(null)}
          />
        </Suspense>
      )}

      <TabContext value={activeTab}>
        <TabBar
          tabs={[
            {
              label: "GitHub integration",
              value: "github",
            },
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
        />

        <TabPanel value="github" sx={{ p: 0, pt: "8px" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Help Text */}
            <Box>
              <Typography sx={{ fontSize: 13, color: "#667085" }}>
                To scan private repositories, you need a GitHub Personal Access
                Token with <strong>repo</strong> scope (for private repos) or{" "}
                <strong>public_repo</strong> scope (for public repos only).
              </Typography>
              <Typography
                component="a"
                href="https://github.com/settings/tokens/new?description=VerifyWise%20Scanner&scopes=repo"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontSize: 13,
                  color: "#13715B",
                  textDecoration: "none",
                  mt: 0.5,
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Create a new token on GitHub
                <ExternalLink size={12} />
              </Typography>
            </Box>

            {/* Current Status */}
            {tokenStatus?.configured && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: "8px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(19, 113, 91, 0.08)",
                  border: "1px solid rgba(19, 113, 91, 0.2)",
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 500, color: "#13715B" }}
                  >
                    Token configured
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "#6c757d" }}>
                    {tokenStatus.token_name || "GitHub Personal Access Token"}
                  </Typography>
                </Box>
                <CustomizableButton
                  variant="text"
                  size="small"
                  onClick={handleDeleteToken}
                  isDisabled={isDeleting}
                  sx={{ color: "#dc3545", minWidth: "auto", p: 1 }}
                >
                  {isDeleting ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </CustomizableButton>
              </Box>
            )}

            {/* Token Input Form */}
            <Field
              label="Personal access token"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={tokenInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setTokenInput(e.target.value);
              }}
              type={showToken ? "text" : "password"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowToken(!showToken)}
                      edge="end"
                    >
                      {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Field
              label="Token name (optional)"
              placeholder="e.g., VerifyWise Scanner Token"
              value={tokenNameInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTokenNameInput(e.target.value)
              }
            />

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <CustomizableButton
                variant="outlined"
                onClick={handleTestToken}
                isDisabled={!tokenInput.trim() || isTesting}
                loading={isTesting}
              >
                Test token
              </CustomizableButton>
              <CustomizableButton
                variant="contained"
                onClick={handleSaveToken}
                isDisabled={!tokenInput.trim() || isSaving}
                loading={isSaving}
              >
                {tokenStatus?.configured ? "Update token" : "Save token"}
              </CustomizableButton>
            </Box>
          </Box>
        </TabPanel>
      </TabContext>
    </>
  );
}

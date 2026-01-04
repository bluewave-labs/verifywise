import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import ConfirmationModal from "../../presentation/components/Dialogs/ConfirmationModal";
import { Typography, Stack, Box } from "@mui/material";
import { ExternalLink } from "lucide-react";

/**
 * Trusted domains that don't require a warning before opening.
 * Internal domains and known safe external services.
 */
const TRUSTED_DOMAINS = [
  // Internal
  "verifywise.ai",
  "localhost",
  // Known safe external services
  "github.com",
  "discord.gg",
  "discord.com",
  "cal.com",
  "google.com",
  "microsoft.com",
  "linkedin.com",
];

interface ExternalLinkState {
  isOpen: boolean;
  url: string;
  hostname: string;
}

interface ExternalLinkWarningContextType {
  openLink: (url: string) => void;
}

const ExternalLinkWarningContext = createContext<ExternalLinkWarningContextType | null>(null);

/**
 * Hook to access the external link warning context.
 * Must be used within ExternalLinkWarningProvider.
 */
export const useExternalLinkWarning = (): ExternalLinkWarningContextType => {
  const context = useContext(ExternalLinkWarningContext);
  if (!context) {
    throw new Error("useExternalLinkWarning must be used within ExternalLinkWarningProvider");
  }
  return context;
};

/**
 * Check if a URL uses a dangerous protocol that should be blocked.
 */
const isDangerousProtocol = (url: string): boolean => {
  const lowerUrl = url.toLowerCase().trim();
  return lowerUrl.startsWith("javascript:") || lowerUrl.startsWith("data:");
};

/**
 * Check if a URL is internal or from a trusted domain.
 */
const isInternalOrTrusted = (url: string): boolean => {
  try {
    const parsed = new URL(url, window.location.origin);

    // Block dangerous protocols
    if (isDangerousProtocol(url)) {
      return false;
    }

    // Internal link (same hostname)
    if (parsed.hostname === window.location.hostname) {
      return true;
    }

    // Check if hostname matches any trusted domain
    return TRUSTED_DOMAINS.some(
      (domain) =>
        parsed.hostname === domain || parsed.hostname.endsWith("." + domain)
    );
  } catch {
    // Invalid URL - treat as untrusted
    return false;
  }
};

interface ExternalLinkWarningProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the app to enable external link warnings.
 * Shows a confirmation modal when users click on untrusted external links.
 */
export const ExternalLinkWarningProvider: React.FC<ExternalLinkWarningProviderProps> = ({
  children,
}) => {
  const [linkState, setLinkState] = useState<ExternalLinkState>({
    isOpen: false,
    url: "",
    hostname: "",
  });

  const openLink = useCallback((url: string) => {
    if (!url) return;

    // Block dangerous protocols entirely
    if (isDangerousProtocol(url)) {
      console.warn("Blocked dangerous URL protocol:", url);
      return;
    }

    // For internal or trusted domains, open directly
    if (isInternalOrTrusted(url)) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    // For untrusted external domains, show warning
    try {
      const parsed = new URL(url, window.location.origin);
      setLinkState({
        isOpen: true,
        url,
        hostname: parsed.hostname,
      });
    } catch {
      // Invalid URL - don't open
      console.warn("Invalid URL:", url);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (linkState.url) {
      window.open(linkState.url, "_blank", "noopener,noreferrer");
    }
    setLinkState({ isOpen: false, url: "", hostname: "" });
  }, [linkState.url]);

  const handleCancel = useCallback(() => {
    setLinkState({ isOpen: false, url: "", hostname: "" });
  }, []);

  return (
    <ExternalLinkWarningContext.Provider value={{ openLink }}>
      {children}
      {linkState.isOpen && (
        <ConfirmationModal
          title="You are leaving VerifyWise"
          body={
            <Stack spacing={2}>
              <Typography
                sx={{
                  fontSize: 14,
                  color: "#475467",
                  lineHeight: 1.5,
                }}
              >
                You are about to visit an external website. Please verify this is a trusted destination before proceeding.
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1.5,
                  backgroundColor: "#f9fafb",
                  borderRadius: "4px",
                  border: "1px solid #d0d5dd",
                }}
              >
                <ExternalLink size={16} color="#475467" />
                <Typography
                  sx={{
                    fontSize: 13,
                    fontFamily: "monospace",
                    color: "#344054",
                    wordBreak: "break-all",
                  }}
                >
                  {linkState.hostname}
                </Typography>
              </Box>
            </Stack>
          }
          cancelText="Cancel"
          proceedText="Continue"
          onCancel={handleCancel}
          onProceed={handleConfirm}
          proceedButtonVariant="contained"
          proceedButtonColor="primary"
        />
      )}
    </ExternalLinkWarningContext.Provider>
  );
};

export default ExternalLinkWarningProvider;

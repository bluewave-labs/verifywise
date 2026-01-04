import { useState, useCallback } from "react";

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

interface UseExternalLinkWarningReturn {
  linkWarningState: ExternalLinkState;
  openLink: (url: string) => void;
  confirmOpen: () => void;
  cancelOpen: () => void;
}

/**
 * Hook to handle external link warnings.
 * Shows a confirmation modal for untrusted external domains.
 *
 * @example
 * const { linkWarningState, openLink, confirmOpen, cancelOpen } = useExternalLinkWarning();
 *
 * // In your click handler:
 * onClick={() => openLink(url)}
 *
 * // Render the modal:
 * {linkWarningState.isOpen && (
 *   <ConfirmationModal
 *     title="You are leaving VerifyWise"
 *     body={<Typography>You are about to visit: {linkWarningState.hostname}</Typography>}
 *     cancelText="Cancel"
 *     proceedText="Continue"
 *     onCancel={cancelOpen}
 *     onProceed={confirmOpen}
 *     proceedButtonVariant="contained"
 *     proceedButtonColor="primary"
 *   />
 * )}
 */
export const useExternalLinkWarning = (): UseExternalLinkWarningReturn => {
  const [linkWarningState, setLinkWarningState] = useState<ExternalLinkState>({
    isOpen: false,
    url: "",
    hostname: "",
  });

  const isInternalOrTrusted = useCallback((url: string): boolean => {
    try {
      const parsed = new URL(url, window.location.origin);

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
  }, []);

  const openLink = useCallback(
    (url: string) => {
      if (!url) return;

      // For internal or trusted domains, open directly
      if (isInternalOrTrusted(url)) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      // For untrusted external domains, show warning
      try {
        const parsed = new URL(url, window.location.origin);
        setLinkWarningState({
          isOpen: true,
          url,
          hostname: parsed.hostname,
        });
      } catch {
        // Invalid URL - don't open
        console.warn("Invalid URL:", url);
      }
    },
    [isInternalOrTrusted]
  );

  const confirmOpen = useCallback(() => {
    if (linkWarningState.url) {
      window.open(linkWarningState.url, "_blank", "noopener,noreferrer");
    }
    setLinkWarningState({ isOpen: false, url: "", hostname: "" });
  }, [linkWarningState.url]);

  const cancelOpen = useCallback(() => {
    setLinkWarningState({ isOpen: false, url: "", hostname: "" });
  }, []);

  return {
    linkWarningState,
    openLink,
    confirmOpen,
    cancelOpen,
  };
};

/**
 * Standalone function to check if a URL is internal or trusted.
 * Useful for non-hook contexts.
 */
export const isUrlTrusted = (url: string): boolean => {
  try {
    const parsed = new URL(url, window.location.origin);

    if (parsed.hostname === window.location.hostname) {
      return true;
    }

    return TRUSTED_DOMAINS.some(
      (domain) =>
        parsed.hostname === domain || parsed.hostname.endsWith("." + domain)
    );
  } catch {
    return false;
  }
};

/**
 * Open a link safely - for use in contexts where hooks aren't available.
 * Returns true if opened directly, false if warning is needed.
 */
export const openLinkSafely = (
  url: string,
  onWarningNeeded?: (url: string, hostname: string) => void
): boolean => {
  if (!url) return false;

  if (isUrlTrusted(url)) {
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  }

  try {
    const parsed = new URL(url, window.location.origin);
    if (onWarningNeeded) {
      onWarningNeeded(url, parsed.hostname);
    }
    return false;
  } catch {
    console.warn("Invalid URL:", url);
    return false;
  }
};

export default useExternalLinkWarning;

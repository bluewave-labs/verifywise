/**
 * AIDepGraphModal - Full-screen modal for viewing AI dependency relationships
 *
 * Opens the AI Dependency Graph visualization for a specific scan,
 * allowing users to explore AI/ML component relationships.
 */

import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  IconButton,
  Typography,
  Stack,
  CircularProgress,
} from "@mui/material";
import { X, Network } from "lucide-react";
// Import ReactFlow CSS at modal level to ensure it's available in the portal
import "@xyflow/react/dist/style.css";
import AIDepGraph from "../AIDepGraph";

interface AIDepGraphModalProps {
  open: boolean;
  onClose: () => void;
  scanId: number;
  repositoryName?: string;
  repositoryUrl?: string;
}

const AIDepGraphModal: React.FC<AIDepGraphModalProps> = ({
  open,
  onClose,
  scanId,
  repositoryName,
  repositoryUrl,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  // Delay rendering until modal is fully open to prevent NaN viewport issues
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => {
      clearTimeout(timer);
      setIsMounted(false);
    };
  }, [open]);

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="ai-dep-graph-modal"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        sx={{
          width: "95vw",
          height: "90vh",
          backgroundColor: "#fff",
          borderRadius: "4px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          outline: "none",
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 3,
            py: 2,
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
            flexShrink: 0,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Network size={20} color="#13715B" />
            <Typography
              variant="h6"
              sx={{
                fontSize: 16,
                fontWeight: 600,
                color: "#101828",
              }}
            >
              AI dependency graph
            </Typography>
            {repositoryName && (
              <>
                <Typography sx={{ color: "#667085", fontSize: 14 }}>
                  •
                </Typography>
                <Typography
                  sx={{
                    fontSize: 14,
                    color: "#344054",
                    fontWeight: 500,
                  }}
                >
                  {repositoryName}
                </Typography>
              </>
            )}
          </Stack>

          <Stack direction="row" alignItems="center" gap={1}>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: "#667085",
                "&:hover": {
                  backgroundColor: "#f3f4f6",
                },
              }}
            >
              <X size={20} />
            </IconButton>
          </Stack>
        </Stack>

        {/* Content - AI Dependency Graph */}
        <Box
          sx={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            minHeight: 400,
          }}
        >
          {isMounted ? (
            <AIDepGraph scanId={scanId} repositoryUrl={repositoryUrl} />
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 2,
              }}
            >
              <CircularProgress size={24} sx={{ color: "#13715B" }} />
              <Typography sx={{ color: "#667085" }}>Loading graph...</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default AIDepGraphModal;

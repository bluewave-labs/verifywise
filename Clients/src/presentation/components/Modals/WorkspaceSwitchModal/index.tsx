/**
 * WorkspaceSwitchModal - A modal for switching between workspaces
 *
 * @component
 * @example
 * <WorkspaceSwitchModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   workspaces={workspaces}
 *   currentWorkspaceId={currentWorkspaceId}
 *   onWorkspaceSelect={handleWorkspaceSelect}
 *   onCreateWorkspace={handleCreateWorkspace}
 * />
 */
import React, { memo, useCallback, useState } from "react";
import { Box, Stack, Typography, CircularProgress } from "@mui/material";
import { Check, Plus } from "lucide-react";
import StandardModal from "../StandardModal";

interface Workspace {
  id: number | string;
  name: string;
  description?: string;
  icon?: string;
  iconColor?: string;
}

interface WorkspaceSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  currentWorkspaceId?: number | string;
  onWorkspaceSelect: (workspace: Workspace) => void;
  onCreateWorkspace: () => void;
  isLoading?: boolean;
}

/**
 * Generates a consistent color from a string
 */
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 45%, 45%)`;
};

/**
 * Gets initials from workspace name
 */
const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
};

const WorkspaceSwitchModal: React.FC<WorkspaceSwitchModalProps> = ({
  isOpen,
  onClose,
  workspaces,
  currentWorkspaceId,
  onWorkspaceSelect,
  onCreateWorkspace,
  isLoading = false,
}) => {
  const [hoveredId, setHoveredId] = useState<number | string | null>(null);

  const handleWorkspaceClick = useCallback(
    (workspace: Workspace) => {
      if (workspace.id !== currentWorkspaceId && !isLoading) {
        onWorkspaceSelect(workspace);
      }
    },
    [currentWorkspaceId, onWorkspaceSelect, isLoading]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, workspace: Workspace) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleWorkspaceClick(workspace);
      }
    },
    [handleWorkspaceClick]
  );

  const handleCreateKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onCreateWorkspace();
      }
    },
    [onCreateWorkspace]
  );

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Switch Workspace"
      description="Select a workspace to switch to"
      fitContent
      hideFooter
      maxWidth="480px"
    >
      <Box sx={{ position: "relative" }}>
        <Stack spacing={1} role="listbox" aria-label="Available workspaces">
          {workspaces.map((workspace) => {
            const isSelected = workspace.id === currentWorkspaceId;
            const isHovered = hoveredId === workspace.id;
            const bgColor = workspace.iconColor || stringToColor(workspace.name);

            return (
              <Box
                key={workspace.id}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => handleWorkspaceClick(workspace)}
                onKeyDown={(e) => handleKeyDown(e, workspace)}
                onMouseEnter={() => setHoveredId(workspace.id)}
                onMouseLeave={() => setHoveredId(null)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "4px",
                  cursor: isLoading ? "wait" : "pointer",
                  border: "1px solid",
                  borderColor: isSelected ? "#13715B" : "transparent",
                  backgroundColor: isSelected
                    ? "#E6F4F1"
                    : isHovered
                      ? "#F9FAFB"
                      : "transparent",
                  transition: "all 0.15s ease-in-out",
                  opacity: isLoading && !isSelected ? 0.6 : 1,
                  "&:focus": {
                    outline: "2px solid #13715B",
                    outlineOffset: "2px",
                  },
                }}
              >
                {/* Workspace Icon */}
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "4px",
                    backgroundColor: bgColor,
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  {workspace.icon || getInitials(workspace.name)}
                </Box>

                {/* Text Content */}
                <Stack sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#101828",
                      lineHeight: 1.4,
                    }}
                    noWrap
                  >
                    {workspace.name}
                  </Typography>
                  {workspace.description && (
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 400,
                        color: "#475467",
                        lineHeight: 1.4,
                      }}
                      noWrap
                    >
                      {workspace.description}
                    </Typography>
                  )}
                </Stack>

                {/* Selected Indicator */}
                {isSelected && (
                  <Check
                    size={20}
                    color="#13715B"
                    aria-label="Currently selected"
                  />
                )}
              </Box>
            );
          })}

          {/* Create New Workspace Button */}
          <Box
            role="button"
            tabIndex={0}
            onClick={onCreateWorkspace}
            onKeyDown={handleCreateKeyDown}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "8px",
              borderTop: "1px solid #E0E4E9",
              paddingTop: "20px",
              transition: "background-color 0.15s ease-in-out",
              "&:hover": {
                backgroundColor: "#F9FAFB",
              },
              "&:focus": {
                outline: "2px solid #13715B",
                outlineOffset: "2px",
              },
            }}
            aria-label="Create new workspace"
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "4px",
                backgroundColor: "#F2F4F7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={20} color="#13715B" />
            </Box>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: "#13715B",
              }}
            >
              Create New Workspace
            </Typography>
          </Box>
        </Stack>

        {/* Loading Overlay */}
        {isLoading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              borderRadius: "4px",
            }}
          >
            <CircularProgress size={24} sx={{ color: "#13715B" }} />
          </Box>
        )}
      </Box>
    </StandardModal>
  );
};

export default memo(WorkspaceSwitchModal);

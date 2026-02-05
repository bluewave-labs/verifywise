/**
 * @fileoverview FolderBreadcrumb Component
 *
 * A breadcrumb navigation component for displaying the current folder path.
 *
 * @module presentation/pages/FileManager/components/FolderBreadcrumb
 */

import React from "react";
import { Stack, Box, Typography } from "@mui/material";
import {
  ChevronRight as ChevronRightIcon,
  Home as HomeIcon,
  Folder as FolderIcon,
  Files as FilesIcon,
  FileQuestion as UncategorizedIcon,
} from "lucide-react";
import {
  IVirtualFolder,
  SelectedFolder,
} from "../../../../../domain/interfaces/i.virtualFolder";

interface FolderBreadcrumbProps {
  selectedFolder: SelectedFolder;
  breadcrumb: IVirtualFolder[];
  onSelectFolder: (folder: SelectedFolder) => void;
  loading?: boolean;
}

/**
 * FolderBreadcrumb Component
 */
export const FolderBreadcrumb: React.FC<FolderBreadcrumbProps> = ({
  selectedFolder,
  breadcrumb,
  onSelectFolder,
  loading,
}) => {
  // Get display name for special views
  const getDisplayName = (folder: SelectedFolder): string => {
    if (folder === "all") return "All files";
    if (folder === "uncategorized") return "Uncategorized";
    return "";
  };

  // Get icon for special views
  const getIcon = (folder: SelectedFolder) => {
    if (folder === "all") return <FilesIcon size={14} />;
    if (folder === "uncategorized") return <UncategorizedIcon size={14} />;
    return <FolderIcon size={14} />;
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        padding: "8px 0",
        minHeight: "32px",
      }}
    >
      {/* Home/All Files link */}
      <Box
        onClick={() => onSelectFolder("all")}
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: "4px",
          "&:hover": {
            backgroundColor: "#F3F4F6",
          },
        }}
      >
        <HomeIcon size={14} color="#667085" />
      </Box>

      {/* Special folder views (all/uncategorized) */}
      {typeof selectedFolder === "string" && (
        <>
          <ChevronRightIcon size={14} color="#D0D5DD" />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor: "#F3F4F6",
            }}
          >
            <Box sx={{ display: "flex", color: "#667085" }}>
              {getIcon(selectedFolder)}
            </Box>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 500,
                color: "#344054",
              }}
            >
              {getDisplayName(selectedFolder)}
            </Typography>
          </Box>
        </>
      )}

      {/* Folder path breadcrumb */}
      {typeof selectedFolder === "number" && (
        <>
          {loading ? (
            <>
              <ChevronRightIcon size={14} color="#D0D5DD" />
              <Typography sx={{ fontSize: 13, color: "#98A2B3" }}>
                Loading...
              </Typography>
            </>
          ) : (
            breadcrumb.map((folder, index) => {
              const isLast = index === breadcrumb.length - 1;

              return (
                <React.Fragment key={folder.id}>
                  <ChevronRightIcon size={14} color="#D0D5DD" />
                  <Box
                    onClick={() => !isLast && onSelectFolder(folder.id)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      cursor: isLast ? "default" : "pointer",
                      backgroundColor: isLast ? "#F3F4F6" : "transparent",
                      "&:hover": {
                        backgroundColor: isLast ? "#F3F4F6" : "#F9FAFB",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        color: folder.color || "#667085",
                      }}
                    >
                      <FolderIcon size={14} />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: isLast ? 500 : 400,
                        color: isLast ? "#344054" : "#667085",
                        maxWidth: "150px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {folder.name}
                    </Typography>
                  </Box>
                </React.Fragment>
              );
            })
          )}
        </>
      )}
    </Stack>
  );
};

export default FolderBreadcrumb;

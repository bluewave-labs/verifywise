/**
 * @fileoverview FolderTree Component
 *
 * A hierarchical tree view component for navigating virtual folders.
 *
 * @module presentation/pages/FileManager/components/FolderTree
 */

import React, { useState, useCallback } from "react";
import { Stack, Box, Typography, Collapse, IconButton, useTheme } from "@mui/material";
import {
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  Files as FilesIcon,
  FileQuestion as UncategorizedIcon,
  Plus as PlusIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
} from "lucide-react";
import {
  IFolderTreeNode,
  SelectedFolder,
} from "../../../../../domain/interfaces/i.virtualFolder";
import { CustomizableButton } from "../../../../components/button/customizable-button";

interface FolderTreeProps {
  folders: IFolderTreeNode[];
  selectedFolder: SelectedFolder;
  onSelectFolder: (folder: SelectedFolder) => void;
  onCreateFolder?: (parentId: number | null) => void;
  onEditFolder?: (folder: IFolderTreeNode) => void;
  onDeleteFolder?: (folder: IFolderTreeNode) => void;
  loading?: boolean;
  canManage?: boolean;
}

interface FolderItemProps {
  folder: IFolderTreeNode;
  level: number;
  selectedFolder: SelectedFolder;
  expandedFolders: Set<number>;
  onSelectFolder: (folder: SelectedFolder) => void;
  onToggleExpand: (folderId: number) => void;
  onCreateFolder?: (parentId: number | null) => void;
  onEditFolder?: (folder: IFolderTreeNode) => void;
  onDeleteFolder?: (folder: IFolderTreeNode) => void;
  canManage?: boolean;
}

/**
 * Individual folder item in the tree
 */
const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  level,
  selectedFolder,
  expandedFolders,
  onSelectFolder,
  onToggleExpand,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  canManage,
}) => {
  const theme = useTheme();
  const [showActions, setShowActions] = useState(false);
  const isSelected = selectedFolder === folder.id;
  const isExpanded = expandedFolders.has(folder.id);
  const hasChildren = folder.children.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectFolder(folder.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(folder.id);
  };

  const handleCreateSubfolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateFolder?.(folder.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditFolder?.(folder);
    setShowActions(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteFolder?.(folder);
    setShowActions(false);
  };

  return (
    <>
      <Box
        onClick={handleClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          padding: "6px 8px",
          paddingLeft: `${8 + level * 16}px`,
          cursor: "pointer",
          borderRadius: "4px",
          backgroundColor: isSelected ? "#E8F5F1" : "transparent",
          "&:hover": {
            backgroundColor: isSelected ? "#E8F5F1" : theme.palette.background.accent,
          },
          transition: "background-color 0.15s ease",
        }}
      >
        {/* Expand/Collapse toggle */}
        <Box
          onClick={hasChildren ? handleToggle : undefined}
          sx={{
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            cursor: hasChildren ? "pointer" : "default",
            opacity: hasChildren ? 1 : 0,
          }}
        >
          {hasChildren && (
            isExpanded ? (
              <ChevronDownIcon size={14} color={theme.palette.other.icon} />
            ) : (
              <ChevronRightIcon size={14} color={theme.palette.other.icon} />
            )
          )}
        </Box>

        {/* Folder icon */}
        <Box
          sx={{
            marginRight: "8px",
            display: "flex",
            alignItems: "center",
            color: folder.color || theme.palette.primary.main,
          }}
        >
          {isExpanded ? (
            <FolderOpenIcon size={16} />
          ) : (
            <FolderIcon size={16} />
          )}
        </Box>

        {/* Folder name and count */}
        <Typography
          sx={{
            flex: 1,
            fontSize: 13,
            fontWeight: isSelected ? 500 : 400,
            color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {folder.name}
        </Typography>

        {/* File count */}
        <Typography
          sx={{
            fontSize: 12,
            color: theme.palette.text.muted,
            marginLeft: "4px",
            flexShrink: 0,
          }}
        >
          ({folder.file_count})
        </Typography>

        {/* Action buttons (shown on hover) */}
        {canManage && showActions && (
          <Box sx={{ display: "flex", gap: "2px", marginLeft: "4px" }}>
            <IconButton
              size="small"
              onClick={handleCreateSubfolder}
              sx={{
                padding: "2px",
                "&:hover": { backgroundColor: theme.palette.status.success.bg },
              }}
              title="Create subfolder"
              aria-label={`Create subfolder in ${folder.name}`}
            >
              <PlusIcon size={12} color={theme.palette.other.icon} />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleEdit}
              sx={{
                padding: "2px",
                "&:hover": { backgroundColor: theme.palette.status.success.bg },
              }}
              title="Edit folder"
              aria-label={`Edit folder ${folder.name}`}
            >
              <EditIcon size={12} color={theme.palette.other.icon} />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleDelete}
              sx={{
                padding: "2px",
                "&:hover": { backgroundColor: theme.palette.status.error.bg },
              }}
              title="Delete folder"
              aria-label={`Delete folder ${folder.name}`}
            >
              <DeleteIcon size={12} color={theme.palette.chart.red} />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Children */}
      <Collapse in={isExpanded} timeout={200}>
        <Box>
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolder={selectedFolder}
              expandedFolders={expandedFolders}
              onSelectFolder={onSelectFolder}
              onToggleExpand={onToggleExpand}
              onCreateFolder={onCreateFolder}
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
              canManage={canManage}
            />
          ))}
        </Box>
      </Collapse>
    </>
  );
};

/**
 * FolderTree Component
 */
export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  selectedFolder,
  onSelectFolder,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  loading,
  canManage,
}) => {
  const theme = useTheme();
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());

  const handleToggleExpand = useCallback((folderId: number) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  return (
    <Stack
      sx={{
        width: "240px",
        minWidth: "200px",
        borderRight: `1px solid ${theme.palette.border.light}`,
        backgroundColor: theme.palette.background.accent,
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          padding: "12px 16px",
          borderBottom: `1px solid ${theme.palette.border.light}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: theme.palette.other.icon,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Folders
        </Typography>
        {canManage && (
          <IconButton
            size="small"
            onClick={() => onCreateFolder?.(null)}
            sx={{
              padding: "4px",
              "&:hover": { backgroundColor: theme.palette.status.success.bg },
            }}
            title="Create folder"
            aria-label="Create new folder"
          >
            <PlusIcon size={14} color={theme.palette.primary.main} />
          </IconButton>
        )}
      </Box>

      {/* Folder list */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          padding: "8px",
        }}
      >
        {loading ? (
          <Typography
            sx={{
              fontSize: 13,
              color: theme.palette.text.muted,
              padding: "12px",
              textAlign: "center",
            }}
          >
            Loading folders...
          </Typography>
        ) : (
          <>
            {/* All Files */}
            <Box
              onClick={() => onSelectFolder("all")}
              sx={{
                display: "flex",
                alignItems: "center",
                padding: "6px 8px",
                cursor: "pointer",
                borderRadius: "4px",
                backgroundColor: selectedFolder === "all" ? "#E8F5F1" : "transparent",
                "&:hover": {
                  backgroundColor: selectedFolder === "all" ? "#E8F5F1" : theme.palette.background.accent,
                },
                marginBottom: "4px",
              }}
            >
              <Box sx={{ width: 20 }} />
              <Box sx={{ marginRight: "8px", display: "flex", color: theme.palette.other.icon }}>
                <FilesIcon size={16} />
              </Box>
              <Typography
                sx={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: selectedFolder === "all" ? 500 : 400,
                  color: selectedFolder === "all" ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
              >
                All files
              </Typography>
            </Box>

            {/* Uncategorized */}
            <Box
              onClick={() => onSelectFolder("uncategorized")}
              sx={{
                display: "flex",
                alignItems: "center",
                padding: "6px 8px",
                cursor: "pointer",
                borderRadius: "4px",
                backgroundColor: selectedFolder === "uncategorized" ? "#E8F5F1" : "transparent",
                "&:hover": {
                  backgroundColor: selectedFolder === "uncategorized" ? "#E8F5F1" : theme.palette.background.accent,
                },
                marginBottom: "8px",
              }}
            >
              <Box sx={{ width: 20 }} />
              <Box sx={{ marginRight: "8px", display: "flex", color: theme.palette.text.muted }}>
                <UncategorizedIcon size={16} />
              </Box>
              <Typography
                sx={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: selectedFolder === "uncategorized" ? 500 : 400,
                  color: selectedFolder === "uncategorized" ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
              >
                Uncategorized
              </Typography>
            </Box>

            {/* Folder tree */}
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                level={0}
                selectedFolder={selectedFolder}
                expandedFolders={expandedFolders}
                onSelectFolder={onSelectFolder}
                onToggleExpand={handleToggleExpand}
                onCreateFolder={onCreateFolder}
                onEditFolder={onEditFolder}
                onDeleteFolder={onDeleteFolder}
                canManage={canManage}
              />
            ))}

            {/* Empty state */}
            {folders.length === 0 && (
              <Box
                sx={{
                  padding: "16px",
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    color: theme.palette.text.muted,
                    marginBottom: "8px",
                  }}
                >
                  No folders yet
                </Typography>
                {canManage && (
                  <CustomizableButton
                    variant="outlined"
                    text="Create folder"
                    onClick={() => onCreateFolder?.(null)}
                    sx={{
                      height: "28px",
                      fontSize: 12,
                    }}
                    icon={<PlusIcon size={12} />}
                  />
                )}
              </Box>
            )}
          </>
        )}
      </Box>
    </Stack>
  );
};

export default FolderTree;

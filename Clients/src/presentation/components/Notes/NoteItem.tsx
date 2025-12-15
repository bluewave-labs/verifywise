/**
 * @fileoverview NoteItem Component
 *
 * Displays an individual note with author information, timestamps, and optional action menu.
 * Shows note content with edit indicator if the note has been edited.
 *
 * Props:
 * - note: Note object with content, author, timestamps
 * - onEdit: Callback when user clicks edit
 * - onDelete: Callback when user clicks delete
 * - canEdit: Boolean indicating if user can edit this note
 * - canDelete: Boolean indicating if user can delete this note
 *
 * @module components/Notes
 */

import React, { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  Avatar,
  Divider,
} from "@mui/material";
import {
  MoreVertical as MenuIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import ConfirmationModal from "../Dialogs/ConfirmationModal";

dayjs.extend(relativeTime);

interface NoteItemProps {
  note: {
    id: number;
    content: string;
    author_id: number;
    author?: {
      id: number;
      name: string;
      surname: string;
      email: string;
    };
    created_at: string;
    updated_at: string;
    is_edited: boolean;
  };
  onEdit: (noteId: number, content: string) => void;
  onDelete: (noteId: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const NoteItem: React.FC<NoteItemProps> = ({
  note,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEdit(note.id, note.content);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = () => {
    onDelete(note.id);
    setIsDeleteModalOpen(false);
  };

  const authorName = note.author
    ? `${note.author.name} ${note.author.surname}`.trim()
    : "Unknown Author";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const createdTime = dayjs(note.created_at).fromNow();
  const updatedTime = note.is_edited ? dayjs(note.updated_at).fromNow() : null;

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.border.light}`,
        borderRadius: "4px",
        overflow: "hidden",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          borderColor: theme.palette.primary.main,
          boxShadow: theme.boxShadow,
        },
      }}
    >
      <Stack spacing={0}>
        {/* Note Header - Author and Timestamp */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: theme.spacing(4),
            backgroundColor: theme.palette.background.modal,
          }}
        >
          <Stack
            direction="row"
            spacing={theme.spacing(1)}
            alignItems="center"
            sx={{ flex: 1, gap: 2 }}
          >
            <Stack
              direction="row"
              spacing={theme.spacing(1)}
              alignItems="center"
              sx={{ flex: 1, gap: 2 }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: theme.palette.primary.main,
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  flexShrink: 0,
                }}
              >
                {getInitials(authorName)}
              </Avatar>

              <Stack spacing={0} sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                  }}
                >
                  {authorName}
                </Typography>
              </Stack>
            </Stack>

            <Stack
              direction="row"
              spacing={theme.spacing(0.5)}
              alignItems="center"
              sx={{ minWidth: "fit-content", ml: "auto" }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  color: theme.palette.text.secondary,
                  whiteSpace: "nowrap",
                }}
              >
                {createdTime}
              </Typography>

              {note.is_edited && updatedTime && (
                <Typography
                  sx={{
                    fontSize: 12,
                    color: theme.palette.text.secondary,
                    fontStyle: "italic",
                    whiteSpace: "nowrap",
                  }}
                >
                  • Edited {updatedTime}
                </Typography>
              )}
            </Stack>
          </Stack>

          {/* Action Menu */}
          {(canEdit || canDelete) && (
            <Box sx={{ ml: theme.spacing(1.5) }}>
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{
                  color: theme.palette.text.secondary,
                  padding: theme.spacing(1),
                  transition: `background-color ${0.2}s ease-in-out`,
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <MenuIcon size={18} />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                {canEdit && (
                  <MenuItem
                    onClick={handleEdit}
                    sx={{ color: theme.palette.text.primary, fontSize: 13 }}
                  >
                    <EditIcon size={16} style={{ marginRight: 8 }} />
                    Edit
                  </MenuItem>
                )}
                {canDelete && (
                  <MenuItem
                    onClick={handleDeleteClick}
                    sx={{ color: theme.palette.error.main, fontSize: 13 }}
                  >
                    <DeleteIcon size={16} style={{ marginRight: 8 }} />
                    Delete
                  </MenuItem>
                )}
              </Menu>
            </Box>
          )}
        </Box>

        <Divider sx={{ margin: 0, borderColor: theme.palette.border.light }} />

        {/* Note Content */}
        <Box sx={{ padding: theme.spacing(5) }}>
          <Typography
            sx={{
              fontSize: 13,
              color: theme.palette.text.primary,
              lineHeight: 1.7,
              wordWrap: "break-word",
              whiteSpace: "pre-wrap",
              letterSpacing: "0.2px",
            }}
          >
            {note.content}
          </Typography>
        </Box>
      </Stack>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <ConfirmationModal
          title="Confirm delete"
          body={
            <Typography
              fontSize={13}
              sx={{ color: theme.palette.text.secondary }}
            >
              Are you sure you want to delete this note? This action cannot be
              undone.
            </Typography>
          }
          cancelText="Cancel"
          proceedText="Delete"
          proceedButtonColor="error"
          proceedButtonVariant="contained"
          onCancel={() => setIsDeleteModalOpen(false)}
          onProceed={handleConfirmDelete}
        />
      )}
    </Box>
  );
};

export default NoteItem;

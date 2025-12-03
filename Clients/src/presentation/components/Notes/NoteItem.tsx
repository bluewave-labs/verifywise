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
  Card,
  Stack,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  Avatar,
} from "@mui/material";
import {
  MoreVertical as MenuIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

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

  const handleDelete = () => {
    onDelete(note.id);
    handleMenuClose();
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
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.mode === "dark" ? "#1e1e1e" : "#fafafa",
        padding: 2,
        marginBottom: 2,
        borderRadius: 1,
      }}
    >
      <Stack spacing={1.5}>
        {/* Note Header - Author and Timestamp */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flex: 1 }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: theme.palette.primary.main,
                fontSize: "0.75rem",
              }}
            >
              {getInitials(authorName)}
            </Avatar>

            <Stack spacing={0.25} sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {authorName}
              </Typography>

              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  {createdTime}
                </Typography>

                {note.is_edited && updatedTime && (
                  <>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      •
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontStyle: "italic",
                      }}
                    >
                      Edited {updatedTime}
                    </Typography>
                  </>
                )}
              </Stack>
            </Stack>
          </Stack>

          {/* Action Menu */}
          {(canEdit || canDelete) && (
            <Box>
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{ color: theme.palette.text.secondary }}
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
                    sx={{ color: theme.palette.text.primary }}
                  >
                    <EditIcon size={16} style={{ marginRight: 8 }} />
                    Edit
                  </MenuItem>
                )}
                {canDelete && (
                  <MenuItem
                    onClick={handleDelete}
                    sx={{ color: theme.palette.error.main }}
                  >
                    <DeleteIcon size={16} style={{ marginRight: 8 }} />
                    Delete
                  </MenuItem>
                )}
              </Menu>
            </Box>
          )}
        </Box>

        {/* Note Content */}
        <Typography
          sx={{
            color: theme.palette.text.primary,
            lineHeight: 1.6,
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {note.content}
        </Typography>
      </Stack>
    </Card>
  );
};

export default NoteItem;

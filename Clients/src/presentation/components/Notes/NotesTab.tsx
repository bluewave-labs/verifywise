/**
 * @fileoverview NotesTab Component
 *
 * Main container component for the Notes feature within a drawer/dialog.
 * Manages note state, handles CRUD operations, and orchestrates child components.
 *
 * Props:
 * - attachedTo: Entity type (e.g., NIST_SUBCATEGORY)
 * - attachedToId: Entity ID
 *
 * @module components/Notes
 */

import React, { useState, useEffect, useCallback } from "react";
import { Stack } from "@mui/material";
import { AlertProps } from "../../../domain/interfaces/iAlert";
import { useAuth } from "../../../application/hooks/useAuth";
import * as notesRepository from "../../../application/repository/notes.repository";
import NoteComposer from "./NoteComposer";
import NotesList from "./NotesList";
import Alert from "../Alert";

interface Note {
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
}

interface NotesTabProps {
  attachedTo: string;
  attachedToId: string;
}

const NotesTab: React.FC<NotesTabProps> = ({ attachedTo, attachedToId }) => {
  const { userId, userRoleName } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [alert, setAlert] = useState<AlertProps | null>(null);

  // Fetch notes on component mount or when entity changes
  const fetchNotes = useCallback(async () => {
    if (!attachedToId || !attachedTo) {
      setNotes([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await notesRepository.getNotes(attachedTo, attachedToId);
      // Ensure response is always an array
      setNotes(Array.isArray(response) ? response : []);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load notes";
      setAlert({
        variant: "error",
        body: errorMessage,
        isToast: true,
      });
      // Set empty array on error to prevent crashes
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [attachedTo, attachedToId]);

  useEffect(() => {
    fetchNotes();
  }, [attachedTo, attachedToId, fetchNotes]);

  const handleAddNote = useCallback(
    async (content: string) => {
      if (!content.trim()) {
        setAlert({
          variant: "error",
          body: "Note content cannot be empty",
          isToast: true,
        });
        return;
      }

      setIsSaving(true);
      try {
        const newNote = await notesRepository.createNote({
          content,
          attached_to: attachedTo,
          attached_to_id: attachedToId,
        });
        setNotes([newNote, ...notes]);

        setAlert({
          variant: "success",
          body: "Note added successfully",
          isToast: true,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to add note";
        setAlert({
          variant: "error",
          body: errorMessage,
          isToast: true,
        });
      } finally {
        setIsSaving(false);
      }
    },
    [attachedTo, attachedToId, notes]
  );

  const handleEditNote = useCallback((noteId: number, content: string) => {
    setEditingNoteId(noteId);
    setEditingContent(content);
  }, []);

  const handleSaveEdit = useCallback(
    async (content: string) => {
      if (!editingNoteId) return;

      if (!content.trim()) {
        setAlert({
          variant: "error",
          body: "Note content cannot be empty",
          isToast: true,
        });
        return;
      }

      setIsSaving(true);
      try {
        const updatedNote = await notesRepository.updateNote(editingNoteId, {
          content,
        });
        const updatedNotes = notes.map((note) =>
          note.id === editingNoteId ? updatedNote : note
        );
        setNotes(updatedNotes);

        setEditingNoteId(null);
        setEditingContent("");

        setAlert({
          variant: "success",
          body: "Note updated successfully",
          isToast: true,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update note";
        setAlert({
          variant: "error",
          body: errorMessage,
          isToast: true,
        });
      } finally {
        setIsSaving(false);
      }
    },
    [editingNoteId, notes]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingNoteId(null);
    setEditingContent("");
  }, []);

  const handleDeleteNote = useCallback(
    async (noteId: number) => {
      if (!window.confirm("Are you sure you want to delete this note?")) {
        return;
      }

      setIsSaving(true);
      try {
        await notesRepository.deleteNote(noteId);
        setNotes(notes.filter((note) => note.id !== noteId));

        setAlert({
          variant: "success",
          body: "Note deleted successfully",
          isToast: true,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete note";
        setAlert({
          variant: "error",
          body: errorMessage,
          isToast: true,
        });
      } finally {
        setIsSaving(false);
      }
    },
    [notes]
  );

  const handleCloseAlert = () => {
    setAlert(null);
  };

  // Auto-dismiss alerts after 3 seconds
  useEffect(() => {
    if (alert) {
      const timeoutId = setTimeout(() => {
        setAlert(null);
      }, 3000); // 3 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [alert]);

  return (
    <Stack spacing={2} sx={{ height: "100%" }}>
      {/* Alert */}
      {alert && (
        <Alert
          variant={alert.variant}
          body={alert.body}
          isToast={alert.isToast}
          onClick={handleCloseAlert}
        />
      )}

      {/* Note Composer */}
      {editingNoteId ? (
        <NoteComposer
          initialContent={editingContent}
          onSubmit={handleSaveEdit}
          onCancel={handleCancelEdit}
          isLoading={isSaving}
          isEditing={true}
        />
      ) : (
        <NoteComposer
          onSubmit={handleAddNote}
          isLoading={isSaving}
          isEditing={false}
        />
      )}

      {/* Notes List */}
      <NotesList
        notes={notes}
        onEdit={handleEditNote}
        onDelete={handleDeleteNote}
        currentUserId={userId || 0}
        currentUserRole={userRoleName || ""}
        isLoading={isLoading}
      />
    </Stack>
  );
};

export default NotesTab;

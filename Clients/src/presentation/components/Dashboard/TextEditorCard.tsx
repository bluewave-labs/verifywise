import React, { useEffect, useCallback, useRef, useState } from 'react';
import { Box, Card, CardContent, useTheme, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, CircularProgress } from '@mui/material';
import { CheckCircle as CheckCircleIcon, CloudOff as CloudOffIcon, Error as ErrorIcon } from '@mui/icons-material';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import DOMPurify from 'dompurify';
import { cardStyles } from '../../themes';
import { useAuth } from '../../../application/hooks/useAuth';
import { updateUserNotes, getUserNotes } from '../../../application/repository/user.repository';

const TextEditorCard: React.FC = () => {
  const theme = useTheme();
  const { userToken } = useAuth();

  // Conflict resolution state
  const [conflictData, setConflictData] = useState<{
    local: string;
    remote: string;
  } | null>(null);

  // Save status state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'offline'>('saved');

  // Mutex and queue for preventing race conditions
  const saveMutexRef = useRef(false);
  const saveQueueRef = useRef<string[]>([]);

  // Storage keys
  const getStorageKey = useCallback(() => {
    const userId = userToken?.id || 'anonymous';
    return `verifywise_notes_${userId}`;
  }, [userToken]);

  // Sanitization function
  const sanitizeContent = useCallback((html: string): string => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'em', 'br'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
  }, []);

  // Database operations
  const saveToDatabase = useCallback(async (content: string): Promise<boolean> => {
    try {
      if (!userToken?.id) {
        console.log('No user ID available, skipping database save');
        return false;
      }

      // Sanitize content before saving to database
      const sanitizedContent = sanitizeContent(content);

      const response = await updateUserNotes({
        userId: userToken.id,
        notes: sanitizedContent
      });

      if (response?.status === 200 || response?.data) {
        console.log('Notes saved to database successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to save notes to database:', error);
      return false;
    }
  }, [userToken?.id]);

  const loadFromDatabase = useCallback(async (): Promise<string | null> => {
    try {
      if (!userToken?.id) {
        console.log('No user ID available, skipping database load');
        return null;
      }

      const notes = await getUserNotes({ userId: userToken.id });
      return notes;
    } catch (error) {
      console.error('Failed to load notes from database:', error);
      return null;
    }
  }, [userToken?.id]);

  // localStorage operations
  const saveToLocalStorage = useCallback((content: string) => {
    try {
      // Sanitize content before saving to localStorage
      const sanitizedContent = sanitizeContent(content);
      localStorage.setItem(getStorageKey(), sanitizedContent);
      return true;
    } catch (error) {
      console.error('Failed to save notes to localStorage:', error);
      return false;
    }
  }, [getStorageKey, sanitizeContent]);

  const loadFromLocalStorage = useCallback((): string | null => {
    try {
      return localStorage.getItem(getStorageKey());
    } catch (error) {
      console.error('Failed to load notes from localStorage:', error);
      return null;
    }
  }, [getStorageKey]);

  // Race-condition-safe save operation with mutex
  const saveContent = useCallback(async (content: string) => {
    // Add to queue
    saveQueueRef.current.push(content);

    // If already saving, return (the current save will pick up the latest from queue)
    if (saveMutexRef.current) {
      return;
    }

    // Acquire mutex
    saveMutexRef.current = true;
    setSaveStatus('saving');

    try {
      // Process queue until empty
      while (saveQueueRef.current.length > 0) {
        // Get the latest content (discard intermediate versions)
        const latestContent = saveQueueRef.current[saveQueueRef.current.length - 1];
        saveQueueRef.current = []; // Clear queue

        // Try database first
        const dbSaveSuccess = await saveToDatabase(latestContent);

        if (dbSaveSuccess) {
          setSaveStatus('saved');
          console.log('Notes saved to database');
        } else {
          // Fall back to localStorage
          const lsSuccess = saveToLocalStorage(latestContent);
          if (lsSuccess) {
            setSaveStatus('offline');
            console.log('Notes saved to localStorage (offline)');
          } else {
            setSaveStatus('error');
            console.error('Failed to save notes to both database and localStorage');
            break; // Exit loop on error
          }
        }
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('Error during save operation:', error);
    } finally {
      // Release mutex
      saveMutexRef.current = false;
    }
  }, [saveToDatabase, saveToLocalStorage]);


  // Debounced save function
  const debouncedSaveRef = useRef<NodeJS.Timeout>();

  const debouncedSave = useCallback((content: string) => {
    if (debouncedSaveRef.current) {
      clearTimeout(debouncedSaveRef.current);
    }
    debouncedSaveRef.current = setTimeout(() => {
      saveContent(content);
    }, 1000); // Save after 1 second of no typing
  }, [saveContent]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure which extensions to use
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start typing your notes...',
      }),
    ],
    content: '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      debouncedSave(html);
    },
  });

  // Load content on mount - try database first, then localStorage
  useEffect(() => {
    if (editor && userToken?.id) {
      const loadContent = async () => {
        try {
          // Try to load from database first
          const dbContent = await loadFromDatabase();

          if (dbContent && dbContent.trim() !== '<p></p>' && dbContent.trim() !== '') {
            // Sanitize content when loading from database
            const sanitizedDbContent = sanitizeContent(dbContent);
            editor.commands.setContent(sanitizedDbContent);
            console.log('Loaded notes from database');
            return;
          }

          // Fall back to localStorage
          const userId = userToken?.id || 'anonymous';
          const storageKey = `verifywise_notes_${userId}`;
          const localContent = localStorage.getItem(storageKey);

          if (localContent && localContent.trim() !== '<p></p>' && localContent.trim() !== '') {
            // Sanitize content when loading from localStorage
            const sanitizedLocalContent = sanitizeContent(localContent);
            editor.commands.setContent(sanitizedLocalContent);
            console.log('Loaded notes from localStorage');

            // Migrate localStorage content to database
            if (userToken?.id) {
              const dbSaveSuccess = await saveToDatabase(sanitizedLocalContent);
              if (dbSaveSuccess) {
                console.log('Migrated localStorage notes to database');
                // Optionally clear localStorage after successful migration
                // localStorage.removeItem(storageKey);
              }
            }
          } else {
            editor.commands.setContent('<p></p>');
          }
        } catch (error) {
          console.error('Failed to load notes:', error);
          editor.commands.setContent('<p></p>');
        }
      };

      loadContent();
    }
  }, [editor, userToken?.id]);

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === getStorageKey() && e.newValue && editor) {
        const currentContent = editor.getHTML();
        const sanitizedNewValue = sanitizeContent(e.newValue);

        // Only show conflict if content actually differs
        if (currentContent.trim() !== sanitizedNewValue.trim() &&
            currentContent.trim() !== '<p></p>' && currentContent.trim() !== '') {
          console.log('Cross-tab conflict detected');
          setConflictData({
            local: currentContent,
            remote: sanitizedNewValue
          });
        } else {
          // No conflict, just update
          editor.commands.setContent(sanitizedNewValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [editor, userToken?.id]);

  // Cleanup effect for pending saves and user logout protection
  useEffect(() => {
    // Store previous user ID in a ref to track changes
    const currentUserId = userToken?.id;

    // Cleanup on unmount or user change
    return () => {
      if (debouncedSaveRef.current) {
        clearTimeout(debouncedSaveRef.current);
        // Attempt final save before cleanup
        const content = editor?.getHTML();
        if (content && content.trim() !== '<p></p>') {
          // Use the current content for immediate save
          if (currentUserId) {
            try {
              localStorage.setItem(`verifywise_notes_${currentUserId}`, content);
            } catch (error) {
              console.error('Failed final save on cleanup:', error);
            }
          }
        }
      }
    };
  }, [userToken?.id, editor]);

  // BeforeUnload warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveMutexRef.current || debouncedSaveRef.current) {
        e.preventDefault();
        e.returnValue = 'You have unsaved notes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);


  if (!editor) {
    return null;
  }


  // Save status indicator component (hidden for clean UI)
  const SaveStatusIndicator = () => {
    // Only show error icon for critical failures
    if (saveStatus === 'error') {
      return (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '50%',
            padding: '4px',
            fontSize: '11px',
            fontWeight: 500,
            zIndex: 1,
          }}
        >
          <ErrorIcon sx={{ color: 'error.main', fontSize: 16 }} />
        </Box>
      );
    }

    // Hide all other status indicators for clean UI
    return null;
  };

  return (
    <Card
      sx={(theme) => ({
        ...cardStyles.base(theme) as any,
        height: '100%',
        background: 'linear-gradient(135deg, #FFF9C4 0%, #F0E68C 100%)', // Light yellow gradient
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)', // Subtle shadow to pop above screen
        border: `1px solid ${theme.palette.divider}`, // Same border as other blocks
        position: 'relative',
        transition: 'all 0.2s ease',
      })}
    >
      <SaveStatusIndicator />

      <CardContent sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        '&:last-child': { pb: 2 }
      }}>

        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            '& .ProseMirror': {
              padding: '8px',
              outline: 'none',
              fontSize: '13px',
              lineHeight: 1.4,
              minHeight: '100px',
              backgroundColor: 'transparent',
              '& p': {
                margin: '0 0 8px 0',
              },
              '& h1, & h2, & h3': {
                margin: '8px 0',
                fontWeight: 600,
              },
              '& h1': {
                fontSize: '18px',
              },
              '& h2': {
                fontSize: '16px',
              },
              '& h3': {
                fontSize: '14px',
              },
              '& ul, & ol': {
                paddingLeft: '20px',
                margin: '8px 0',
              },
              '& li': {
                margin: '2px 0',
              },
              // TipTap placeholder styles
              '& .is-editor-empty:first-of-type::before': {
                color: '#999',
                content: 'attr(data-placeholder)',
                float: 'left',
                height: 0,
                pointerEvents: 'none',
              },
            },
          }}
        >
          <EditorContent editor={editor} />
        </Box>
      </CardContent>

      {/* Conflict Resolution Dialog */}
      <Dialog
        open={!!conflictData}
        onClose={() => setConflictData(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Notes Conflict Detected
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your notes have been modified in another tab. Please choose which version to keep:
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Your Current Version:
              </Typography>
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  maxHeight: 200,
                  overflow: 'auto',
                  backgroundColor: 'background.paper',
                }}
                dangerouslySetInnerHTML={{ __html: sanitizeContent(conflictData?.local || '') }}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Other Tab Version:
              </Typography>
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  maxHeight: 200,
                  overflow: 'auto',
                  backgroundColor: 'background.paper',
                }}
                dangerouslySetInnerHTML={{ __html: sanitizeContent(conflictData?.remote || '') }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              if (conflictData && editor) {
                editor.commands.setContent(conflictData.local);
                setConflictData(null);
              }
            }}
            variant="outlined"
          >
            Keep Current Version
          </Button>
          <Button
            onClick={() => {
              if (conflictData && editor) {
                editor.commands.setContent(conflictData.remote);
                setConflictData(null);
              }
            }}
            variant="contained"
          >
            Use Other Version
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default TextEditorCard;
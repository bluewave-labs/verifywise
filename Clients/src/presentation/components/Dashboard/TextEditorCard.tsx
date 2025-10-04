import React from 'react';
import { Box, Card, CardContent, useTheme } from '@mui/material';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { cardStyles } from '../../themes';

const TextEditorCard: React.FC = () => {
  const theme = useTheme();

  // Initialize TipTap editor with local storage
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your notes...',
      }),
    ],
    content: localStorage.getItem('dashboard-notes') || '',
    onUpdate: ({ editor }) => {
      // Save to localStorage on every update
      const content = editor.getHTML();
      localStorage.setItem('dashboard-notes', content);
    },
  });

  const editorStyles = {
    '& .ProseMirror': {
      outline: 'none',
      padding: theme.spacing(2),
      minHeight: '200px',
      fontSize: '14px',
      lineHeight: 1.6,
      color: theme.palette.text.primary,

      '& p': {
        margin: '0 0 1em 0',
      },

      '& h1, & h2, & h3, & h4, & h5, & h6': {
        margin: '1.5em 0 0.5em 0',
        fontWeight: 600,
      },

      '& ul, & ol': {
        paddingLeft: theme.spacing(3),
        margin: '1em 0',
      },

      '& li': {
        margin: '0.25em 0',
      },

      '& blockquote': {
        borderLeft: `3px solid ${theme.palette.primary.main}`,
        paddingLeft: theme.spacing(2),
        margin: '1em 0',
        fontStyle: 'italic',
      },

      '& code': {
        backgroundColor: theme.palette.grey[100],
        padding: '2px 4px',
        borderRadius: '3px',
        fontSize: '0.9em',
      },

      '& pre': {
        backgroundColor: theme.palette.grey[100],
        padding: theme.spacing(2),
        borderRadius: '4px',
        overflow: 'auto',

        '& code': {
          backgroundColor: 'transparent',
          padding: 0,
        },
      },

      // Placeholder styles
      '& p.is-editor-empty:first-of-type::before': {
        content: 'attr(data-placeholder)',
        float: 'left',
        color: theme.palette.text.disabled,
        pointerEvents: 'none',
        height: 0,
      },
    },
  };

  return (
    <Card sx={{ ...cardStyles, height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0 }}>
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.grey[50],
          }}
        >
          <Box sx={{ fontWeight: 600, fontSize: '16px', color: theme.palette.text.primary }}>
            Notes
          </Box>
          <Box sx={{ fontSize: '12px', color: theme.palette.text.secondary, mt: 0.5 }}>
            Local notes - changes saved automatically
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            ...editorStyles,
          }}
        >
          <EditorContent editor={editor} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default TextEditorCard;
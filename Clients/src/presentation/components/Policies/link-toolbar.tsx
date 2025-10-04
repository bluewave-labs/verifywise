'use client';

import * as React from 'react';
import type { TLinkElement } from 'platejs';

import {
  type UseVirtualFloatingOptions,
  flip,
  offset,
} from '@platejs/floating';
import { getLinkAttributes } from '@platejs/link';
import {
  type LinkFloatingToolbarState,
  FloatingLinkUrlInput,
  useFloatingLinkEdit,
  useFloatingLinkEditState,
  useFloatingLinkInsert,
  useFloatingLinkInsertState,
} from '@platejs/link/react';
import { KEYS } from 'platejs';
import {
  useEditorRef,
  useEditorSelection,
  useFormInputProps,
  usePluginOption,
} from 'platejs/react';

import {
  Box,
  Button,
  Divider,
  IconButton,
  Popover,
  TextField,
} from '@mui/material';
import {
  Link as LinkIcon,
  TextFields as TextIcon,
  LinkOff as UnlinkIcon,
  OpenInNew as ExternalLinkIcon,
} from '@mui/icons-material';

export function LinkFloatingToolbar({ state }: { state?: LinkFloatingToolbarState }) {
  const activeCommentId = usePluginOption({ key: KEYS.comment }, 'activeId');
  const activeSuggestionId = usePluginOption({ key: KEYS.suggestion }, 'activeId');

  const floatingOptions: UseVirtualFloatingOptions = React.useMemo(() => {
    return {
      middleware: [
        offset(8),
        flip({
          fallbackPlacements: ['bottom-end', 'top-start', 'top-end'],
          padding: 12,
        }),
      ],
      placement:
        activeSuggestionId || activeCommentId ? 'top-start' : 'bottom-start',
    };
  }, [activeCommentId, activeSuggestionId]);

  const insertState = useFloatingLinkInsertState({
    ...state,
    floatingOptions: { ...floatingOptions, ...state?.floatingOptions },
  });
  const { hidden, props: insertProps, ref: insertRef, textInputProps } =
    useFloatingLinkInsert(insertState);

  const editState = useFloatingLinkEditState({
    ...state,
    floatingOptions: { ...floatingOptions, ...state?.floatingOptions },
  });
  const { editButtonProps, props: editProps, ref: editRef, unlinkButtonProps } =
    useFloatingLinkEdit(editState);

  const inputProps = useFormInputProps({
    preventDefaultOnEnterKeydown: true,
  });

  if (hidden) return null;

  const input = (
    <Box sx={{ width: 330, display: 'flex', flexDirection: 'column', p: 1 }} {...inputProps}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <LinkIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
        <FloatingLinkUrlInput
          as={TextField}
          placeholder="Paste link"
        />
      </Box>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <TextIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
        <TextField
          size="small"
          fullWidth
          placeholder="Text to display"
          {...textInputProps}
        />
      </Box>
    </Box>
  );

  const editContent = editState.isEditing ? (
    input
  ) : (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Button size="small" variant="text" {...editButtonProps}>
        Edit link
      </Button>
      <Divider orientation="vertical" flexItem />
      <LinkOpenButton />
      <Divider orientation="vertical" flexItem />
      <IconButton size="small" {...unlinkButtonProps}>
        <UnlinkIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  return (
    <>
      <Popover
        open={!hidden}
        anchorEl={insertRef.current}
        {...insertProps}
        PaperProps={{ sx: { p: 1 } }}
      >
        {input}
      </Popover>

      <Popover
        open={!hidden}
        anchorEl={editRef.current}
        {...editProps}
        PaperProps={{ sx: { p: 1 } }}
      >
        {editContent}
      </Popover>
    </>
  );
}

function LinkOpenButton() {
  const editor = useEditorRef();
  const selection = useEditorSelection();

  const attributes = React.useMemo(() => {
    const entry = editor.api.node<TLinkElement>({
      match: { type: editor.getType(KEYS.link) },
    });
    if (!entry) return {};
    const [element] = entry;
    return getLinkAttributes(editor, element);
  }, [editor, selection]);

  return (
    <IconButton
      size="small"
      component="a"
      {...attributes}
      target="_blank"
      aria-label="Open link in new tab"
    >
      <ExternalLinkIcon fontSize="small" />
    </IconButton>
  );
}

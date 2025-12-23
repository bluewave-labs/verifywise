import { FC, forwardRef } from 'react';
import { Stack, IconButton, useTheme } from '@mui/material';
import { ComposerPrimitive } from '@assistant-ui/react';
import { Send } from 'lucide-react';

const CustomTextField = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>((props, ref) => {
  const theme = useTheme();

  // Using basic textarea instead of MUI TextField for better integration with ComposerPrimitive
  // (ComposerPrimitive.Input expects a HTMLTextAreaElement which MUI TextField does not directly provide)
  return (
    <textarea
      ref={ref}
      {...props}
      data-composer-input
      rows={2}
      style={{
        width: '100%',
        minHeight: '40px',
        resize: 'none',
        border: `1px solid ${theme.palette.border?.light}`,
        borderRadius: '10px',
        padding: '8px 12px',
        fontSize: '13px',
        lineHeight: 1.5,
        backgroundColor: theme.palette.background.main,
        color: theme.palette.text.primary,
        outline: 'none',
        boxSizing: 'border-box',
      }}
    />
  );
});

export const CustomComposer: FC = () => {
  const theme = useTheme();

  return (
    <ComposerPrimitive.Root
      style={{
        borderTop: `1px solid ${theme.palette.border?.light}`,
        backgroundColor: theme.palette.background.main,
        padding: '12px',
      }}
    >
      <Stack direction="row" gap="8px" alignItems="flex-end">
        <ComposerPrimitive.Input
          asChild
          autoFocus
          placeholder="Ask me about AI risks, and models..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const form = e.currentTarget.form;
              if (form) {
                form.requestSubmit();
              }
            }
          }}
        >
          <CustomTextField />
        </ComposerPrimitive.Input>

        <ComposerPrimitive.Send asChild>
          <IconButton
            data-composer-submit
            type="submit"
            sx={{
              width: 40,
              height: 40,
              backgroundColor: theme.palette.primary.main,
              color: '#fff',
              '&:hover': {
                backgroundColor: '#0f604d',
              },
              '&.Mui-disabled': {
                backgroundColor: theme.palette.background.fill,
                color: theme.palette.text.accent,
              },
            }}
          >
            <Send size={18} />
          </IconButton>
        </ComposerPrimitive.Send>
      </Stack>

      <Stack
        direction="row"
        justifyContent="center"
        sx={{
          marginTop: '6px',
          fontSize: '10px',
          color: theme.palette.text.accent,
          textAlign: 'center',
        }}
      >
        Press Enter to send • Shift+Enter for new line
      </Stack>
    </ComposerPrimitive.Root>
  );
};

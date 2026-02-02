# React Component Template

Copy-paste template for creating React components in VerifyWise.

## Basic Component

```tsx
// components/ComponentName/ComponentName.tsx

// 1. External imports
import { useState, useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';

// 2. Internal imports
import { useData } from '@/hooks/useData';
import { formatDate } from '@/utils/formatters';

// 3. Type imports
import type { DataItem } from '@/types';

// 4. Props interface
interface ComponentNameProps {
  /** Unique identifier */
  id: string;
  /** Optional title override */
  title?: string;
  /** Callback when action is triggered */
  onAction?: (id: string) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
}

// 5. Component
export function ComponentName({
  id,
  title = 'Default Title',
  onAction,
  disabled = false,
}: ComponentNameProps) {
  // 5a. State hooks
  const [isExpanded, setIsExpanded] = useState(false);

  // 5b. Data hooks
  const { data, isLoading, error } = useData(id);

  // 5c. Callbacks
  const handleAction = useCallback(() => {
    if (onAction) {
      onAction(id);
    }
  }, [id, onAction]);

  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // 5d. Early returns for states
  if (isLoading) {
    return <ComponentNameSkeleton />;
  }

  if (error) {
    return (
      <Box sx={{ p: 2, color: 'error.main' }}>
        Failed to load data
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  // 5e. Main render
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="h6" component="h2">
        {title}
      </Typography>

      <Typography color="text.secondary">
        {data.description}
      </Typography>

      {isExpanded && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            Created: {formatDate(data.createdAt)}
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          onClick={handleToggle}
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </Button>

        <Button
          variant="contained"
          onClick={handleAction}
          disabled={disabled}
        >
          Take Action
        </Button>
      </Box>
    </Box>
  );
}

// 6. Skeleton component
function ComponentNameSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width="60%" height={32} />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="rectangular" height={40} sx={{ mt: 2 }} />
    </Box>
  );
}
```

## Component with Form

```tsx
// components/UserForm/UserForm.tsx

import { useState, useCallback, FormEvent } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
} from '@mui/material';

import type { User, CreateUserInput } from '@/types';

interface UserFormProps {
  /** Initial values for editing */
  initialValues?: Partial<CreateUserInput>;
  /** Called on successful submit */
  onSubmit: (data: CreateUserInput) => Promise<void>;
  /** Called on cancel */
  onCancel?: () => void;
  /** Whether form is in loading state */
  isLoading?: boolean;
}

export function UserForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: UserFormProps) {
  // Form state
  const [formData, setFormData] = useState<CreateUserInput>({
    name: initialValues?.name ?? '',
    email: initialValues?.email ?? '',
    password: '',
  });

  // Error state
  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserInput, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Field change handler
  const handleChange = useCallback(
    (field: keyof CreateUserInput) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
          ...prev,
          [field]: event.target.value,
        }));
        // Clear field error on change
        if (errors[field]) {
          setErrors(prev => ({ ...prev, [field]: undefined }));
        }
      },
    [errors]
  );

  // Validation
  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof CreateUserInput, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!initialValues && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, initialValues]);

  // Submit handler
  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setSubmitError(null);

      if (!validate()) {
        return;
      }

      try {
        await onSubmit(formData);
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : 'An error occurred'
        );
      }
    },
    [formData, validate, onSubmit]
  );

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      {submitError && (
        <Alert severity="error" onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      <TextField
        label="Name"
        value={formData.name}
        onChange={handleChange('name')}
        error={!!errors.name}
        helperText={errors.name}
        disabled={isLoading}
        required
      />

      <TextField
        label="Email"
        type="email"
        value={formData.email}
        onChange={handleChange('email')}
        error={!!errors.email}
        helperText={errors.email}
        disabled={isLoading}
        required
      />

      <TextField
        label="Password"
        type="password"
        value={formData.password}
        onChange={handleChange('password')}
        error={!!errors.password}
        helperText={errors.password || 'At least 8 characters'}
        disabled={isLoading}
        required={!initialValues}
      />

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </Box>
    </Box>
  );
}
```

## Component with Modal

```tsx
// components/ConfirmDialog/ConfirmDialog.tsx

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';

interface ConfirmDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Dialog title */
  title: string;
  /** Dialog message */
  message: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Confirm button color */
  confirmColor?: 'primary' | 'error' | 'warning';
  /** Whether action is in progress */
  isLoading?: boolean;
  /** Called on confirm */
  onConfirm: () => void;
  /** Called on cancel/close */
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">
        {title}
      </DialogTitle>

      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmColor}
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

## Index File

```tsx
// components/ComponentName/index.ts

export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName';
```

## Test File

```tsx
// components/ComponentName/ComponentName.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { ComponentName } from './ComponentName';

// Mock hooks
vi.mock('@/hooks/useData', () => ({
  useData: vi.fn(() => ({
    data: { description: 'Test description', createdAt: new Date() },
    isLoading: false,
    error: null,
  })),
}));

describe('ComponentName', () => {
  it('renders title and description', () => {
    render(<ComponentName id="1" title="Test Title" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('calls onAction when button is clicked', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(<ComponentName id="1" onAction={onAction} />);

    await user.click(screen.getByRole('button', { name: /take action/i }));

    expect(onAction).toHaveBeenCalledWith('1');
  });

  it('toggles expanded state', async () => {
    const user = userEvent.setup();

    render(<ComponentName id="1" />);

    // Initially collapsed
    expect(screen.queryByText(/created:/i)).not.toBeInTheDocument();

    // Expand
    await user.click(screen.getByRole('button', { name: /show more/i }));
    expect(screen.getByText(/created:/i)).toBeInTheDocument();

    // Collapse
    await user.click(screen.getByRole('button', { name: /show less/i }));
    expect(screen.queryByText(/created:/i)).not.toBeInTheDocument();
  });

  it('disables action button when disabled', () => {
    render(<ComponentName id="1" disabled />);

    expect(screen.getByRole('button', { name: /take action/i })).toBeDisabled();
  });
});
```

## Directory Structure

```
components/
└── ComponentName/
    ├── index.ts
    ├── ComponentName.tsx
    ├── ComponentName.test.tsx
    └── ComponentName.styles.ts  # (optional, if using styled-components)
```

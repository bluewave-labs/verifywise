# Component Guidelines

Guidelines for building React components in VerifyWise, including file structure, Material-UI usage, and accessibility.

## Component File Structure

### Single Component File

```tsx
// UserProfile.tsx

// 1. External imports
import { useState } from 'react';
import { Box, Typography, Avatar, Button } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';

// 2. Internal imports
import { useUser } from '@/hooks/useUser';
import { formatDate } from '@/utils/date';

// 3. Type imports
import type { User } from '@/types';

// 4. Types/Interfaces for this component
interface UserProfileProps {
  userId: string;
  onEdit?: (user: User) => void;
  showActions?: boolean;
}

// 5. Component
export function UserProfile({
  userId,
  onEdit,
  showActions = true,
}: UserProfileProps) {
  const { user, isLoading } = useUser(userId);
  const [isHovered, setIsHovered] = useState(false);

  if (isLoading) {
    return <UserProfileSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Avatar src={user.avatarUrl} alt={user.name} />
      <Typography variant="h6">{user.name}</Typography>
      <Typography color="text.secondary">{user.email}</Typography>
      {showActions && isHovered && (
        <Button
          startIcon={<EditIcon />}
          onClick={() => onEdit?.(user)}
        >
          Edit
        </Button>
      )}
    </Box>
  );
}

// 6. Sub-components (if small and only used here)
function UserProfileSkeleton() {
  return (
    <Box>
      <Skeleton variant="circular" width={40} height={40} />
      <Skeleton variant="text" width={120} />
      <Skeleton variant="text" width={180} />
    </Box>
  );
}
```

### Component Folder Structure

For larger components with multiple files:

```
components/
└── UserProfile/
    ├── index.ts                    # Exports
    ├── UserProfile.tsx             # Main component
    ├── UserProfile.test.tsx        # Tests
    ├── UserProfileSkeleton.tsx     # Loading skeleton
    ├── UserProfileActions.tsx      # Actions sub-component
    ├── hooks/
    │   └── useUserProfile.ts       # Component-specific hooks
    └── types.ts                    # Component types
```

```typescript
// index.ts
export { UserProfile } from './UserProfile';
export type { UserProfileProps } from './types';
```

## Material-UI Usage

### Theme Integration

Always use theme values instead of hardcoded values.

```tsx
// Bad: Hardcoded values
<Box
  sx={{
    padding: '16px',
    marginBottom: '24px',
    color: '#333333',
    backgroundColor: '#f5f5f5',
    fontSize: '14px',
  }}
>

// Good: Theme values
<Box
  sx={{
    p: 2,                        // theme.spacing(2)
    mb: 3,                       // theme.spacing(3)
    color: 'text.primary',       // theme.palette.text.primary
    bgcolor: 'grey.100',         // theme.palette.grey[100]
    fontSize: 'body2.fontSize',  // theme.typography.body2.fontSize
  }}
>
```

### Spacing

Use theme spacing units.

```tsx
// Theme spacing: 1 unit = 8px by default

// Shorthand props
<Box p={2} />      // padding: 16px
<Box m={3} />      // margin: 24px
<Box px={2} />     // paddingLeft, paddingRight: 16px
<Box my={1} />     // marginTop, marginBottom: 8px
<Box pt={4} />     // paddingTop: 32px

// In sx prop
<Box
  sx={{
    padding: 2,           // 16px
    margin: (theme) => theme.spacing(3), // 24px
    gap: 1,               // 8px (for flex/grid)
  }}
/>

// Mixed units when needed
<Box
  sx={{
    p: 2,
    width: 200,           // pixels for fixed widths
    minHeight: '100vh',   // viewport units
  }}
/>
```

### Colors

Use palette colors.

```tsx
// Theme colors
<Typography color="primary">Primary text</Typography>
<Typography color="secondary">Secondary text</Typography>
<Typography color="error">Error text</Typography>
<Typography color="text.primary">Main text</Typography>
<Typography color="text.secondary">Muted text</Typography>

// In sx prop
<Box
  sx={{
    color: 'primary.main',
    bgcolor: 'background.paper',
    borderColor: 'divider',

    // With opacity
    bgcolor: 'primary.light',

    // Conditional colors
    color: (theme) =>
      isError ? theme.palette.error.main : theme.palette.text.primary,
  }}
/>
```

### Typography

Use Typography component with variants.

```tsx
// Good: Semantic variants
<Typography variant="h1">Page Title</Typography>
<Typography variant="h2">Section Title</Typography>
<Typography variant="h6">Card Title</Typography>
<Typography variant="body1">Main content text</Typography>
<Typography variant="body2">Secondary text</Typography>
<Typography variant="caption">Small label</Typography>

// With component prop for semantic HTML
<Typography variant="h1" component="h2">
  Visually h1, semantically h2
</Typography>

// Bad: Inline styles
<span style={{ fontSize: '24px', fontWeight: 'bold' }}>Title</span>
```

### Responsive Design

Use breakpoint utilities.

```tsx
// Responsive sx values
<Box
  sx={{
    // Mobile-first approach
    width: '100%',
    padding: 1,

    // Breakpoint overrides
    sm: {
      width: '50%',
      padding: 2,
    },
    md: {
      width: '33%',
      padding: 3,
    },
  }}
/>

// Array syntax (xs, sm, md, lg, xl)
<Box
  sx={{
    width: ['100%', '50%', '33%'],
    p: [1, 2, 3],
  }}
/>

// useMediaQuery for logic
import { useMediaQuery, useTheme } from '@mui/material';

function ResponsiveComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return isMobile ? <MobileView /> : <DesktopView />;
}
```

### Custom Styling

Prefer sx prop over styled components for one-off styles.

```tsx
// Good: sx prop for component-specific styles
<Card
  sx={{
    maxWidth: 400,
    borderRadius: 2,
    boxShadow: 3,
    '&:hover': {
      boxShadow: 6,
    },
  }}
>

// Good: styled for reusable styled components
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 400,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
  '&:hover': {
    boxShadow: theme.shadows[6],
  },
}));

// Use in multiple places
<StyledCard>Content 1</StyledCard>
<StyledCard>Content 2</StyledCard>
```

## Accessibility (a11y)

### ARIA Labels

```tsx
// Good: Descriptive labels
<IconButton aria-label="Delete user John Doe">
  <DeleteIcon />
</IconButton>

<TextField
  label="Email address"
  inputProps={{
    'aria-describedby': 'email-helper-text',
  }}
/>
<FormHelperText id="email-helper-text">
  We'll never share your email
</FormHelperText>

// Good: Button with loading state
<Button
  disabled={isLoading}
  aria-busy={isLoading}
  aria-label={isLoading ? 'Submitting form' : 'Submit form'}
>
  {isLoading ? <CircularProgress size={20} /> : 'Submit'}
</Button>
```

### Keyboard Navigation

```tsx
// Good: Focusable custom elements
<Box
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Custom clickable element
</Box>

// Good: Skip links
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

### Semantic HTML

```tsx
// Good: Semantic elements
<header>
  <nav aria-label="Main navigation">
    {/* nav items */}
  </nav>
</header>

<main id="main-content">
  <article>
    <h1>Article Title</h1>
    <section aria-labelledby="section-1">
      <h2 id="section-1">Section Title</h2>
      {/* content */}
    </section>
  </article>
</main>

<aside aria-label="Related content">
  {/* sidebar */}
</aside>

<footer>
  {/* footer content */}
</footer>
```

### Color Contrast

```tsx
// Ensure sufficient contrast ratios
// Text on background: 4.5:1 minimum (WCAG AA)
// Large text: 3:1 minimum

// Use theme colors which should meet contrast requirements
<Typography color="text.primary">Main text</Typography>
<Typography color="text.secondary">Secondary text</Typography>

// Don't rely solely on color
<Chip
  label={isActive ? 'Active' : 'Inactive'}
  color={isActive ? 'success' : 'default'}
  icon={isActive ? <CheckIcon /> : <CloseIcon />} // Icon as additional indicator
/>
```

### Form Accessibility

```tsx
function AccessibleForm() {
  return (
    <form aria-labelledby="form-title">
      <Typography id="form-title" variant="h2">
        Contact Form
      </Typography>

      <TextField
        id="name"
        label="Full Name"
        required
        error={!!errors.name}
        helperText={errors.name}
        inputProps={{
          'aria-required': true,
          'aria-invalid': !!errors.name,
        }}
      />

      <FormControl error={!!errors.email}>
        <InputLabel htmlFor="email">Email</InputLabel>
        <Input
          id="email"
          aria-describedby="email-error"
        />
        {errors.email && (
          <FormHelperText id="email-error">
            {errors.email}
          </FormHelperText>
        )}
      </FormControl>

      <Button type="submit" variant="contained">
        Submit
      </Button>
    </form>
  );
}
```

## Component Patterns

### Loading States

```tsx
function DataComponent({ id }: Props) {
  const { data, isLoading, error } = useQuery(['data', id], fetchData);

  // Loading state
  if (isLoading) {
    return <DataSkeleton />;
  }

  // Error state
  if (error) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }

  // Empty state
  if (!data || data.length === 0) {
    return <EmptyState message="No data found" />;
  }

  // Success state
  return <DataDisplay data={data} />;
}

// Skeleton component
function DataSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width="60%" height={32} />
      <Skeleton variant="rectangular" height={200} />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="40%" />
    </Box>
  );
}
```

### Error States

```tsx
interface ErrorMessageProps {
  error: Error;
  onRetry?: () => void;
}

function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <Alert
      severity="error"
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        )
      }
    >
      <AlertTitle>Error</AlertTitle>
      {error.message || 'Something went wrong'}
    </Alert>
  );
}
```

### Empty States

```tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 8,
      }}
    >
      {icon && (
        <Box sx={{ color: 'text.secondary', mb: 2 }}>
          {icon}
        </Box>
      )}
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary" align="center" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      {action && (
        <Button variant="contained" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}
```

### Confirmation Dialogs

```tsx
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={20} /> : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

## JavaScript Popups & Notifications

### Alert Alternatives

Never use native `window.alert()`, `window.confirm()`, or `window.prompt()`. These block the UI thread, cannot be styled, and provide poor user experience. Use MUI components instead.

```tsx
// Bad: Native alerts
window.alert('Operation completed');
const confirmed = window.confirm('Are you sure?');

// Good: MUI Snackbar for notifications
import { Snackbar, Alert } from '@mui/material';

function NotificationExample() {
  const [open, setOpen] = useState(false);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={handleClose} severity="success" variant="filled">
        Operation completed successfully
      </Alert>
    </Snackbar>
  );
}

// Good: Dialog for confirmations (see Confirmation Dialogs section above)
```

### Modal Best Practices

Modals must follow these accessibility and usability requirements:

```tsx
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useRef, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function AccessibleModal({ open, onClose, title, children }: ModalProps) {
  const titleId = useId();
  const contentId = useId();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={contentId}
      // MUI handles these automatically, but documenting for clarity:
      // - Focus trapping within the modal
      // - Escape key closes the modal
      // - Backdrop click closes the modal (can be disabled with disableBackdropClick)
      // - Focus returns to trigger element on close
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent id={contentId}>
        {children}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
```

**Modal Requirements Checklist:**
- [ ] Has `aria-labelledby` pointing to the title
- [ ] Has `aria-describedby` pointing to the content (optional but recommended)
- [ ] Closes on Escape key press (MUI default)
- [ ] Traps focus within the modal (MUI default)
- [ ] Returns focus to trigger element on close (MUI default)
- [ ] Has a visible close mechanism (button or X icon)

### Notification Patterns (Snackbar/Toast)

Use Snackbars for brief, non-critical messages that don't require user action.

```tsx
import { Snackbar, Alert, AlertTitle, Button } from '@mui/material';

// Notification severity levels
type NotificationSeverity = 'success' | 'info' | 'warning' | 'error';

interface NotificationProps {
  open: boolean;
  message: string;
  severity: NotificationSeverity;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoHideDuration?: number;
}

function Notification({
  open,
  message,
  severity,
  onClose,
  action,
  autoHideDuration = 5000,
}: NotificationProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={(_, reason) => {
        if (reason !== 'clickaway') onClose();
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        action={
          action && (
            <Button color="inherit" size="small" onClick={action.onClick}>
              {action.label}
            </Button>
          )
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

// Usage with different severities
<Notification
  open={showSuccess}
  message="Changes saved successfully"
  severity="success"
  onClose={() => setShowSuccess(false)}
/>

<Notification
  open={showError}
  message="Failed to save changes"
  severity="error"
  onClose={() => setShowError(false)}
  action={{ label: 'Retry', onClick: handleRetry }}
  autoHideDuration={null} // Don't auto-hide errors that need action
/>
```

**Notification Guidelines:**
| Severity | Auto-Hide | Use Case |
|----------|-----------|----------|
| `success` | 3-5 seconds | Confirmations, completed actions |
| `info` | 5-7 seconds | Informational messages |
| `warning` | No auto-hide | Warnings requiring attention |
| `error` | No auto-hide | Errors requiring acknowledgment or action |

### Notification Context (Global State)

For app-wide notifications, use a context provider:

```tsx
// contexts/NotificationContext.tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert } from '@mui/material';

interface Notification {
  id: string;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  autoHideDuration?: number | null;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = crypto.randomUUID();
    setNotifications((prev) => [...prev, { ...notification, id }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showSuccess = useCallback((message: string) => {
    showNotification({ message, severity: 'success', autoHideDuration: 4000 });
  }, [showNotification]);

  const showError = useCallback((message: string) => {
    showNotification({ message, severity: 'error', autoHideDuration: null });
  }, [showNotification]);

  const showWarning = useCallback((message: string) => {
    showNotification({ message, severity: 'warning', autoHideDuration: null });
  }, [showNotification]);

  const showInfo = useCallback((message: string) => {
    showNotification({ message, severity: 'info', autoHideDuration: 5000 });
  }, [showNotification]);

  return (
    <NotificationContext.Provider
      value={{ showNotification, showSuccess, showError, showWarning, showInfo }}
    >
      {children}
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open
          autoHideDuration={notification.autoHideDuration}
          onClose={(_, reason) => {
            if (reason !== 'clickaway') removeNotification(notification.id);
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => removeNotification(notification.id)}
            severity={notification.severity}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

// Usage in components
function SaveButton() {
  const { showSuccess, showError } = useNotification();

  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Data saved successfully');
    } catch (error) {
      showError('Failed to save data');
    }
  };

  return <Button onClick={handleSave}>Save</Button>;
}
```

### Popup Accessibility Requirements

All popups, modals, and notifications must meet these accessibility standards:

```tsx
// 1. Screen Reader Announcements
// Use aria-live regions for dynamic content
<Alert
  severity="success"
  role="alert"              // Assertive announcement
  aria-live="polite"        // For non-urgent updates
>
  Your changes have been saved
</Alert>

// 2. Focus Management for Modals
// MUI Dialog handles this automatically, but for custom implementations:
function CustomModal({ open, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousActiveElement.current?.focus();
    }
  }, [open]);

  // Focus trap implementation...
}

// 3. Keyboard Interaction
// - Escape closes the popup
// - Tab cycles through focusable elements (trapped in modals)
// - Enter/Space activates buttons

// 4. ARIA Roles
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <h2 id="dialog-title">Dialog Title</h2>
  <p id="dialog-description">Dialog content description</p>
</div>

// For non-modal popups (dropdowns, tooltips)
<div role="menu" aria-label="Options menu">
  <button role="menuitem">Option 1</button>
  <button role="menuitem">Option 2</button>
</div>
```

**Accessibility Checklist for Popups:**
- [ ] Modal dialogs have `role="dialog"` and `aria-modal="true"`
- [ ] All popups have accessible names (`aria-label` or `aria-labelledby`)
- [ ] Focus is trapped within modals
- [ ] Focus returns to trigger element on close
- [ ] Escape key closes the popup
- [ ] Screen readers announce the popup opening
- [ ] Status messages use `role="alert"` or `role="status"`

## Component Testing

See [Frontend Testing](../07-testing/frontend-testing.md) for detailed testing guidelines.

```tsx
// UserCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
  };

  it('renders user information', () => {
    render(<UserCard user={mockUser} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const onEdit = jest.fn();
    render(<UserCard user={mockUser} onEdit={onEdit} />);

    await userEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(onEdit).toHaveBeenCalledWith(mockUser);
  });
});
```

## Summary Checklist

- [ ] Component uses function declaration
- [ ] Props interface defined with clear types
- [ ] Default values provided for optional props
- [ ] Loading, error, and empty states handled
- [ ] Uses theme values (not hardcoded colors/spacing)
- [ ] Accessible (ARIA labels, keyboard navigation)
- [ ] Tests written for key functionality
- [ ] Sub-components extracted when appropriate

## Related Documents

- [React Patterns](./react-patterns.md)
- [Hooks Guidelines](./hooks-guidelines.md)
- [State Management](./state-management.md)
- [Frontend Testing](../07-testing/frontend-testing.md)

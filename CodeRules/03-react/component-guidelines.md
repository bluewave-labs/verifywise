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

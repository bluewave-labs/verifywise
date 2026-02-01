# React Patterns

Recommended patterns and practices for React development in VerifyWise.

## Function Components

Always use function components. Class components are deprecated for new code.

```tsx
// Good: Function component
function UserProfile({ user }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </Card>
  );
}

// Avoid: Class component
class UserProfile extends React.Component<UserProfileProps> {
  // Don't use class components for new code
}
```

### Component Declaration

Use function declarations for components (not arrow functions).

```tsx
// Preferred: Function declaration
function UserCard({ user }: UserCardProps) {
  return <Card>{user.name}</Card>;
}

// Also acceptable but less preferred
const UserCard = ({ user }: UserCardProps) => {
  return <Card>{user.name}</Card>;
};

// Export named components
export function UserCard({ user }: UserCardProps) {
  return <Card>{user.name}</Card>;
}
```

## Component Organization

### File Structure

Each component should follow a consistent structure.

```tsx
// 1. Imports - grouped by type
// External libraries
import { useState, useCallback, useMemo } from 'react';
import { Box, Typography, Button } from '@mui/material';

// Internal modules
import { useUser } from '@/hooks/useUser';
import { formatDate } from '@/utils/date';

// Types
import type { User } from '@/types';

// Relative imports (same feature)
import { UserAvatar } from './UserAvatar';
import { useUserActions } from './hooks';

// 2. Types/Interfaces
interface UserCardProps {
  userId: string;
  onSelect?: (user: User) => void;
  variant?: 'compact' | 'detailed';
}

// 3. Component
export function UserCard({ userId, onSelect, variant = 'compact' }: UserCardProps) {
  // 3a. Hooks (in consistent order)
  const { user, isLoading, error } = useUser(userId);
  const [isExpanded, setIsExpanded] = useState(false);

  // 3b. Derived state / memoized values
  const displayName = useMemo(
    () => `${user?.firstName} ${user?.lastName}`,
    [user?.firstName, user?.lastName]
  );

  // 3c. Callbacks
  const handleClick = useCallback(() => {
    if (user && onSelect) {
      onSelect(user);
    }
  }, [user, onSelect]);

  // 3d. Effects (if needed)
  // useEffect(() => { ... }, [deps]);

  // 3e. Early returns for loading/error states
  if (isLoading) return <UserCardSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return null;

  // 3f. Main render
  return (
    <Card onClick={handleClick}>
      <UserAvatar user={user} />
      <Typography>{displayName}</Typography>
    </Card>
  );
}
```

### Co-located Files

Group related files together.

```
components/
└── UserCard/
    ├── index.ts           # Re-exports
    ├── UserCard.tsx       # Main component
    ├── UserCard.test.tsx  # Tests
    ├── UserCard.styles.ts # Styled components (if needed)
    ├── UserAvatar.tsx     # Sub-component
    └── hooks.ts           # Component-specific hooks
```

```typescript
// index.ts
export { UserCard } from './UserCard';
export type { UserCardProps } from './UserCard';
```

## Props Patterns

### Required vs Optional Props

```tsx
interface ButtonProps {
  // Required props
  children: React.ReactNode;
  onClick: () => void;

  // Optional props with defaults
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

### Children Props

```tsx
// Explicit children prop
interface CardProps {
  children: React.ReactNode;
  title?: string;
}

function Card({ children, title }: CardProps) {
  return (
    <div className="card">
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
}

// Render props pattern
interface DataLoaderProps<T> {
  url: string;
  children: (data: T, loading: boolean) => React.ReactNode;
}

function DataLoader<T>({ url, children }: DataLoaderProps<T>) {
  const { data, isLoading } = useFetch<T>(url);
  return <>{children(data, isLoading)}</>;
}

// Usage
<DataLoader<User[]> url="/api/users">
  {(users, loading) => loading ? <Spinner /> : <UserList users={users} />}
</DataLoader>
```

### Spread Props

```tsx
// Extend native HTML props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

function Button({ variant = 'primary', children, ...props }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} {...props}>
      {children}
    </button>
  );
}

// All native button props work
<Button variant="primary" type="submit" disabled>
  Submit
</Button>
```

## Composition Patterns

### Compound Components

Create components that work together.

```tsx
// Compound component pattern
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function Tabs({ children, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

function TabList({ children }: { children: React.ReactNode }) {
  return <div className="tab-list">{children}</div>;
}

function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within Tabs');

  return (
    <button
      className={context.activeTab === value ? 'active' : ''}
      onClick={() => context.setActiveTab(value)}
    >
      {children}
    </button>
  );
}

function TabPanel({ value, children }: { value: string; children: React.ReactNode }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within Tabs');

  if (context.activeTab !== value) return null;
  return <div className="tab-panel">{children}</div>;
}

// Attach sub-components
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

// Usage
<Tabs defaultTab="profile">
  <Tabs.List>
    <Tabs.Tab value="profile">Profile</Tabs.Tab>
    <Tabs.Tab value="settings">Settings</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="profile">Profile content</Tabs.Panel>
  <Tabs.Panel value="settings">Settings content</Tabs.Panel>
</Tabs>
```

### Render Props

```tsx
interface MouseTrackerProps {
  render: (position: { x: number; y: number }) => React.ReactNode;
}

function MouseTracker({ render }: MouseTrackerProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return <>{render(position)}</>;
}

// Usage
<MouseTracker
  render={({ x, y }) => (
    <div>Mouse position: {x}, {y}</div>
  )}
/>
```

### Higher-Order Components (HOC)

Use sparingly - prefer hooks for most cases.

```tsx
// HOC for adding loading state
function withLoading<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithLoading(props: P & { isLoading?: boolean }) {
    const { isLoading, ...rest } = props;

    if (isLoading) {
      return <Spinner />;
    }

    return <WrappedComponent {...(rest as P)} />;
  };
}

// Usage
const UserListWithLoading = withLoading(UserList);
<UserListWithLoading users={users} isLoading={isLoading} />
```

## Conditional Rendering

### Simple Conditions

```tsx
// Good: Short-circuit for simple conditions
function Greeting({ user }: { user: User | null }) {
  return (
    <div>
      {user && <span>Welcome, {user.name}!</span>}
      {!user && <span>Please log in</span>}
    </div>
  );
}

// Good: Ternary for either/or
function Greeting({ user }: { user: User | null }) {
  return (
    <div>
      {user ? (
        <span>Welcome, {user.name}!</span>
      ) : (
        <span>Please log in</span>
      )}
    </div>
  );
}
```

### Complex Conditions

```tsx
// For complex conditions, use early returns
function UserStatus({ user }: { user: User }) {
  if (!user.isActive) {
    return <InactiveUserBanner />;
  }

  if (user.isPremium) {
    return <PremiumUserBadge user={user} />;
  }

  if (user.isNewUser) {
    return <WelcomeMessage user={user} />;
  }

  return <StandardUserInfo user={user} />;
}

// Or extract to a helper function
function getUserStatusComponent(user: User): React.ReactNode {
  if (!user.isActive) return <InactiveUserBanner />;
  if (user.isPremium) return <PremiumUserBadge user={user} />;
  if (user.isNewUser) return <WelcomeMessage user={user} />;
  return <StandardUserInfo user={user} />;
}

function UserStatus({ user }: { user: User }) {
  return <div>{getUserStatusComponent(user)}</div>;
}
```

### Avoid Nested Ternaries

```tsx
// Bad: Hard to read
function Status({ status }: { status: Status }) {
  return (
    <span>
      {status === 'loading'
        ? 'Loading...'
        : status === 'error'
        ? 'Error!'
        : status === 'success'
        ? 'Done!'
        : 'Unknown'}
    </span>
  );
}

// Good: Use a map or switch
const STATUS_MESSAGES: Record<Status, string> = {
  loading: 'Loading...',
  error: 'Error!',
  success: 'Done!',
  idle: 'Ready',
};

function Status({ status }: { status: Status }) {
  return <span>{STATUS_MESSAGES[status]}</span>;
}
```

## Lists and Keys

### Key Best Practices

```tsx
// Good: Use unique, stable identifiers
function UserList({ users }: { users: User[] }) {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// Bad: Using index as key (causes issues with reordering)
function UserList({ users }: { users: User[] }) {
  return (
    <ul>
      {users.map((user, index) => (
        <li key={index}>{user.name}</li> // Don't do this
      ))}
    </ul>
  );
}

// Acceptable: Index as key when list is static and won't reorder
function StaticList() {
  const items = ['Home', 'About', 'Contact'];
  return (
    <nav>
      {items.map((item, index) => (
        <a key={index} href={`/${item.toLowerCase()}`}>{item}</a>
      ))}
    </nav>
  );
}
```

### Fragment Keys

```tsx
// When you need a key on a fragment
function Glossary({ items }: { items: GlossaryItem[] }) {
  return (
    <dl>
      {items.map(item => (
        <Fragment key={item.id}>
          <dt>{item.term}</dt>
          <dd>{item.definition}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
```

## Error Boundaries

### Class-Based Error Boundary

Error boundaries must be class components.

```tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

### Error Boundary Placement

```tsx
// Wrap major sections, not individual components
function App() {
  return (
    <ErrorBoundary>
      <Header />
      <ErrorBoundary fallback={<SidebarError />}>
        <Sidebar />
      </ErrorBoundary>
      <ErrorBoundary fallback={<ContentError />}>
        <MainContent />
      </ErrorBoundary>
      <Footer />
    </ErrorBoundary>
  );
}
```

## Performance Patterns

### Memoization

```tsx
// memo: Prevent re-renders when props haven't changed
const UserCard = memo(function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </Card>
  );
});

// useMemo: Memoize expensive computations
function UserList({ users, filter }: Props) {
  const filteredUsers = useMemo(
    () => users.filter(user => user.name.includes(filter)),
    [users, filter]
  );

  return <List items={filteredUsers} />;
}

// useCallback: Memoize callback functions
function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log('Clicked!');
  }, []); // Stable reference

  return <Child onClick={handleClick} />;
}
```

### Lazy Loading

```tsx
// Lazy load components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

## Summary

| Pattern | Use Case |
|---------|----------|
| **Function Components** | All new components |
| **Compound Components** | Related components that share state |
| **Render Props** | Sharing behavior between components |
| **HOCs** | Cross-cutting concerns (use sparingly) |
| **Error Boundaries** | Graceful error handling |
| **Memoization** | Performance optimization |
| **Lazy Loading** | Code splitting |

## Related Documents

- [Component Guidelines](./component-guidelines.md)
- [Hooks Guidelines](./hooks-guidelines.md)
- [State Management](./state-management.md)

# State Management

Guidelines for managing state in VerifyWise React applications.

## State Categories

Choose the right state management approach based on the type of state.

| State Type | Solution | Examples |
|------------|----------|----------|
| **UI State** | useState, useReducer | Modal open, form inputs, accordion expanded |
| **Server State** | React Query | User data, list items, API responses |
| **Global UI State** | Context, Redux | Theme, sidebar collapsed, toast notifications |
| **URL State** | React Router | Filters, pagination, current page |
| **Form State** | React Hook Form | Complex form data with validation |

## Local State (useState)

Use for UI state that belongs to a single component.

```tsx
function SearchInput() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={isFocused ? 'focused' : ''}
    />
  );
}
```

### When to Use useState

- Form input values
- Toggle states (open/closed, expanded/collapsed)
- Temporary UI states
- State not needed by parent or sibling components

## useReducer

Use for complex state logic with multiple sub-values or when next state depends on previous.

```tsx
interface FormState {
  values: {
    email: string;
    password: string;
  };
  errors: {
    email?: string;
    password?: string;
  };
  isSubmitting: boolean;
  isValid: boolean;
}

type FormAction =
  | { type: 'SET_FIELD'; field: string; value: string }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END' };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error },
        isValid: false,
      };
    case 'CLEAR_ERRORS':
      return { ...state, errors: {}, isValid: true };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true };
    case 'SUBMIT_END':
      return { ...state, isSubmitting: false };
    default:
      return state;
  }
}

function LoginForm() {
  const [state, dispatch] = useReducer(formReducer, {
    values: { email: '', password: '' },
    errors: {},
    isSubmitting: false,
    isValid: true,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SUBMIT_START' });
    try {
      await login(state.values);
    } finally {
      dispatch({ type: 'SUBMIT_END' });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={state.values.email}
        onChange={(e) =>
          dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })
        }
      />
      {state.errors.email && <span>{state.errors.email}</span>}
      {/* ... */}
    </form>
  );
}
```

## React Query (Server State)

Use React Query for all server-state management.

### Setup

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}
```

### Basic Queries

```tsx
// hooks/useUsers.ts
export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => userService.getAll(filters),
  });
}

// hooks/useUser.ts
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getById(userId),
    enabled: !!userId, // Don't fetch if no userId
  });
}

// Usage in component
function UserList() {
  const { data: users, isLoading, error } = useUsers();

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <ul>
      {users?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Query Keys

Use consistent, hierarchical query keys.

```tsx
// Query key factory
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Usage
useQuery({
  queryKey: userKeys.detail(userId),
  queryFn: () => userService.getById(userId),
});

// Invalidation
queryClient.invalidateQueries({ queryKey: userKeys.all }); // All user queries
queryClient.invalidateQueries({ queryKey: userKeys.lists() }); // All list queries
queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) }); // Specific user
```

### Mutations

```tsx
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserInput) => userService.create(data),
    onSuccess: (newUser) => {
      // Invalidate and refetch user lists
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      // Or optimistically add to cache
      queryClient.setQueryData(userKeys.detail(newUser.id), newUser);
    },
    onError: (error) => {
      console.error('Failed to create user:', error);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      userService.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData(userKeys.detail(id));

      // Optimistically update
      queryClient.setQueryData(userKeys.detail(id), (old: User) => ({
        ...old,
        ...data,
      }));

      return { previousUser };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(id), context.previousUser);
      }
    },
    onSettled: (data, error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

// Usage
function UserForm({ userId }: { userId: string }) {
  const updateUser = useUpdateUser();

  const handleSubmit = (data: UpdateUserInput) => {
    updateUser.mutate(
      { id: userId, data },
      {
        onSuccess: () => {
          toast.success('User updated');
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={updateUser.isPending}>
        {updateUser.isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

### Pagination

```tsx
export function useUsersPaginated(page: number, limit: number) {
  return useQuery({
    queryKey: ['users', 'paginated', { page, limit }],
    queryFn: () => userService.getPaginated(page, limit),
    placeholderData: keepPreviousData, // Keep old data while fetching
  });
}

function UserTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isPlaceholderData } = useUsersPaginated(page, 10);

  return (
    <div>
      <table style={{ opacity: isPlaceholderData ? 0.5 : 1 }}>
        {/* table content */}
      </table>
      <button
        onClick={() => setPage(p => p - 1)}
        disabled={page === 1}
      >
        Previous
      </button>
      <button
        onClick={() => setPage(p => p + 1)}
        disabled={!data?.hasMore}
      >
        Next
      </button>
    </div>
  );
}
```

### Infinite Queries

```tsx
export function useUsersInfinite() {
  return useInfiniteQuery({
    queryKey: ['users', 'infinite'],
    queryFn: ({ pageParam = 1 }) => userService.getPaginated(pageParam, 20),
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined,
    initialPageParam: 1,
  });
}

function InfiniteUserList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUsersInfinite();

  return (
    <div>
      {data?.pages.map((page, i) => (
        <Fragment key={i}>
          {page.users.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </Fragment>
      ))}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading...' : 'Load More'}
      </button>
    </div>
  );
}
```

## Context API

Use for global UI state that doesn't change frequently.

### Creating Context

```tsx
// context/ThemeContext.tsx
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'light' ? 'dark' : 'light'));
  }, []);

  // Memoize to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Splitting Context

Split contexts by update frequency to prevent unnecessary re-renders.

```tsx
// Separate contexts for different concerns
const UserContext = createContext<User | null>(null);
const UserActionsContext = createContext<UserActions | null>(null);

function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Actions don't change, so they don't need to be in the same context
  const actions = useMemo(
    () => ({
      login: async (credentials: Credentials) => {
        const user = await authService.login(credentials);
        setUser(user);
      },
      logout: () => {
        authService.logout();
        setUser(null);
      },
    }),
    []
  );

  return (
    <UserContext.Provider value={user}>
      <UserActionsContext.Provider value={actions}>
        {children}
      </UserActionsContext.Provider>
    </UserContext.Provider>
  );
}

// Separate hooks
const useUser = () => useContext(UserContext);
const useUserActions = () => useContext(UserActionsContext);
```

## Redux Toolkit (VerifyWise Setup)

VerifyWise uses Redux Toolkit with `redux-persist` for client-side state management.

### Store Structure

```typescript
// application/redux/store.ts
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "ui"],  // Only these slices are persisted
};

const rootReducer = combineReducers({
  ui: uiSlice,
  auth: authReducer,
  files: fileReducer,
});

export const store = configureStore({
  reducer: persistReducer(persistConfig, rootReducer),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Auth Slice (Core Slice)

The auth slice is the primary Redux slice in VerifyWise:

```typescript
// Auth state shape
interface AuthState {
  isLoading: boolean;
  authToken: string;
  user: string;
  userExists: boolean;
  success: boolean | null;
  message: string | null;
  expirationDate: number | null;
  onboardingStatus: string;
  isOrgCreator: boolean;
}

// Key actions
import { clearAuthState, setAuthToken, setUserExists } from "./auth/authSlice";

// Logout
dispatch(clearAuthState());

// Set token after login
dispatch(setAuthToken(token));
```

### Available Slices

| Slice | Purpose | Persisted |
|-------|---------|-----------|
| `auth` | Authentication token, user info, onboarding | Yes |
| `ui` | Sidebar state, modal state | Yes |
| `files` | File upload state | No |

### Version-Based Cache Invalidation

The store automatically clears persisted data when the app version changes, ensuring users get fresh state on updates.

### Using in Components

```tsx
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/application/redux/store";

function MyComponent() {
  const { authToken, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  // Check role
  const role = useSelector((state: RootState) => state.auth.role);
  if (role !== "Admin") {
    return <AccessDenied />;
  }

  return <AdminContent />;
}
```

## Repository Pattern (Data Access)

VerifyWise uses a repository pattern for API calls, located in `application/repository/`.

### Repository Structure

```typescript
// application/repository/entity.repository.ts
import CustomAxios from "@/infrastructure/api/customAxios";

const BASE_URL = "/entities";

export const entityRepository = {
  async getAll(): Promise<Entity[]> {
    const response = await CustomAxios.get(BASE_URL);
    return response.data.data;
  },

  async getById(id: string): Promise<Entity> {
    const response = await CustomAxios.get(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  async create(data: CreateEntityDto): Promise<Entity> {
    const response = await CustomAxios.post(BASE_URL, data);
    return response.data.data;
  },

  async update(id: string, data: UpdateEntityDto): Promise<Entity> {
    const response = await CustomAxios.patch(`${BASE_URL}/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await CustomAxios.delete(`${BASE_URL}/${id}`);
  },
};
```

### Using with React Query

```typescript
// application/hooks/useEntity.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entityRepository } from "@/application/repository/entity.repository";

export function useEntity(id: string) {
  return useQuery({
    queryKey: ["entity", id],
    queryFn: () => entityRepository.getById(id),
    enabled: !!id,
  });
}

export function useCreateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: entityRepository.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });
}
```

## URL State

Use URL for shareable, bookmarkable state.

```tsx
import { useSearchParams } from 'react-router-dom';

function UserFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || 'all';
  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page')) || 1;

  const updateFilters = (updates: Record<string, string>) => {
    setSearchParams(prev => {
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          prev.set(key, value);
        } else {
          prev.delete(key);
        }
      });
      return prev;
    });
  };

  return (
    <div>
      <input
        value={search}
        onChange={(e) => updateFilters({ search: e.target.value, page: '1' })}
      />
      <select
        value={status}
        onChange={(e) => updateFilters({ status: e.target.value, page: '1' })}
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
}
```

## State Colocation

Keep state as close to where it's used as possible.

```tsx
// Bad: State too high in tree
function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div>
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <UserList
        searchQuery={searchQuery}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        modalOpen={modalOpen}
        onOpenModal={() => setModalOpen(true)}
        onCloseModal={() => setModalOpen(false)}
      />
    </div>
  );
}

// Good: State colocated with consumers
function App() {
  return (
    <div>
      <Header />
      <UserList />
    </div>
  );
}

function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  // searchQuery only used here
  return <SearchInput value={searchQuery} onChange={setSearchQuery} />;
}

function UserList() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  // These states only used in this subtree
  return (
    <>
      <List onSelectUser={setSelectedUser} />
      {modalOpen && <UserModal user={selectedUser} onClose={() => setModalOpen(false)} />}
    </>
  );
}
```

## Summary

| State Type | Solution | When to Use |
|------------|----------|-------------|
| `useState` | Local UI state | Single component state |
| `useReducer` | Local complex state | Multiple related values |
| React Query | Server state | API data |
| Context | Global UI state | Theme, auth, rarely changing |
| Redux | Complex global state | Frequently changing, complex |
| URL params | Shareable state | Filters, pagination |

## Related Documents

- [React Patterns](./react-patterns.md)
- [Hooks Guidelines](./hooks-guidelines.md)
- [Component Guidelines](./component-guidelines.md)

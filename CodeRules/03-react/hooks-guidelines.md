# Hooks Guidelines

Guidelines for using React hooks effectively in VerifyWise.

## Rules of Hooks

These rules are enforced by our ESLint configuration.

### 1. Only Call Hooks at the Top Level

```tsx
// Bad: Hook inside condition
function UserProfile({ userId }: Props) {
  if (!userId) {
    return null;
  }
  const user = useUser(userId); // Error: Hook inside condition
  return <div>{user.name}</div>;
}

// Good: Hook at top level, handle condition in render
function UserProfile({ userId }: Props) {
  const user = useUser(userId); // Always called

  if (!userId || !user) {
    return null;
  }

  return <div>{user.name}</div>;
}
```

### 2. Only Call Hooks from React Functions

```tsx
// Bad: Hook in regular function
function formatUser(userId: string) {
  const user = useUser(userId); // Error: Not a React function
  return `${user.name} (${user.email})`;
}

// Good: Hook in component or custom hook
function UserDisplay({ userId }: Props) {
  const user = useUser(userId);
  return <span>{user.name} ({user.email})</span>;
}

// Good: Hook in custom hook
function useFormattedUser(userId: string) {
  const user = useUser(userId);
  return `${user.name} (${user.email})`;
}
```

## useState

### Initialization

```tsx
// Simple initial value
const [count, setCount] = useState(0);
const [name, setName] = useState('');
const [isOpen, setIsOpen] = useState(false);

// Complex initial value - use initializer function
const [data, setData] = useState<User[]>(() => {
  // Expensive computation only runs once
  return loadInitialData();
});

// Typed state
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<Item[]>([]);
```

### Updating State

```tsx
// Simple update
setCount(5);
setName('John');

// Update based on previous state - use function form
setCount(prev => prev + 1);
setItems(prev => [...prev, newItem]);

// Object state - spread to preserve other properties
const [form, setForm] = useState({ name: '', email: '' });
setForm(prev => ({ ...prev, name: 'John' }));

// Don't mutate state directly
// Bad
items.push(newItem);
setItems(items);

// Good
setItems([...items, newItem]);
```

### State Organization

```tsx
// Related state can be grouped
const [form, setForm] = useState({
  firstName: '',
  lastName: '',
  email: '',
});

// But separate truly independent state
const [user, setUser] = useState<User | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);

// Consider useReducer for complex state logic
```

## useEffect

### Dependency Array

```tsx
// No dependencies - runs after every render
useEffect(() => {
  console.log('Rendered');
});

// Empty array - runs once on mount
useEffect(() => {
  initializeAnalytics();
}, []);

// With dependencies - runs when dependencies change
useEffect(() => {
  fetchUser(userId);
}, [userId]);
```

### Cleanup

```tsx
// Return cleanup function for subscriptions, timers, etc.
useEffect(() => {
  const subscription = eventEmitter.subscribe(handleEvent);

  // Cleanup on unmount or before re-running effect
  return () => {
    subscription.unsubscribe();
  };
}, []);

// Timer cleanup
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1);
  }, 1000);

  return () => clearInterval(timer);
}, []);
```

### Fetching Data

```tsx
// Basic fetch in useEffect
useEffect(() => {
  let cancelled = false;

  async function fetchData() {
    setIsLoading(true);
    try {
      const data = await api.getUser(userId);
      if (!cancelled) {
        setUser(data);
      }
    } catch (error) {
      if (!cancelled) {
        setError(error as Error);
      }
    } finally {
      if (!cancelled) {
        setIsLoading(false);
      }
    }
  }

  fetchData();

  return () => {
    cancelled = true;
  };
}, [userId]);

// Better: Use React Query (see state-management.md)
const { data: user, isLoading, error } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => api.getUser(userId),
});
```

### Avoid Common Mistakes

```tsx
// Bad: Missing dependency
useEffect(() => {
  fetchUser(userId); // userId missing from deps
}, []);

// Bad: Object in dependency array
useEffect(() => {
  doSomething(options);
}, [options]); // New object every render = infinite loop

// Good: Destructure or memoize
const { page, limit } = options;
useEffect(() => {
  fetchData(page, limit);
}, [page, limit]);

// Or memoize the options
const memoizedOptions = useMemo(() => options, [options.page, options.limit]);
```

## useMemo and useCallback

### useMemo - Memoize Computed Values

```tsx
// Expensive computation
const sortedItems = useMemo(() => {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// Derived state
const totalPrice = useMemo(() => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}, [items]);

// Don't overuse - only for expensive computations
// Bad: Unnecessary memoization
const doubled = useMemo(() => count * 2, [count]); // Too simple

// Good: Just compute directly
const doubled = count * 2;
```

### useCallback - Memoize Functions

```tsx
// Memoize callbacks passed to child components
const handleClick = useCallback(() => {
  setCount(c => c + 1);
}, []);

// With dependencies
const handleSubmit = useCallback((data: FormData) => {
  submitForm(userId, data);
}, [userId]);

// Useful when passing to memoized children
const MemoizedChild = memo(({ onClick }: { onClick: () => void }) => {
  return <button onClick={onClick}>Click</button>;
});

function Parent() {
  // Without useCallback, MemoizedChild re-renders every time
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <MemoizedChild onClick={handleClick} />;
}
```

## useRef

### DOM References

```tsx
function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <>
      <input ref={inputRef} type="text" />
      <button onClick={focusInput}>Focus</button>
    </>
  );
}
```

### Mutable Values Without Re-render

```tsx
function Timer() {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const startTimer = () => {
    intervalRef.current = window.setInterval(() => {
      setCount(c => c + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  return (
    <div>
      <span>{count}</span>
      <button onClick={startTimer}>Start</button>
      <button onClick={stopTimer}>Stop</button>
    </div>
  );
}
```

### Previous Value

```tsx
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// Usage
function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div>
      Current: {count}, Previous: {prevCount}
    </div>
  );
}
```

## useContext

### Creating Context

```tsx
interface AuthContextValue {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Custom hook for consuming context
function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Provider component
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (credentials: Credentials) => {
    const user = await authService.login(credentials);
    setUser(user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

## Custom Hooks

### Naming Convention

Custom hooks must start with `use`.

```tsx
// Good
function useUser(id: string) { }
function useLocalStorage<T>(key: string) { }
function useDebounce<T>(value: T, delay: number) { }

// Bad
function getUser(id: string) { } // Not a hook name
function userHook(id: string) { } // Doesn't start with 'use'
```

### Structure

```tsx
// hooks/useUser.ts
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/user';
import type { User } from '@/types';

interface UseUserOptions {
  enabled?: boolean;
}

interface UseUserReturn {
  user: User | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useUser(
  userId: string,
  options: UseUserOptions = {}
): UseUserReturn {
  const { enabled = true } = options;

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getById(userId),
    enabled: enabled && !!userId,
  });

  return {
    user,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
```

### Common Custom Hooks

#### useToggle

```tsx
function useToggle(initialValue = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(v => !v);
  }, []);

  return [value, toggle];
}

// Usage
const [isOpen, toggleOpen] = useToggle(false);
```

#### useLocalStorage

```tsx
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// Usage
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

#### useDebounce

```tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage
function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      search(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}
```

#### useOnClickOutside

```tsx
function useOnClickOutside(
  ref: RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// Usage
function Dropdown() {
  const ref = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useOnClickOutside(ref, () => setIsOpen(false));

  return (
    <div ref={ref}>
      <button onClick={() => setIsOpen(true)}>Open</button>
      {isOpen && <div>Dropdown content</div>}
    </div>
  );
}
```

## React Query Integration

See [State Management](./state-management.md) for detailed React Query patterns.

```tsx
// Basic query hook
function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
  });
}

// Query with parameters
function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getById(userId),
    enabled: !!userId,
  });
}

// Mutation hook
function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

## Summary

| Hook | Use Case |
|------|----------|
| `useState` | Component-local state |
| `useEffect` | Side effects, subscriptions |
| `useMemo` | Expensive computations |
| `useCallback` | Stable function references |
| `useRef` | DOM refs, mutable values |
| `useContext` | Consuming context |
| `useReducer` | Complex state logic |
| Custom hooks | Reusable stateful logic |

## Related Documents

- [React Patterns](./react-patterns.md)
- [Component Guidelines](./component-guidelines.md)
- [State Management](./state-management.md)

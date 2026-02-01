# Frontend Testing

Guidelines for testing React applications using Vitest and React Testing Library.

## Setup

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Test Setup

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;
```

## Component Testing

### Basic Component Test

```tsx
// components/Button/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Submit</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```tsx
// components/SearchInput/SearchInput.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  it('updates value on user input', async () => {
    const user = userEvent.setup();
    render(<SearchInput />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'search term');

    expect(input).toHaveValue('search term');
  });

  it('calls onSearch with debounced value', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<SearchInput onSearch={onSearch} debounceMs={100} />);

    await user.type(screen.getByRole('textbox'), 'query');

    // Not called immediately
    expect(onSearch).not.toHaveBeenCalled();

    // Called after debounce
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('query');
    });
  });

  it('clears input when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchInput />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'some text');

    await user.click(screen.getByRole('button', { name: /clear/i }));

    expect(input).toHaveValue('');
  });
});
```

### Testing Forms

```tsx
// components/LoginForm/LoginForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('submits with valid credentials', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
    });
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });
});
```

## Testing Hooks

### Custom Hook Testing

```tsx
// hooks/useCounter.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('initializes with provided value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('increments count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('decrements count', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it('resets to initial value', () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(10);
  });
});
```

### Testing Hooks with Context

```tsx
// hooks/useAuth.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from './useAuth';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

describe('useAuth', () => {
  it('returns null user when not authenticated', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('logs in user successfully', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password',
      });
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
```

## Mocking

### Mocking API Calls

```tsx
// Mocking fetch
import { vi } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

it('fetches and displays users', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ]),
  });

  render(<UserList />);

  expect(await screen.findByText('John')).toBeInTheDocument();
  expect(screen.getByText('Jane')).toBeInTheDocument();
});
```

### Mocking React Query

```tsx
// test/utils/test-utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const testQueryClient = createTestQueryClient();

  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    ),
    ...options,
  });
}

// Usage
it('displays user data', async () => {
  // Mock the API response
  server.use(
    rest.get('/api/users/1', (req, res, ctx) => {
      return res(ctx.json({ id: 1, name: 'John' }));
    })
  );

  renderWithProviders(<UserProfile userId="1" />);

  expect(await screen.findByText('John')).toBeInTheDocument();
});
```

### Mocking Modules

```tsx
// Mock a module
vi.mock('@/services/analytics', () => ({
  trackEvent: vi.fn(),
  trackPageView: vi.fn(),
}));

// Mock with implementation
vi.mock('@/hooks/useUser', () => ({
  useUser: () => ({
    user: { id: '1', name: 'Test User' },
    isLoading: false,
  }),
}));

// Spy on module
import * as analytics from '@/services/analytics';
const trackEventSpy = vi.spyOn(analytics, 'trackEvent');

it('tracks button click', async () => {
  const user = userEvent.setup();
  render(<AnalyticsButton />);

  await user.click(screen.getByRole('button'));

  expect(trackEventSpy).toHaveBeenCalledWith('button_click', { id: 'cta' });
});
```

## Testing Async Components

### Loading States

```tsx
describe('UserProfile', () => {
  it('shows loading skeleton initially', () => {
    render(<UserProfile userId="1" />);

    expect(screen.getByTestId('profile-skeleton')).toBeInTheDocument();
  });

  it('shows user data after loading', async () => {
    render(<UserProfile userId="1" />);

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-skeleton')).not.toBeInTheDocument();
  });

  it('shows error message on failure', async () => {
    server.use(
      rest.get('/api/users/1', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<UserProfile userId="1" />);

    expect(await screen.findByText(/error loading/i)).toBeInTheDocument();
  });
});
```

### Waiting for Elements

```tsx
// findBy queries (wait for element to appear)
const element = await screen.findByText('Loaded');

// waitFor (wait for condition)
await waitFor(() => {
  expect(screen.getByText('Done')).toBeInTheDocument();
});

// waitForElementToBeRemoved
await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
```

## Accessibility Testing

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Form accessibility', () => {
  it('has properly labeled inputs', () => {
    render(<LoginForm />);

    // Input should be accessible by label
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('announces errors to screen readers', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Error should have role="alert"
    expect(await screen.findByRole('alert')).toHaveTextContent(/required/i);
  });
});
```

## Query Priority

Use queries in this order (most to least preferred):

1. **Accessible queries** (how users find elements)
   - `getByRole` - buttons, links, headings
   - `getByLabelText` - form inputs
   - `getByPlaceholderText` - inputs without labels
   - `getByText` - non-interactive elements
   - `getByDisplayValue` - current input value

2. **Semantic queries**
   - `getByAltText` - images
   - `getByTitle` - title attribute

3. **Test IDs** (last resort)
   - `getByTestId` - when nothing else works

```tsx
// Good - accessible queries
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email/i);
screen.getByText(/welcome/i);

// Avoid - test IDs when accessible query exists
screen.getByTestId('submit-button'); // Use getByRole instead
```

## Summary

| Topic | Best Practice |
|-------|--------------|
| **Setup** | Use Vitest with jsdom environment |
| **Queries** | Prefer accessible queries (getByRole) |
| **Interactions** | Use userEvent for realistic events |
| **Async** | Use findBy queries and waitFor |
| **Mocking** | Mock external services, not component internals |
| **Accessibility** | Test with jest-axe |

## Related Documents

- [Testing Strategy](./testing-strategy.md)
- [Component Guidelines](../03-react/component-guidelines.md)
- [Hooks Guidelines](../03-react/hooks-guidelines.md)

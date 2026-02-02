# Custom Hook Template

Copy-paste templates for creating custom React hooks in VerifyWise.

## Basic Data Fetching Hook

```typescript
// hooks/useResource.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resourceService } from '@/services/resource.service';
import type { Resource, CreateResourceInput, UpdateResourceInput } from '@/types';

// Query keys factory
export const resourceKeys = {
  all: ['resources'] as const,
  lists: () => [...resourceKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...resourceKeys.lists(), filters] as const,
  details: () => [...resourceKeys.all, 'detail'] as const,
  detail: (id: string) => [...resourceKeys.details(), id] as const,
};

// Fetch single resource
interface UseResourceOptions {
  enabled?: boolean;
}

export function useResource(id: string, options: UseResourceOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: resourceKeys.detail(id),
    queryFn: () => resourceService.getById(id),
    enabled: enabled && !!id,
  });
}

// Fetch resource list
interface UseResourcesOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export function useResources(options: UseResourcesOptions = {}) {
  const { page = 1, limit = 10, search } = options;

  return useQuery({
    queryKey: resourceKeys.list({ page, limit, search }),
    queryFn: () => resourceService.getAll({ page, limit, search }),
  });
}

// Create resource mutation
export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateResourceInput) => resourceService.create(data),
    onSuccess: () => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: resourceKeys.lists() });
    },
  });
}

// Update resource mutation
export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResourceInput }) =>
      resourceService.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: resourceKeys.detail(id) });

      // Snapshot previous value
      const previousResource = queryClient.getQueryData<Resource>(
        resourceKeys.detail(id)
      );

      // Optimistically update
      if (previousResource) {
        queryClient.setQueryData(resourceKeys.detail(id), {
          ...previousResource,
          ...data,
        });
      }

      return { previousResource };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousResource) {
        queryClient.setQueryData(
          resourceKeys.detail(id),
          context.previousResource
        );
      }
    },
    onSettled: (data, error, { id }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: resourceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: resourceKeys.lists() });
    },
  });
}

// Delete resource mutation
export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resourceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.lists() });
    },
  });
}
```

## State Management Hook

```typescript
// hooks/useToggle.ts

import { useState, useCallback } from 'react';

/**
 * Hook for managing boolean toggle state.
 *
 * @param initialValue - Initial boolean value
 * @returns Tuple of [value, toggle, setValue]
 *
 * @example
 * ```tsx
 * const [isOpen, toggle, setIsOpen] = useToggle(false);
 *
 * // Toggle
 * <button onClick={toggle}>Toggle</button>
 *
 * // Set directly
 * <button onClick={() => setIsOpen(true)}>Open</button>
 * ```
 */
export function useToggle(
  initialValue = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  return [value, toggle, setValue];
}
```

## Local Storage Hook

```typescript
// hooks/useLocalStorage.ts

import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for persisting state in localStorage.
 *
 * @param key - localStorage key
 * @param initialValue - Initial value if no stored value exists
 * @returns Tuple of [storedValue, setValue, removeValue]
 *
 * @example
 * ```tsx
 * const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Initialize from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
```

## Debounce Hook

```typescript
// hooks/useDebounce.ts

import { useState, useEffect } from 'react';

/**
 * Hook that debounces a value.
 *
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 *
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     fetchResults(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
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
```

## Click Outside Hook

```typescript
// hooks/useClickOutside.ts

import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook that detects clicks outside of a referenced element.
 *
 * @param handler - Callback when click outside occurs
 * @returns Ref to attach to the element
 *
 * @example
 * ```tsx
 * function Dropdown() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   const dropdownRef = useClickOutside(() => setIsOpen(false));
 *
 *   return (
 *     <div ref={dropdownRef}>
 *       <button onClick={() => setIsOpen(true)}>Open</button>
 *       {isOpen && <div>Dropdown content</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler]);

  return ref;
}
```

## Async Handler Hook

```typescript
// hooks/useAsync.ts

import { useState, useCallback } from 'react';

interface UseAsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

interface UseAsyncReturn<T, Args extends unknown[]> extends UseAsyncState<T> {
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook for handling async operations with loading and error states.
 *
 * @param asyncFunction - Async function to execute
 * @returns State and execute function
 *
 * @example
 * ```tsx
 * const { data, error, isLoading, execute } = useAsync(
 *   (userId: string) => api.getUser(userId)
 * );
 *
 * const handleClick = () => {
 *   execute('user-123');
 * };
 * ```
 */
export function useAsync<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>
): UseAsyncReturn<T, Args> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState({ data: null, error: null, isLoading: true });

      try {
        const data = await asyncFunction(...args);
        setState({ data, error: null, isLoading: false });
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ data: null, error: err, isLoading: false });
        return null;
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  return { ...state, execute, reset };
}
```

## Media Query Hook

```typescript
// hooks/useMediaQuery.ts

import { useState, useEffect } from 'react';

/**
 * Hook for responsive design using CSS media queries.
 *
 * @param query - CSS media query string
 * @returns Whether the query matches
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 *
 * return isMobile ? <MobileView /> : <DesktopView />;
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Set initial value
    setMatches(mediaQuery.matches);

    // Add listener
    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
}

// Predefined breakpoints
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 599px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 600px) and (max-width: 1023px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
```

## Previous Value Hook

```typescript
// hooks/usePrevious.ts

import { useRef, useEffect } from 'react';

/**
 * Hook that returns the previous value of a variable.
 *
 * @param value - Current value
 * @returns Previous value (undefined on first render)
 *
 * @example
 * ```tsx
 * const [count, setCount] = useState(0);
 * const previousCount = usePrevious(count);
 *
 * return (
 *   <div>
 *     Current: {count}, Previous: {previousCount}
 *   </div>
 * );
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
```

## Hook Test Template

```typescript
// hooks/useToggle.test.ts

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useToggle } from './useToggle';

describe('useToggle', () => {
  it('initializes with default value (false)', () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current[0]).toBe(false);
  });

  it('initializes with provided value', () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current[0]).toBe(true);
  });

  it('toggles value', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[1](); // toggle
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1](); // toggle again
    });

    expect(result.current[0]).toBe(false);
  });

  it('sets value directly', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[2](true); // setValue
    });

    expect(result.current[0]).toBe(true);
  });
});
```

## Directory Structure

```
src/
└── hooks/
    ├── index.ts           # Re-exports all hooks
    ├── useResource.ts     # Data fetching hooks
    ├── useToggle.ts
    ├── useToggle.test.ts
    ├── useLocalStorage.ts
    ├── useDebounce.ts
    ├── useClickOutside.ts
    ├── useAsync.ts
    ├── useMediaQuery.ts
    └── usePrevious.ts
```

## Index File

```typescript
// hooks/index.ts

export { useResource, useResources, useCreateResource, useUpdateResource, useDeleteResource } from './useResource';
export { useToggle } from './useToggle';
export { useLocalStorage } from './useLocalStorage';
export { useDebounce } from './useDebounce';
export { useClickOutside } from './useClickOutside';
export { useAsync } from './useAsync';
export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from './useMediaQuery';
export { usePrevious } from './usePrevious';
```

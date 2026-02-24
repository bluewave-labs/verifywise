import "@testing-library/jest-dom";

import { matchers } from "@emotion/jest";
import type { MatchersObject } from "@vitest/expect";

expect.extend(matchers as unknown as MatchersObject);

// ---- Environment stubs ----
// In jsdom, window.location.port is "" which produces "http://localhost:/api"
// (invalid URL). Ensure a clean base URL for customAxios.
if (!import.meta.env.VITE_APP_API_BASE_URL) {
  // @ts-expect-error — Vite env is readonly at the type level
  import.meta.env.VITE_APP_API_BASE_URL = "http://localhost:3000";
}

// ---- Global stubs ----

// window.matchMedia is used by MUI but not available in jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
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

// IntersectionObserver stub
class IntersectionObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: IntersectionObserverStub,
});

// ResizeObserver stub
class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverStub,
});

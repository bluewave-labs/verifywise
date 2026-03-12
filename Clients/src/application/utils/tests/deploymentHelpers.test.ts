import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DeploymentManager, SessionManager } from "../deploymentHelpers";

// Mock ENV_VARs
vi.mock("../../../../env.vars", () => ({
  ENV_VARs: { URL: "http://localhost:3000" },
}));

// Mock __APP_VERSION__ global
vi.stubGlobal("__APP_VERSION__", "1.0.0");

function createMockStorage(): Storage {
  const storage = {} as Storage & Record<string, any>;

  Object.defineProperties(storage, {
    getItem: {
      value: (key: string) =>
        Object.prototype.hasOwnProperty.call(storage, key)
          ? storage[key]
          : null,
      enumerable: false,
      writable: true,
      configurable: true,
    },
    setItem: {
      value: (key: string, value: string) => {
        storage[key] = String(value);
      },
      enumerable: false,
      writable: true,
      configurable: true,
    },
    removeItem: {
      value: (key: string) => {
        delete storage[key];
      },
      enumerable: false,
      writable: true,
      configurable: true,
    },
    clear: {
      value: () => {
        Object.keys(storage).forEach((key) => delete storage[key]);
      },
      enumerable: false,
      writable: true,
      configurable: true,
    },
    key: {
      value: (index: number) => Object.keys(storage)[index] ?? null,
      enumerable: false,
      writable: true,
      configurable: true,
    },
    length: {
      get: () => Object.keys(storage).length,
      enumerable: false,
      configurable: true,
    },
  });

  return storage;
}

describe("deploymentHelpers", () => {
  const realLocation = window.location;
  let mockLocalStorage: Storage;
  let mockSessionStorage: Storage;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();

    DeploymentManager._resetForTesting();

    mockLocalStorage = createMockStorage();
    mockSessionStorage = createMockStorage();
    vi.stubGlobal("localStorage", mockLocalStorage);
    vi.stubGlobal("sessionStorage", mockSessionStorage);
    vi.stubGlobal("fetch", vi.fn());

    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    Object.defineProperty(window, "location", {
      value: { ...realLocation, reload: vi.fn() },
      writable: true,
    });
  });

  afterEach(() => {
    DeploymentManager._resetForTesting();
    vi.clearAllTimers();
    vi.useRealTimers();

    Object.defineProperty(window, "location", {
      value: realLocation,
      writable: true,
    });
    vi.unstubAllGlobals();
    // Re-stub __APP_VERSION__ since unstubAllGlobals removes it
    vi.stubGlobal("__APP_VERSION__", "1.0.0");
  });

  describe("DeploymentManager.startPolling", () => {
    it("fetches /api/version immediately on start", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: "1.0.0" }),
      });

      DeploymentManager.startPolling();
      await Promise.resolve();

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/version",
        { cache: "no-cache" }
      );
    });

    it("sets up an interval for periodic checking", () => {
      vi.useFakeTimers();
      const setIntervalSpy = vi.spyOn(globalThis, "setInterval");

      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: "1.0.0" }),
      });

      DeploymentManager.startPolling();

      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        60_000
      );
    });

    it("registers a visibilitychange listener", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");

      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: "1.0.0" }),
      });

      DeploymentManager.startPolling();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function)
      );
    });

    it("does not start a second interval if already polling", () => {
      vi.useFakeTimers();
      const setIntervalSpy = vi.spyOn(globalThis, "setInterval");

      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: "1.0.0" }),
      });

      DeploymentManager.startPolling();
      DeploymentManager.startPolling();

      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("DeploymentManager.onUpdate", () => {
    it("fires callback when version mismatch is detected", async () => {
      const callback = vi.fn();
      DeploymentManager.onUpdate(callback);

      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: "2.0.0" }),
      });

      DeploymentManager.startPolling();
      // flush the fetch promise chain
      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    });

    it("does NOT fire callback when versions match", async () => {
      const callback = vi.fn();
      DeploymentManager.onUpdate(callback);

      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: "1.0.0" }),
      });

      DeploymentManager.startPolling();
      await Promise.resolve();
      await Promise.resolve();

      expect(callback).not.toHaveBeenCalled();
    });

    it("does NOT fire callback when fetch fails", async () => {
      const callback = vi.fn();
      DeploymentManager.onUpdate(callback);

      (fetch as any).mockRejectedValue(new Error("network down"));

      DeploymentManager.startPolling();
      await Promise.resolve();
      await Promise.resolve();

      expect(callback).not.toHaveBeenCalled();
    });

    it("does NOT fire callback when response is not ok", async () => {
      const callback = vi.fn();
      DeploymentManager.onUpdate(callback);

      (fetch as any).mockResolvedValue({ ok: false });

      DeploymentManager.startPolling();
      await Promise.resolve();
      await Promise.resolve();

      expect(callback).not.toHaveBeenCalled();
    });

    it("fires immediately if update was already detected", async () => {
      // First, trigger an update detection
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: "2.0.0" }),
      });

      DeploymentManager.startPolling();
      await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
      // Let the mismatch propagate
      await Promise.resolve();
      await Promise.resolve();

      // Now register a NEW callback — it should fire immediately
      const lateCallback = vi.fn();
      DeploymentManager.onUpdate(lateCallback);

      expect(lateCallback).toHaveBeenCalledTimes(1);
    });

    it("unsubscribe removes the callback", async () => {
      const callback = vi.fn();
      const unsubscribe = DeploymentManager.onUpdate(callback);
      unsubscribe();

      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: "2.0.0" }),
      });

      DeploymentManager.startPolling();
      await Promise.resolve();
      await Promise.resolve();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("DeploymentManager visibilitychange", () => {
    it("checks for update when user returns to tab", async () => {
      let visibilityCb: (() => void) | undefined;

      vi.spyOn(document, "addEventListener").mockImplementation(
        ((event: any, cb: any) => {
          if (event === "visibilitychange") visibilityCb = cb;
        }) as any
      );

      vi.spyOn(globalThis, "setInterval").mockImplementation(
        (() => 1) as any
      );

      // First call (startup): versions match
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: "1.0.0" }),
      });

      DeploymentManager.startPolling();
      await Promise.resolve();
      await Promise.resolve();

      expect(fetch).toHaveBeenCalledTimes(1);

      // Tab is hidden — handler should not fetch
      Object.defineProperty(document, "hidden", {
        value: true,
        configurable: true,
      });
      visibilityCb?.();
      await Promise.resolve();
      expect(fetch).toHaveBeenCalledTimes(1);

      // Tab becomes visible — handler should fetch
      Object.defineProperty(document, "hidden", {
        value: false,
        configurable: true,
      });

      // New version available on this check
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: "3.0.0" }),
      });

      const callback = vi.fn();
      DeploymentManager.onUpdate(callback);

      visibilityCb?.();
      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    });
  });

  describe("SessionManager.recoverAuthenticationState", () => {
    it("returns false if persisted state does not exist", async () => {
      const result = await SessionManager.recoverAuthenticationState();
      expect(result).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("returns false if auth token does not exist in persisted state", async () => {
      localStorage.setItem(
        "persist:root",
        JSON.stringify({ auth: JSON.stringify({}) })
      );

      const result = await SessionManager.recoverAuthenticationState();

      expect(result).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("returns true if auth token exists and /me responds ok", async () => {
      localStorage.setItem(
        "persist:root",
        JSON.stringify({ auth: JSON.stringify({ authToken: "TOKEN123" }) })
      );

      (fetch as any).mockResolvedValue({ ok: true });

      const result = await SessionManager.recoverAuthenticationState();

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith("/api/users/me", {
        headers: {
          Authorization: "Bearer TOKEN123",
          "Content-Type": "application/json",
        },
      });
    });

    it("returns false, clears auth state if token invalid (response not ok)", async () => {
      localStorage.setItem(
        "persist:root",
        JSON.stringify({
          auth: JSON.stringify({ authToken: "BADTOKEN", user: "abc" }),
          other: "keep",
        })
      );

      (fetch as any).mockResolvedValue({ ok: false });

      const clearSpy = vi.spyOn(SessionManager, "clearAuthState");

      const result = await SessionManager.recoverAuthenticationState();

      expect(result).toBe(false);
      expect(clearSpy).toHaveBeenCalledTimes(1);
    });

    it("returns false and logs error on invalid JSON", async () => {
      localStorage.setItem("persist:root", "{ invalid json }");

      const result = await SessionManager.recoverAuthenticationState();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it("returns false when persisted state exists but has no auth key", async () => {
      localStorage.setItem(
        "persist:root",
        JSON.stringify({ somethingElse: "keep" })
      );

      const result = await SessionManager.recoverAuthenticationState();

      expect(result).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("SessionManager.clearAuthState", () => {
    it("clears only authToken and user, keeping other persisted state", () => {
      localStorage.setItem(
        "persist:root",
        JSON.stringify({
          auth: JSON.stringify({
            authToken: "TOKEN",
            user: "U",
            otherAuth: "keep",
          }),
          somethingElse: "keep2",
        })
      );

      SessionManager.clearAuthState();

      const updated = JSON.parse(localStorage.getItem("persist:root")!);
      const updatedAuth = JSON.parse(updated.auth);

      expect(updatedAuth.authToken).toBe("");
      expect(updatedAuth.user).toBe("");
      expect(updatedAuth.otherAuth).toBe("keep");
      expect(updated.somethingElse).toBe("keep2");
    });

    it("does nothing if persisted state missing", () => {
      SessionManager.clearAuthState();
      expect(localStorage.getItem("persist:root")).toBeNull();
    });

    it("logs error if JSON parsing fails", () => {
      localStorage.setItem("persist:root", "{ invalid json }");

      SessionManager.clearAuthState();

      expect(console.error).toHaveBeenCalled();
    });
  });
});

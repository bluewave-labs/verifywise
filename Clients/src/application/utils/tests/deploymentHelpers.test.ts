import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DeploymentManager, SessionManager } from "../deploymentHelpers";

function mockFetchResponse(opts: { ok: boolean; text?: string }) {
  return {
    ok: opts.ok,
    text: vi.fn().mockResolvedValue(opts.text ?? ""),
  } as any;
}

function createMockStorage(): Storage {
  const storage = {} as Storage & Record<string, any>;

  Object.defineProperties(storage, {
    getItem: {
      value: (key: string) => Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null,
      enumerable: false,
      writable: true,
      configurable: true,
    },
    setItem: {
      value: (key: string, value: string) => { storage[key] = String(value); },
      enumerable: false,
      writable: true,
      configurable: true,
    },
    removeItem: {
      value: (key: string) => { delete storage[key]; },
      enumerable: false,
      writable: true,
      configurable: true,
    },
    clear: {
      value: () => {
        Object.keys(storage).forEach(key => delete storage[key]);
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

    mockLocalStorage = createMockStorage();
    mockSessionStorage = createMockStorage();
    vi.stubGlobal("localStorage", mockLocalStorage);
    vi.stubGlobal("sessionStorage", mockSessionStorage);

    // mock fetch by default
    vi.stubGlobal("fetch", vi.fn());

    // mock console
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // mock window.location.reload
    Object.defineProperty(window, "location", {
      value: { ...realLocation, reload: vi.fn() },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllTimers(); // kills intervals/timeouts created in the test
    vi.useRealTimers();

    // restore location
    Object.defineProperty(window, "location", {
      value: realLocation,
      writable: true,
    });
    vi.unstubAllGlobals();
  });

  describe("DeploymentManager.checkForUpdate", () => {
    it("returns false when last check was too recent (no fetch)", async () => {
      const now = 1_000_000;
      vi.spyOn(Date, "now").mockReturnValue(now);

      // last check = 1 minute ago, interval = 5 min
      localStorage.setItem("last_version_check", String(now - 60_000));

      const result = await DeploymentManager.checkForUpdate();

      expect(result).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("returns false when fetch response is not ok", async () => {
      vi.spyOn(Date, "now").mockReturnValue(1_000_000);
      (fetch as any).mockResolvedValue(mockFetchResponse({ ok: false }));

      const result = await DeploymentManager.checkForUpdate();

      expect(result).toBe(false);
    });

    it("returns false when build-time meta tag is missing", async () => {
      vi.spyOn(Date, "now").mockReturnValue(1_000_000);
      (fetch as any).mockResolvedValue(
        mockFetchResponse({ ok: true, text: "<html><head></head></html>" })
      );

      const result = await DeploymentManager.checkForUpdate();

      expect(result).toBe(false);
      // should not set version if none found
      expect(localStorage.getItem("app_deployment_version")).toBeNull();
    });

    it("stores current version when no stored version exists (returns false)", async () => {
      const now = 1_000_000;
      vi.spyOn(Date, "now").mockReturnValue(now);

      (fetch as any).mockResolvedValue(
        mockFetchResponse({
          ok: true,
          text: `<meta name="build-time" content="v1" />`,
        })
      );

      const result = await DeploymentManager.checkForUpdate();

      expect(result).toBe(false);
      expect(localStorage.getItem("app_deployment_version")).toBe("v1");
      expect(localStorage.getItem("last_version_check")).toBe(String(now));
    });

    it("returns true when stored version differs from current version (update available)", async () => {
      const now = 1_000_000;
      vi.spyOn(Date, "now").mockReturnValue(now);

      localStorage.setItem("app_deployment_version", "v1");

      (fetch as any).mockResolvedValue(
        mockFetchResponse({
          ok: true,
          text: `<meta name="build-time" content="v2" />`,
        })
      );

      const result = await DeploymentManager.checkForUpdate();

      expect(result).toBe(true);
      expect(localStorage.getItem("app_deployment_version")).toBe("v2");
      expect(localStorage.getItem("last_version_check")).toBe(String(now));
    });

    it("returns false and warns if an exception occurs", async () => {
      (fetch as any).mockRejectedValue(new Error("network down"));

      const result = await DeploymentManager.checkForUpdate();

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe("DeploymentManager.handleGracefulRefresh", () => {
    it("logs default message and reloads after 3 seconds", () => {
      vi.useFakeTimers();

      DeploymentManager.handleGracefulRefresh();

      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        "A new version is available! The page will refresh automatically in 3 seconds."
      );

      expect((window.location.reload as any)).not.toHaveBeenCalled();

      vi.advanceTimersByTime(3000);

      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });

    it("logs custom message and reloads after 3 seconds", () => {
      vi.useFakeTimers();

      DeploymentManager.handleGracefulRefresh("Custom update message");

      expect(console.log).toHaveBeenCalledWith("Custom update message");

      vi.advanceTimersByTime(3000);
      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });
  });

  describe("DeploymentManager.clearAllCache", () => {
    it("clears localStorage keys except version/check tracking, clears sessionStorage, updates SW registrations", async () => {
      // seed storages
      localStorage.setItem("app_deployment_version", "v1"); // keep (includes "version")
      localStorage.setItem("last_version_check", "123"); // keep (includes "check")
      localStorage.setItem("some_key", "x"); // remove
      localStorage.setItem("another", "y"); // remove

      sessionStorage.setItem("s1", "v");

      // mock serviceWorker registrations
      const update = vi.fn();
      const getRegistrations = vi.fn().mockResolvedValue([{ update }, { update }]);

      // navigator.serviceWorker exists in jsdom, but we override safely
      Object.defineProperty(navigator, "serviceWorker", {
        value: { getRegistrations },
        configurable: true,
      });

      DeploymentManager.clearAllCache();

      // localStorage: removed keys
      expect(localStorage.getItem("some_key")).toBeNull();
      expect(localStorage.getItem("another")).toBeNull();

      // kept keys
      expect(localStorage.getItem("app_deployment_version")).toBe("v1");
      expect(localStorage.getItem("last_version_check")).toBe("123");

      // sessionStorage cleared
      expect(sessionStorage.getItem("s1")).toBeNull();

      // service worker updates called (async promise)
      // let microtasks run
      await Promise.resolve();
      expect(getRegistrations).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledTimes(2);

      expect(console.log).toHaveBeenCalledWith("✅ Application cache cleared successfully");
    });

    it("logs error if something throws", () => {
      // clearAllCache uses Object.keys(localStorage) and removeItem, not getItem
      const removeItemSpy = vi.spyOn(localStorage, "removeItem").mockImplementation(() => {
        throw new Error("boom");
      });

      // Add a key that will trigger removeItem (not containing 'version' or 'check')
      localStorage.setItem("someKey", "value");

      DeploymentManager.clearAllCache();

      expect(console.error).toHaveBeenCalled();

      // restore
      removeItemSpy.mockRestore();
    });

  });

  describe("DeploymentManager.initializeUpdateCheck", () => {
    it("calls checkForUpdate immediately and triggers graceful refresh if update exists", async () => {
      vi.useFakeTimers();

      const checkSpy = vi
        .spyOn(DeploymentManager, "checkForUpdate")
        .mockResolvedValue(true);

      const refreshSpy = vi
        .spyOn(DeploymentManager, "handleGracefulRefresh")
        .mockImplementation(() => {});

      const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");

      DeploymentManager.initializeUpdateCheck();

      // allow promise chain
      await Promise.resolve();

      expect(checkSpy).toHaveBeenCalledTimes(1);
      expect(refreshSpy).toHaveBeenCalledTimes(1);

      // interval configured
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);

      // visibility listener configured
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function)
      );
    });

    it("does NOT refresh if no update exists", async () => {
      const checkSpy = vi
        .spyOn(DeploymentManager, "checkForUpdate")
        .mockResolvedValue(false);

      const refreshSpy = vi
        .spyOn(DeploymentManager, "handleGracefulRefresh")
        .mockImplementation(() => {});

      DeploymentManager.initializeUpdateCheck();
      await Promise.resolve();

      expect(checkSpy).toHaveBeenCalledTimes(1);
      expect(refreshSpy).not.toHaveBeenCalled();
    });

    it("runs periodic interval check and refreshes when update exists", async () => {
        // Capture the interval callback without creating a real interval
        let intervalCb: (() => void) | undefined;

        vi.spyOn(globalThis, "setInterval").mockImplementation(((cb: any) => {
            intervalCb = cb;
            return 1 as any;
        }) as any);

        const checkSpy = vi
            .spyOn(DeploymentManager, "checkForUpdate")
            .mockResolvedValueOnce(false) // startup
            .mockResolvedValueOnce(true); // interval tick

        const refreshSpy = vi
            .spyOn(DeploymentManager, "handleGracefulRefresh")
            .mockImplementation(() => {});

        DeploymentManager.initializeUpdateCheck();

        // flush startup promise
        await Promise.resolve();

        expect(checkSpy).toHaveBeenCalledTimes(1);
        expect(refreshSpy).not.toHaveBeenCalled();

        //  execute manually the interval callback (lines 120-125)
        intervalCb?.();
        await Promise.resolve();

        expect(checkSpy).toHaveBeenCalledTimes(2);
        expect(refreshSpy).toHaveBeenCalledTimes(1);
        });

        it("checks for update on visibilitychange when user returns to tab", async () => {
    // capture handler of visibilitychange without registering a real listener
    let visibilityCb: (() => void) | undefined;

    vi.spyOn(document, "addEventListener").mockImplementation(((event: any, cb: any) => {
        if (event === "visibilitychange") visibilityCb = cb;
    }) as any);

    // Avoid real interval as well (optional but recommended)
    vi.spyOn(globalThis, "setInterval").mockImplementation((() => 1) as any);

    const checkSpy = vi
        .spyOn(DeploymentManager, "checkForUpdate")
        .mockResolvedValueOnce(false) // startup
        .mockResolvedValueOnce(true); // when visible

    const refreshSpy = vi
        .spyOn(DeploymentManager, "handleGracefulRefresh")
        .mockImplementation(() => {});

    // startup with hidden=true (doesn't matter for startup, but does for handler)
    Object.defineProperty(document, "hidden", { value: true, configurable: true });

    DeploymentManager.initializeUpdateCheck();
    await Promise.resolve();

    expect(checkSpy).toHaveBeenCalledTimes(1);
    expect(refreshSpy).not.toHaveBeenCalled();

    // Trigger handler with hidden=true => does NOT enter the if (lines 130-137)
    visibilityCb?.();
    await Promise.resolve();

    expect(checkSpy).toHaveBeenCalledTimes(1);
    expect(refreshSpy).not.toHaveBeenCalled();

    // Now user returned (hidden=false) => enters the if and checks update
    Object.defineProperty(document, "hidden", { value: false, configurable: true });

    visibilityCb?.();
    await Promise.resolve();

    expect(checkSpy).toHaveBeenCalledTimes(2);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    }); 

  });

  describe("SessionManager.recoverAuthenticationState", () => {
    it("returns false if persisted state does not exist", async () => {
      const result = await SessionManager.recoverAuthenticationState();
      expect(result).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("returns false if auth token does not exist in persisted state", async () => {
      localStorage.setItem("persist:root", JSON.stringify({ auth: JSON.stringify({}) }));

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

    it("returns false when persisted state exists but has no auth key (covers authState=null branch)", async () => {
      localStorage.setItem("persist:root", JSON.stringify({ somethingElse: "keep" }));

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
          auth: JSON.stringify({ authToken: "TOKEN", user: "U", otherAuth: "keep" }),
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

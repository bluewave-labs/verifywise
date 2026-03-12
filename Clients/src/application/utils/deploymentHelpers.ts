import { ENV_VARs } from "../../../env.vars";

const POLL_INTERVAL = 60 * 1000; // 60 seconds

let updateAvailable = false;
let onUpdateCallbacks: Array<() => void> = [];
let intervalId: ReturnType<typeof setInterval> | null = null;

async function checkVersion(): Promise<void> {
  if (updateAvailable) return; // already detected, stop checking

  try {
    const res = await fetch(`${ENV_VARs.URL}/api/version`, {
      cache: "no-cache",
    });
    if (!res.ok) return;

    const { version } = await res.json();
    if (version && version !== __APP_VERSION__) {
      updateAvailable = true;
      onUpdateCallbacks.forEach((cb) => cb());
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
  } catch {
    // Network error — silently ignore, will retry next interval
  }
}

export class DeploymentManager {
  static onUpdate(callback: () => void): () => void {
    onUpdateCallbacks.push(callback);
    // If update was already detected before this listener registered, fire immediately
    if (updateAvailable) callback();
    return () => {
      onUpdateCallbacks = onUpdateCallbacks.filter((cb) => cb !== callback);
    };
  }

  /** Reset module state — only for use in tests */
  static _resetForTesting(): void {
    updateAvailable = false;
    onUpdateCallbacks = [];
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  }

  static startPolling(): void {
    if (intervalId) return;
    checkVersion();
    intervalId = setInterval(checkVersion, POLL_INTERVAL);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) checkVersion();
    });
  }
}

/**
 * Session recovery utilities
 */
export class SessionManager {
  static async recoverAuthenticationState(): Promise<boolean> {
    try {
      const persistedState = localStorage.getItem("persist:root");
      if (!persistedState) return false;

      const state = JSON.parse(persistedState);
      const authState = state.auth ? JSON.parse(state.auth) : null;

      if (authState?.authToken) {
        const response = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${authState.authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          this.clearAuthState();
          return false;
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error recovering authentication state:", error);
      return false;
    }
  }

  static clearAuthState(): void {
    try {
      const persistedState = localStorage.getItem("persist:root");
      if (persistedState) {
        const state = JSON.parse(persistedState);
        if (state.auth) {
          const authState = JSON.parse(state.auth);
          authState.authToken = "";
          authState.user = "";
          state.auth = JSON.stringify(authState);
          localStorage.setItem("persist:root", JSON.stringify(state));
        }
      }
    } catch (error) {
      console.error("Error clearing auth state:", error);
    }
  }
}

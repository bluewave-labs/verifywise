/**
 * Deployment and session management utilities
 * These helpers ensure smooth user experience during app updates
 */

export class DeploymentManager {
  private static readonly VERSION_KEY = 'app_deployment_version';
  private static readonly LAST_CHECK_KEY = 'last_version_check';
  private static readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if a new deployment is available
   * This can be called periodically to detect new versions
   */
  static async checkForUpdate(): Promise<boolean> {
    try {
      const lastCheck = localStorage.getItem(this.LAST_CHECK_KEY);
      const now = Date.now();
      
      // Don't check too frequently
      if (lastCheck && (now - parseInt(lastCheck)) < this.CHECK_INTERVAL) {
        return false;
      }

      // In production, you could fetch a version endpoint
      // For now, we'll use the build timestamp from index.html meta tag
      const response = await fetch('/index.html', { 
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.ok) {
        const html = await response.text();
        const versionMatch = html.match(/<meta name="build-time" content="([^"]+)"/);
        const currentVersion = versionMatch?.[1];
        
        if (currentVersion) {
          const storedVersion = localStorage.getItem(this.VERSION_KEY);
          localStorage.setItem(this.LAST_CHECK_KEY, now.toString());
          
          if (storedVersion && storedVersion !== currentVersion) {
            localStorage.setItem(this.VERSION_KEY, currentVersion);
            return true; // New version available
          } else if (!storedVersion) {
            localStorage.setItem(this.VERSION_KEY, currentVersion);
          }
        }
      }
      
      return false;
    } catch (error) {
      console.warn('Could not check for updates:', error);
      return false;
    }
  }

  /**
   * Handle graceful session refresh
   * Shows user-friendly notification and refreshes the page
   */
  static handleGracefulRefresh(message?: string): void {
    const defaultMessage = "A new version is available! The page will refresh automatically in 3 seconds.";
    
    // Show notification (you can customize this based on your toast system)
    console.log(message || defaultMessage);
    
    // Optional: Show a toast notification to user
    // CustomizableToast.show({ title: "Update Available", message: message || defaultMessage });
    
    // Refresh after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  }

  /**
   * Clear all application cache and storage
   * Use this when major breaking changes occur
   */
  static clearAllCache(): void {
    try {
      // Clear localStorage (except version tracking)
      Object.keys(localStorage).forEach(key => {
        if (!key.includes('version') && !key.includes('check')) {
          localStorage.removeItem(key);
        }
      });

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear any service worker cache if present
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.update();
          });
        });
      }

      console.log('✅ Application cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Initialize deployment monitoring
   * Call this in your main App component
   */
  static initializeUpdateCheck(): void {
    // Check for updates when app starts
    this.checkForUpdate().then(hasUpdate => {
      if (hasUpdate) {
        this.handleGracefulRefresh();
      }
    });

    // Set up periodic checking (optional, for long-running sessions)
    setInterval(() => {
      this.checkForUpdate().then(hasUpdate => {
        if (hasUpdate) {
          this.handleGracefulRefresh();
        }
      });
    }, this.CHECK_INTERVAL);

    // Listen for visibility changes to check when user returns to tab
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkForUpdate().then(hasUpdate => {
          if (hasUpdate) {
            this.handleGracefulRefresh();
          }
        });
      }
    });
  }
}

/**
 * Session recovery utilities
 */
export class SessionManager {
  /**
   * Attempt to recover from authentication state mismatch
   */
  static async recoverAuthenticationState(): Promise<boolean> {
    try {
      // Check if we have any auth tokens
      const persistedState = localStorage.getItem('persist:root');
      if (!persistedState) return false;

      const state = JSON.parse(persistedState);
      const authState = state.auth ? JSON.parse(state.auth) : null;
      
      if (authState?.authToken) {
        // Validate the token is still working
        const response = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${authState.authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          // Token is invalid, clear auth state
          this.clearAuthState();
          return false;
        }
        
        return true; // Token is valid
      }
      
      return false;
    } catch (error) {
      console.error('Error recovering authentication state:', error);
      return false;
    }
  }

  /**
   * Clear only authentication-related state
   */
  static clearAuthState(): void {
    try {
      const persistedState = localStorage.getItem('persist:root');
      if (persistedState) {
        const state = JSON.parse(persistedState);
        if (state.auth) {
          const authState = JSON.parse(state.auth);
          // Clear sensitive auth data but keep other state
          authState.authToken = '';
          authState.user = '';
          state.auth = JSON.stringify(authState);
          localStorage.setItem('persist:root', JSON.stringify(state));
        }
      }
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  }
}
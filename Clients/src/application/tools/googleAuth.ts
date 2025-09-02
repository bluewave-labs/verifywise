import { ENV_VARs } from "../../../env.vars";

// Google Authentication utility functions
export interface GoogleAuthResponse {
  credential: string;
  select_by: string;
}

export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

// Load Google Identity Services script
export const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.accounts) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google script'));
    document.head.appendChild(script);
  });
};

// Load Google Platform Library (alternative for popup)
export const loadGooglePlatformScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.gapi) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/platform.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load('auth2', () => {
        resolve();
      });
    };
    script.onerror = () => reject(new Error('Failed to load Google Platform script'));
    document.head.appendChild(script);
  });
};

// Initialize Google Sign-In
export const initializeGoogleSignIn = async (): Promise<void> => {
  await loadGoogleScript();

  if (!ENV_VARs.GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID not configured');
  }


  try {
    window.google.accounts.id.initialize({
      client_id: ENV_VARs.GOOGLE_CLIENT_ID,
      callback: () => { }, // Will be set by individual components
    });
  } catch (error) {
    throw error;
  }
};

// Decode JWT token to get user info
export const decodeGoogleToken = (token: string): GoogleUser => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error('Failed to decode Google token');
  }
};

// Handle Google Sign-In
export const handleGoogleSignIn = (callback: (response: GoogleAuthResponse) => void): void => {
  window.google.accounts.id.initialize({
    client_id: ENV_VARs.GOOGLE_CLIENT_ID,
    callback: callback,
  });
};

// Trigger Google Sign-In popup
export const signInWithGoogle = (callback: (response: GoogleAuthResponse) => void): void => {
  handleGoogleSignIn(callback);
  window.google.accounts.id.prompt();
};

// Alternative method using One Tap
export const triggerGoogleOneTap = (callback: (response: GoogleAuthResponse) => void): void => {
  handleGoogleSignIn(callback);
  window.google.accounts.id.prompt((notification: any) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // Fallback to popup if One Tap is not available
    }
  });
};

// Google sign-in with popup (improved implementation)
export const signInWithGooglePopup = (callback: (response: GoogleAuthResponse) => void): void => {
  if (!ENV_VARs.GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID not configured');
  }

  // Ensure the script is loaded and initialize
  loadGoogleScript().then(() => {
    // Initialize with the callback
    window.google.accounts.id.initialize({
      client_id: ENV_VARs.GOOGLE_CLIENT_ID,
      callback: callback,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Display the sign-in prompt immediately
    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed()) {
        // Fallback: Try to render a button and click it programmatically
        const tempDiv = document.createElement('div');
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);

        try {
          window.google.accounts.id.renderButton(tempDiv, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
          });

          // Try to trigger the button click
          const button = tempDiv.querySelector('div[role="button"]') as HTMLElement;
          if (button) {
            button.click();
          }
        } catch (error) {
        } finally {
          document.body.removeChild(tempDiv);
        }
      }

      if (notification.isSkippedMoment()) {
      }
    });
  }).catch((error) => {
    throw error;
  });
};

// Alternative Google Sign-In using popup (more reliable)
export const signInWithGooglePopupAlternative = (
  callback: (response: GoogleAuthResponse) => void,
  onCancel?: () => void
): void => {
  if (!ENV_VARs.GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID not configured');
  }

  // Create a temporary container for the Google button
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.top = '-1000px';
  tempContainer.style.left = '-1000px';
  tempContainer.style.visibility = 'hidden';
  document.body.appendChild(tempContainer);

  // Set up a timeout to detect if the popup was closed without action
  let authTimeout: NodeJS.Timeout;
  let isCompleted = false;

  const cleanup = () => {
    if (tempContainer.parentNode) {
      document.body.removeChild(tempContainer);
    }
    if (authTimeout) {
      clearTimeout(authTimeout);
    }
  };

  // Set timeout for detecting cancellation (60 seconds)
  authTimeout = setTimeout(() => {
    if (!isCompleted) {
      cleanup();
      if (onCancel) {
        onCancel();
      }
    }
  }, 60000);

  loadGoogleScript().then(() => {

    // Initialize Google Sign-In
    try {
      window.google.accounts.id.initialize({
        client_id: ENV_VARs.GOOGLE_CLIENT_ID,
        callback: (response: GoogleAuthResponse) => {
          isCompleted = true;
          cleanup();
          // Call the original callback
          callback(response);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    } catch (initError) {
      cleanup();
      if (onCancel) {
        onCancel();
      }
      return;
    }

    // Render the button
    try {
      window.google.accounts.id.renderButton(tempContainer, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        width: '100%',
      });
    } catch (renderError) {
      cleanup();
      if (onCancel) {
        onCancel();
      }
      return;
    }

    // Programmatically click the button to trigger the popup
    setTimeout(() => {
      const button = tempContainer.querySelector('div[role="button"]') as HTMLElement;
      if (button) {
        try {
          button.click();
        } catch (clickError) {
          // Fallback to prompt
          window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              if (!isCompleted) {
                isCompleted = true;
                cleanup();
                if (onCancel) {
                  onCancel();
                }
              }
            }
          });
        }
      } else {
        // Fallback to prompt if button rendering fails
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            if (!isCompleted) {
              isCompleted = true;
              cleanup();
              if (onCancel) {
                onCancel();
              }
            }
          }
        });
      }
    }, 100);
  }).catch((error) => {
    cleanup();
    if (onCancel) {
      onCancel();
    }
    throw error;
  });
};

// Type definitions for Google Identity Services and Platform Library
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
          storeCredential: (credential: any) => void;
          cancel: () => void;
        };
      };
    };
    gapi: {
      load: (api: string, callback: () => void) => void;
      auth2: {
        init: (config: any) => any;
        getAuthInstance: () => any;
      };
    };
  }
}

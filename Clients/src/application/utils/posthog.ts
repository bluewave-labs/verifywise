import PostHog from 'posthog-js'
import type { PostHog as PostHogType } from 'posthog-js'

// PostHog configuration
export const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY || 'phc_dummy_key_for_dev'
export const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com'

let posthogClient: PostHogType | null = null

export const initializePostHog = () => {
  // Skip initialization if API key is not set
  if (POSTHOG_API_KEY === 'phc_dummy_key_for_dev') {
    if (import.meta.env.DEV) {
      console.log('PostHog: Skipping initialization without API key')
    }
    return null
  }

  try {
    // Check if we should use real PostHog
    const useRealPostHog = import.meta.env.VITE_REAL_POSTHOG === 'true'

    if (!useRealPostHog) {
      if (import.meta.env.DEV) {
        console.log('PostHog: Using mock client (set VITE_REAL_POSTHOG=true in .env to enable real tracking)')
      }

      posthogClient = {
        capture: (eventName: string, properties?: Record<string, any>) => {
          if (import.meta.env.DEV) {
            console.log('PostHog [MOCK]: Event captured', { eventName, properties })
          }
        },
        identify: (userId: string, properties?: Record<string, any>) => {
          if (import.meta.env.DEV) {
            console.log('PostHog [MOCK]: User identified', { userId, properties })
          }
        },
        reset: () => {
          if (import.meta.env.DEV) {
            console.log('PostHog [MOCK]: User reset')
          }
        },
        __loaded: true,
        config: { token: POSTHOG_API_KEY },
      } as any

      return posthogClient
    }

    // Real PostHog client
    posthogClient = PostHog.init(POSTHOG_API_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false,
      capture_pageview: false,
      persistence: 'localStorage',
      person_profiles: 'identified_only',
      loaded: (posthog) => {
        // Expose PostHog on window for debugging in development
        if (import.meta.env.DEV) {
          (window as any).posthog = posthog;
        }
      },
    })

    // Expose on window for debugging in development
    if (import.meta.env.DEV && posthogClient) {
      (window as any).posthog = posthogClient;
    }

    return posthogClient
  } catch (error) {
    console.error('PostHog: Failed to initialize', error)
    return null
  }
}

export const getPostHog = (): PostHogType | null => {
  return posthogClient
}

// User identification
export const identifyUser = (userId: string, userEmail: string, userRole: string, organizationId?: string) => {
  const client = getPostHog()
  if (!client) return

  try {
    client.identify(userId, {
      email: userEmail,
      role: userRole,
      organization_id: organizationId,
      user_type: userRole.toLowerCase(),
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('PostHog: Failed to identify user', error)
    }
  }
}

// Reset user identification (for logout)
export const resetUser = () => {
  const client = getPostHog()
  if (!client) return

  client.reset()
}

// Manual page view tracking
export const trackPageView = (path: string, title?: string) => {
  const client = getPostHog()
  if (!client) return

  try {
    client.capture('$pageview', {
      $current_url: window.location.href,
      path,
      title: title || document.title,
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('PostHog: Failed to track page view', error)
    }
  }
}

// Custom event tracking
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  const client = getPostHog()
  if (!client) return

  try {
    const eventData = {
      timestamp: new Date().toISOString(),
      ...properties,
    }

    client.capture(eventName, eventData)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('PostHog: Failed to track event:', eventName, error)
    }
  }
}

// Feature usage tracking
export const trackFeatureUsage = (featureName: string, action: string, properties?: Record<string, any>) => {
  trackEvent(`feature_${featureName}_${action}`, {
    feature_name: featureName,
    action,
    ...properties,
  })
}

// Form interaction tracking
export const trackFormInteraction = (formName: string, action: 'start' | 'submit' | 'error' | 'abandon' | 'input', properties?: Record<string, any>) => {
  trackEvent(`form_${formName}_${action}`, {
    form_name: formName,
    action,
    ...properties,
  })
}

// Error tracking
export const trackError = (error: Error | string, context?: Record<string, any>) => {
  const errorMessage = error instanceof Error ? error.message : error
  const errorStack = error instanceof Error ? error.stack : undefined

  trackEvent('javascript_error', {
    error_message: errorMessage,
    error_stack: errorStack,
    url: window.location.href,
    ...context,
  })
}
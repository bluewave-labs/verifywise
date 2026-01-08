import PostHog from 'posthog-js'
import type { PostHog as PostHogType } from 'posthog-js'

// PostHog configuration
const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com'

let posthogClient: PostHogType | null = null

export const initializePostHog = () => {
  // Skip initialization if API key is not configured
  if (!POSTHOG_API_KEY) {
    return null
  }

  try {
    posthogClient = PostHog.init(POSTHOG_API_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false,
      capture_pageview: false,
      persistence: 'localStorage',
      person_profiles: 'identified_only',
    })

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
    // Silently fail - analytics should not break the app
  }
}

// Reset user identification (for logout)
export const resetUser = () => {
  const client = getPostHog()
  if (!client) return

  try {
    client.reset()
  } catch (error) {
    // Silently fail
  }
}

// Custom event tracking
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  const client = getPostHog()
  if (!client) return

  try {
    client.capture(eventName, {
      timestamp: new Date().toISOString(),
      ...properties,
    })
  } catch (error) {
    // Silently fail
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

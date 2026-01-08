import { useCallback } from 'react'
import { trackEvent, trackFeatureUsage, trackFormInteraction, trackError as trackErrorUtil } from '../utils/posthog'
import {
  trackUserJourney,
  trackApiError,
  trackAIModelUsage,
  trackAssessmentWorkflow,
  trackDashboardView,
} from '../utils/posthog-advanced'

export const usePostHog = () => {
  // Generic event tracking
  const track = useCallback((eventName: string, properties?: Record<string, any>) => {
    trackEvent(eventName, properties)
  }, [])

  // Feature usage tracking
  const trackFeature = useCallback((featureName: string, action: string, properties?: Record<string, any>) => {
    trackFeatureUsage(featureName, action, properties)
  }, [])

  // Form interaction tracking
  const trackForm = useCallback((formName: string, action: 'start' | 'submit' | 'error' | 'abandon' | 'input', properties?: Record<string, any>) => {
    trackFormInteraction(formName, action, properties)
  }, [])

  // Error tracking
  const trackError = useCallback((error: Error | string, context?: Record<string, any>) => {
    trackErrorUtil(error, context)
  }, [])

  // Button click tracking
  const trackButtonClick = useCallback((buttonName: string, context?: Record<string, any>) => {
    trackEvent('button_clicked', {
      button_name: buttonName,
      ...context
    })
  }, [])

  // User journey tracking
  const trackJourney = useCallback((journey: string, step: string, properties?: Record<string, any>) => {
    trackUserJourney(journey, step, properties)
  }, [])

  // API error tracking
  const trackApiErrorEvent = useCallback((endpoint: string, statusCode: number, errorMessage?: string, properties?: Record<string, any>) => {
    trackApiError(endpoint, statusCode, errorMessage, properties)
  }, [])

  // AI model usage tracking
  const trackAIModel = useCallback((modelName: string, operation: string, properties?: Record<string, any>) => {
    trackAIModelUsage(modelName, operation, properties)
  }, [])

  // Assessment workflow tracking
  const trackAssessment = useCallback((step: string, assessmentType: string, properties?: Record<string, any>) => {
    trackAssessmentWorkflow(step, assessmentType, properties)
  }, [])

  // Dashboard view tracking
  const trackDashboard = useCallback((dashboardName: string, properties?: Record<string, any>) => {
    trackDashboardView(dashboardName, properties)
  }, [])

  return {
    track,
    trackFeature,
    trackForm,
    trackError,
    trackButtonClick,
    trackJourney,
    trackApiErrorEvent,
    trackAIModel,
    trackAssessment,
    trackDashboard,
  }
}

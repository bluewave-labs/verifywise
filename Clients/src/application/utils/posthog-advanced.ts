// Advanced PostHog Analytics

import { trackEvent } from './posthog'

// Session tracking
let currentSessionId: string | null = null
let sessionStartTime: number | null = null

function generateSessionId(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

export const startSession = (userId?: string) => {
  currentSessionId = generateSessionId()
  sessionStartTime = Date.now()

  trackEvent('session_start', {
    session_id: currentSessionId,
    user_id: userId,
  })

  return currentSessionId
}

export const endSession = () => {
  if (!currentSessionId || !sessionStartTime) return

  const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000)

  trackEvent('session_end', {
    session_id: currentSessionId,
    duration_seconds: durationSeconds,
  })

  currentSessionId = null
  sessionStartTime = null
}

export const getSessionId = () => currentSessionId

// User Journey Tracking
export const trackUserJourney = (journey: string, step: string, properties?: Record<string, any>) => {
  trackEvent(`user_journey_${journey}`, {
    journey_type: journey,
    step,
    session_id: currentSessionId,
    ...properties,
  })
}

// API Error Tracking
export const trackApiError = (endpoint: string, statusCode: number, errorMessage?: string, properties?: Record<string, any>) => {
  trackEvent('api_error', {
    endpoint,
    status_code: statusCode,
    error_message: errorMessage || 'Unknown error',
    session_id: currentSessionId,
    ...properties,
  })
}

// Dashboard View Tracking
export const trackDashboardView = (dashboardName: string, properties?: Record<string, any>) => {
  trackEvent('dashboard_view', {
    dashboard_name: dashboardName,
    session_id: currentSessionId,
    ...properties,
  })
}

// AI Model Usage Tracking
export const trackAIModelUsage = (modelName: string, operation: string, properties?: Record<string, any>) => {
  trackEvent('ai_model_usage', {
    model_name: modelName,
    operation,
    session_id: currentSessionId,
    ...properties,
  })
}

// Assessment Workflow Tracking
export const trackAssessmentWorkflow = (step: string, assessmentType: string, properties?: Record<string, any>) => {
  trackEvent('assessment_workflow', {
    step,
    assessment_type: assessmentType,
    session_id: currentSessionId,
    ...properties,
  })
}

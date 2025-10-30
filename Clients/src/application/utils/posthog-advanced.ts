// Advanced PostHog Analytics - Phase 2 Features

import { trackEvent, getPostHog } from './posthog'

// User Journey & Funnel Tracking
export const trackUserJourney = (journey: string, step: string, properties?: Record<string, any>) => {
  trackEvent(`user_journey_${journey}`, {
    journey_type: journey,
    step,
    step_number: properties?.step_number || 1,
    ...properties,
  })
}

export const trackFunnelStep = (funnelName: string, step: string, properties?: Record<string, any>) => {
  trackEvent(`funnel_${funnelName}_${step}`, {
    funnel_name: funnelName,
    step,
    timestamp: new Date().toISOString(),
    ...properties,
  })
}

// Session Analytics
export const trackSessionStart = (userId: string, properties?: Record<string, any>) => {
  trackEvent('session_start', {
    user_id: userId,
    session_id: generateSessionId(),
    timestamp: new Date().toISOString(),
    ...properties,
  })
}

export const trackSessionEnd = (sessionId: string, duration: number, properties?: Record<string, any>) => {
  trackEvent('session_end', {
    session_id: sessionId,
    duration_seconds: duration,
    timestamp: new Date().toISOString(),
    ...properties,
  })
}

export const trackPageEngagement = (page: string, engagementTime: number, properties?: Record<string, any>) => {
  trackEvent('page_engagement', {
    page,
    engagement_time_seconds: engagementTime,
    timestamp: new Date().toISOString(),
    ...properties,
  })
}

// Business Intelligence Metrics
export const trackUserRetention = (userId: string, daysSinceLastVisit: number, properties?: Record<string, any>) => {
  trackEvent('user_retention', {
    user_id: userId,
    days_since_last_visit: daysSinceLastVisit,
    retention_cohort: getCohortPeriod(daysSinceLastVisit),
    ...properties,
  })
}

export const trackFeatureAdoption = (featureName: string, userId: string, properties?: Record<string, any>) => {
  trackEvent('feature_adoption', {
    feature_name: featureName,
    user_id: userId,
    adoption_date: new Date().toISOString(),
    ...properties,
  })
}

export const trackConversion = (conversionType: string, fromStage: string, toStage: string, properties?: Record<string, any>) => {
  trackEvent('conversion', {
    conversion_type: conversionType,
    from_stage: fromStage,
    to_stage: toStage,
    timestamp: new Date().toISOString(),
    ...properties,
  })
}

// Performance & Error Tracking
export const trackPerformance = (metric: string, value: number, properties?: Record<string, any>) => {
  trackEvent('performance_metric', {
    metric_name: metric,
    value,
    unit: properties?.unit || 'ms',
    timestamp: new Date().toISOString(),
    ...properties,
  })
}

export const trackErrorBoundary = (error: Error, errorInfo: any, properties?: Record<string, any>) => {
  trackEvent('error_boundary', {
    error_message: error.message,
    error_stack: error.stack,
    component_stack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    ...properties,
  })
}

export const trackApiError = (endpoint: string, statusCode: number, error: any, properties?: Record<string, any>) => {
  trackEvent('api_error', {
    endpoint,
    status_code: statusCode,
    error_message: error?.message || 'Unknown error',
    timestamp: new Date().toISOString(),
    ...properties,
  })
}

// AI & Model Usage Analytics
export const trackAIModelUsage = (modelName: string, operation: string, properties?: Record<string, any>) => {
  trackEvent('ai_model_usage', {
    model_name: modelName,
    operation, // 'generate', 'analyze', 'evaluate', etc.
    timestamp: new Date().toISOString(),
    ...properties,
  })
}

export const trackAssessmentWorkflow = (step: string, assessmentType: string, properties?: Record<string, any>) => {
  trackEvent('assessment_workflow', {
    step,
    assessment_type: assessmentType,
    timestamp: new Date().toISOString(),
    ...properties,
  })
}

export const trackComplianceReport = (reportType: string, format: string, properties?: Record<string, any>) => {
  trackEvent('compliance_report', {
    report_type: reportType,
    format, // 'pdf', 'excel', 'json', etc.
    timestamp: new Date().toISOString(),
    ...properties,
  })
}

// Dashboard & Feature Interaction Analytics
export const trackDashboardView = (dashboardName: string, properties?: Record<string, any>) => {
  trackEvent('dashboard_view', {
    dashboard_name: dashboardName,
    timestamp: new Date().toISOString(),
    ...properties,
  })
}

export const trackFilterUsage = (filterType: string, filterValue: string, properties?: Record<string, any>) => {
  trackEvent('filter_usage', {
    filter_type: filterType,
    filter_value: filterValue,
    timestamp: new Date().toISOString(),
    ...properties,
  })
}

export const trackExportAction = (dataType: string, format: string, properties?: Record<string, any>) => {
  trackEvent('export_action', {
    data_type: dataType,
    format,
    timestamp: new Date().toISOString(),
    ...properties,
  })
}

// Collaboration & Team Analytics
export const trackTeamActivity = (action: string, teamId: string, properties?: Record<string, any>) => {
  trackEvent('team_activity', {
    action, // 'invite', 'join', 'leave', 'role_change'
    team_id: teamId,
    timestamp: new Date().toISOString(),
    ...properties,
  })
}

export const trackSharingAction = (contentType: string, shareMethod: string, properties?: Record<string, any>) => {
  trackEvent('sharing_action', {
    content_type: contentType, // 'report', 'assessment', 'dashboard'
    share_method: shareMethod, // 'email', 'link', 'export'
    timestamp: new Date().toISOString(),
    ...properties,
  })
}

// Utility Functions
function generateSessionId(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

function getCohortPeriod(days: number): string {
  if (days <= 1) return 'day_1'
  if (days <= 7) return 'week_1'
  if (days <= 30) return 'month_1'
  if (days <= 90) return 'quarter_1'
  return 'long_term'
}

// Advanced user properties for segmentation
export const setUserProperties = (properties: Record<string, any>) => {
  const client = getPostHog()
  if (!client) return

  try {
    client.setPersonProperties(properties)
    console.log('PostHog: User properties set', properties)
  } catch (error) {
    console.warn('PostHog: Failed to set user properties', error)
  }
}

export const setGroupProperties = (groupType: string, groupKey: string, properties: Record<string, any>) => {
  const client = getPostHog()
  if (!client) return

  try {
    client.group(groupType, groupKey, properties)
    console.log('PostHog: Group properties set', { groupType, groupKey, properties })
  } catch (error) {
    console.warn('PostHog: Failed to set group properties', error)
  }
}
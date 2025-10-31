import { useCallback } from 'react'
import { trackEvent, trackFeatureUsage, trackFormInteraction } from '../utils/posthog'
import {
  trackUserJourney,
  trackFunnelStep,
  trackPageEngagement,
  trackUserRetention,
  trackFeatureAdoption,
  trackConversion,
  trackPerformance,
  trackErrorBoundary,
  trackApiError,
  trackAIModelUsage,
  trackAssessmentWorkflow,
  trackComplianceReport,
  trackDashboardView,
  trackFilterUsage,
  trackExportAction,
  trackTeamActivity,
  trackSharingAction,
  setUserProperties,
  setGroupProperties,
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
    // Simple error tracking without PostHog for now
    console.error('Tracked error:', error, context)
  }, [])

  // Common feature tracking methods
  const trackButtonClick = useCallback((buttonName: string, context?: Record<string, any>) => {
    trackEvent('button_clicked', {
      button_name: buttonName,
      ...context
    })
  }, [])

  const trackNavigation = useCallback((destination: string, context?: Record<string, any>) => {
    trackEvent('navigation', {
      destination,
      ...context
    })
  }, [])

  const trackModalInteraction = useCallback((modalName: string, action: 'open' | 'close' | 'submit', properties?: Record<string, any>) => {
    trackEvent(`modal_${modalName}_${action}`, {
      modal_name: modalName,
      action,
      ...properties
    })
  }, [])

  const trackFileOperation = useCallback((operation: 'upload' | 'download' | 'delete', fileType: string, context?: Record<string, any>) => {
    trackEvent(`file_${operation}`, {
      file_type: fileType,
      operation,
      ...context
    })
  }, [])

  // Advanced analytics methods
  const trackJourney = useCallback((journey: string, step: string, properties?: Record<string, any>) => {
    trackUserJourney(journey, step, properties)
  }, [])

  const trackFunnel = useCallback((funnelName: string, step: string, properties?: Record<string, any>) => {
    trackFunnelStep(funnelName, step, properties)
  }, [])

  const trackEngagement = useCallback((page: string, engagementTime: number, properties?: Record<string, any>) => {
    trackPageEngagement(page, engagementTime, properties)
  }, [])

  const trackRetention = useCallback((userId: string, daysSinceLastVisit: number, properties?: Record<string, any>) => {
    trackUserRetention(userId, daysSinceLastVisit, properties)
  }, [])

  const trackAdoption = useCallback((featureName: string, userId: string, properties?: Record<string, any>) => {
    trackFeatureAdoption(featureName, userId, properties)
  }, [])

  const trackConversionEvent = useCallback((conversionType: string, fromStage: string, toStage: string, properties?: Record<string, any>) => {
    trackConversion(conversionType, fromStage, toStage, properties)
  }, [])

  const trackPerformanceMetric = useCallback((metric: string, value: number, properties?: Record<string, any>) => {
    trackPerformance(metric, value, properties)
  }, [])

  const trackErrorBoundaryEvent = useCallback((error: Error, errorInfo: any, properties?: Record<string, any>) => {
    trackErrorBoundary(error, errorInfo, properties)
  }, [])

  const trackApiErrorEvent = useCallback((endpoint: string, statusCode: number, error: any, properties?: Record<string, any>) => {
    trackApiError(endpoint, statusCode, error, properties)
  }, [])

  const trackAIModel = useCallback((modelName: string, operation: string, properties?: Record<string, any>) => {
    trackAIModelUsage(modelName, operation, properties)
  }, [])

  const trackAssessment = useCallback((step: string, assessmentType: string, properties?: Record<string, any>) => {
    trackAssessmentWorkflow(step, assessmentType, properties)
  }, [])

  const trackReport = useCallback((reportType: string, format: string, properties?: Record<string, any>) => {
    trackComplianceReport(reportType, format, properties)
  }, [])

  const trackDashboard = useCallback((dashboardName: string, properties?: Record<string, any>) => {
    trackDashboardView(dashboardName, properties)
  }, [])

  const trackFilter = useCallback((filterType: string, filterValue: string, properties?: Record<string, any>) => {
    trackFilterUsage(filterType, filterValue, properties)
  }, [])

  const trackExport = useCallback((dataType: string, format: string, properties?: Record<string, any>) => {
    trackExportAction(dataType, format, properties)
  }, [])

  const trackTeam = useCallback((action: string, teamId: string, properties?: Record<string, any>) => {
    trackTeamActivity(action, teamId, properties)
  }, [])

  const trackSharing = useCallback((contentType: string, shareMethod: string, properties?: Record<string, any>) => {
    trackSharingAction(contentType, shareMethod, properties)
  }, [])

  const setUserProps = useCallback((properties: Record<string, any>) => {
    setUserProperties(properties)
  }, [])

  const setGroupProps = useCallback((groupType: string, groupKey: string, properties: Record<string, any>) => {
    setGroupProperties(groupType, groupKey, properties)
  }, [])

  return {
    // Basic tracking
    track,
    trackFeature,
    trackForm,
    trackError,
    trackButtonClick,
    trackNavigation,
    trackModalInteraction,
    trackFileOperation,

    // Advanced analytics
    trackJourney,
    trackFunnel,
    trackEngagement,
    trackRetention,
    trackAdoption,
    trackConversionEvent,
    trackPerformanceMetric,
    trackErrorBoundaryEvent,
    trackApiErrorEvent,
    trackAIModel,
    trackAssessment,
    trackReport,
    trackDashboard,
    trackFilter,
    trackExport,
    trackTeam,
    trackSharing,
    setUserProps,
    setGroupProps,
  }
}
// React Hook for Performance Monitoring

import { useEffect, useRef, useCallback } from 'react';
import {
  trackComponentRenderPerformance,
  trackNavigationPerformance,
  createPerformanceMark,
  measurePerformance,
} from '../utils/performance-monitoring';

/**
 * Hook to track component mount and update performance
 * @param componentName - Name of the component being tracked
 * @param dependencies - Dependencies to track for updates
 */
export const useComponentPerformance = (
  componentName: string,
  dependencies: any[] = []
) => {
  const mountTimeRef = useRef<number>(performance.now());
  const updateCountRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(performance.now());

  // Track component mount
  useEffect(() => {
    const mountDuration = performance.now() - mountTimeRef.current;
    trackComponentRenderPerformance(componentName, mountDuration, 'mount');

    // Cleanup on unmount
    return () => {
      const totalLifetime = performance.now() - mountTimeRef.current;
      trackComponentRenderPerformance(
        componentName,
        totalLifetime,
        'mount'
      );
    };
  }, [componentName]);

  // Track component updates
  useEffect(() => {
    if (updateCountRef.current > 0) {
      const updateDuration = performance.now() - lastRenderTimeRef.current;
      trackComponentRenderPerformance(componentName, updateDuration, 'update');
    }
    updateCountRef.current++;
    lastRenderTimeRef.current = performance.now();
  }, dependencies);
};

/**
 * Hook to track navigation performance between routes
 */
export const useNavigationPerformance = () => {
  const navigationStartRef = useRef<number>(0);
  const previousPathRef = useRef<string>('');

  const startNavigation = useCallback((fromPath: string) => {
    navigationStartRef.current = performance.now();
    previousPathRef.current = fromPath;
  }, []);

  const endNavigation = useCallback((toPath: string) => {
    if (navigationStartRef.current > 0) {
      trackNavigationPerformance(
        previousPathRef.current,
        toPath,
        navigationStartRef.current
      );
      navigationStartRef.current = 0;
    }
  }, []);

  return { startNavigation, endNavigation };
};

/**
 * Hook to create custom performance measurements
 */
export const usePerformanceMeasure = () => {
  const marks = useRef<Map<string, number>>(new Map());

  const startMeasure = useCallback((measureName: string) => {
    const markName = `${measureName}_start`;
    createPerformanceMark(markName);
    marks.current.set(measureName, performance.now());
  }, []);

  const endMeasure = useCallback((measureName: string, metadata?: Record<string, any>) => {
    const startTime = marks.current.get(measureName);
    if (startTime) {
      const endMarkName = `${measureName}_end`;
      createPerformanceMark(endMarkName);
      measurePerformance(
        measureName,
        `${measureName}_start`,
        endMarkName,
        metadata
      );
      marks.current.delete(measureName);
    }
  }, []);

  return { startMeasure, endMeasure };
};

/**
 * Hook to track data fetching performance
 */
export const useDataFetchPerformance = () => {
  const startFetch = useCallback((fetchName: string) => {
    createPerformanceMark(`fetch_${fetchName}_start`);
    return performance.now();
  }, []);

  const endFetch = useCallback((
    fetchName: string,
    startTime: number,
    success: boolean,
    recordCount?: number
  ) => {
    const endMarkName = `fetch_${fetchName}_end`;
    createPerformanceMark(endMarkName);
    measurePerformance(
      `data_fetch_${fetchName}`,
      `fetch_${fetchName}_start`,
      endMarkName,
      {
        success,
        record_count: recordCount,
        is_slow: (performance.now() - startTime) > 1000,
      }
    );
  }, []);

  return { startFetch, endFetch };
};

/**
 * Hook to track form submission performance
 */
export const useFormPerformance = (formName: string) => {
  const formStartTimeRef = useRef<number>(0);
  const fieldInteractionCountRef = useRef<number>(0);

  const trackFormStart = useCallback(() => {
    formStartTimeRef.current = performance.now();
    fieldInteractionCountRef.current = 0;
    createPerformanceMark(`form_${formName}_start`);
  }, [formName]);

  const trackFieldInteraction = useCallback(() => {
    fieldInteractionCountRef.current++;
  }, []);

  const trackFormSubmit = useCallback((success: boolean, validationErrors?: number) => {
    if (formStartTimeRef.current > 0) {
      const endMarkName = `form_${formName}_submit`;
      createPerformanceMark(endMarkName);
      measurePerformance(
        `form_completion_${formName}`,
        `form_${formName}_start`,
        endMarkName,
        {
          success,
          field_interactions: fieldInteractionCountRef.current,
          validation_errors: validationErrors || 0,
          form_name: formName,
        }
      );
    }
  }, [formName]);

  return {
    trackFormStart,
    trackFieldInteraction,
    trackFormSubmit,
  };
};

/**
 * Hook to track search performance
 */
export const useSearchPerformance = () => {
  const searchStartRef = useRef<number>(0);

  const startSearch = useCallback((query: string) => {
    searchStartRef.current = performance.now();
    createPerformanceMark(`search_${query}_start`);
  }, []);

  const endSearch = useCallback((
    query: string,
    resultCount: number,
    hasResults: boolean
  ) => {
    if (searchStartRef.current > 0) {
      const duration = performance.now() - searchStartRef.current;
      const endMarkName = `search_${query}_end`;
      createPerformanceMark(endMarkName);
      measurePerformance(
        `search_execution`,
        `search_${query}_start`,
        endMarkName,
        {
          query,
          result_count: resultCount,
          has_results: hasResults,
          is_zero_results: resultCount === 0,
          search_time_ms: Math.round(duration),
        }
      );
    }
  }, []);

  return { startSearch, endSearch };
};

export default useComponentPerformance;

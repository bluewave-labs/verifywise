// Performance Monitoring for PostHog Analytics

import { trackPerformance } from './posthog-advanced';

/**
 * Initialize performance monitoring
 * Tracks Web Vitals and custom performance metrics
 */
export const initializePerformanceMonitoring = () => {
  // Track Web Vitals using Performance Observer API
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      // Track Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        trackPerformance('largest_contentful_paint', Math.round(lastEntry.startTime), {
          metric_type: 'web_vital',
          unit: 'ms',
          url: window.location.pathname,
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Track First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          trackPerformance('first_input_delay', Math.round(fid), {
            metric_type: 'web_vital',
            unit: 'ms',
            url: window.location.pathname,
          });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Track Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Report CLS when user leaves the page
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          trackPerformance('cumulative_layout_shift', Math.round(clsValue * 1000) / 1000, {
            metric_type: 'web_vital',
            unit: 'score',
            url: window.location.pathname,
          });
        }
      });

      console.log('Performance monitoring initialized');
    } catch (error) {
      console.warn('Failed to initialize performance monitoring:', error);
    }
  }
};

/**
 * Track page load performance
 * Measures complete page load time including resources
 */
export const trackPageLoadPerformance = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.navigationStart;
      const domInteractive = perfData.domInteractive - perfData.navigationStart;
      const resourceLoadTime = perfData.loadEventEnd - perfData.domContentLoadedEventEnd;

      // Track overall page load time
      trackPerformance('page_load_time', pageLoadTime, {
        metric_type: 'page_load',
        unit: 'ms',
        url: window.location.pathname,
        dom_content_loaded: domContentLoaded,
        dom_interactive: domInteractive,
        resource_load_time: resourceLoadTime,
      });

      // Track DNS lookup time
      const dnsTime = perfData.domainLookupEnd - perfData.domainLookupStart;
      if (dnsTime > 0) {
        trackPerformance('dns_lookup_time', dnsTime, {
          metric_type: 'network',
          unit: 'ms',
        });
      }

      // Track TCP connection time
      const tcpTime = perfData.connectEnd - perfData.connectStart;
      if (tcpTime > 0) {
        trackPerformance('tcp_connection_time', tcpTime, {
          metric_type: 'network',
          unit: 'ms',
        });
      }

      // Track server response time
      const serverResponseTime = perfData.responseEnd - perfData.requestStart;
      if (serverResponseTime > 0) {
        trackPerformance('server_response_time', serverResponseTime, {
          metric_type: 'network',
          unit: 'ms',
        });
      }

      // Track DOM processing time
      const domProcessingTime = perfData.domComplete - perfData.domLoading;
      trackPerformance('dom_processing_time', domProcessingTime, {
        metric_type: 'dom',
        unit: 'ms',
      });

      console.log('Page load performance tracked:', {
        pageLoadTime,
        domContentLoaded,
        domInteractive,
        resourceLoadTime,
      });
    }, 0);
  });
};

/**
 * Track navigation performance (SPA route changes)
 */
export const trackNavigationPerformance = (fromUrl: string, toUrl: string, startTime: number) => {
  const navigationTime = performance.now() - startTime;

  trackPerformance('spa_navigation_time', Math.round(navigationTime), {
    metric_type: 'navigation',
    unit: 'ms',
    from_url: fromUrl,
    to_url: toUrl,
  });
};

/**
 * Track API request performance
 */
export const trackAPIPerformance = (
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number,
  success: boolean
) => {
  trackPerformance('api_response_time', Math.round(duration), {
    metric_type: 'api',
    unit: 'ms',
    endpoint,
    method,
    status_code: statusCode,
    success,
    is_slow: duration > 1000, // Flag slow requests (>1s)
    is_very_slow: duration > 3000, // Flag very slow requests (>3s)
  });

  // Track slow API calls separately for easier monitoring
  if (duration > 1000) {
    trackPerformance('slow_api_call', Math.round(duration), {
      metric_type: 'api_performance_issue',
      unit: 'ms',
      endpoint,
      method,
      status_code: statusCode,
    });
  }
};

/**
 * Track component render performance
 */
export const trackComponentRenderPerformance = (
  componentName: string,
  renderTime: number,
  renderType: 'mount' | 'update' = 'mount'
) => {
  trackPerformance('component_render_time', Math.round(renderTime), {
    metric_type: 'react_performance',
    unit: 'ms',
    component_name: componentName,
    render_type: renderType,
    is_slow: renderTime > 100, // Flag slow renders (>100ms)
  });

  // Track slow component renders separately
  if (renderTime > 100) {
    trackPerformance('slow_component_render', Math.round(renderTime), {
      metric_type: 'react_performance_issue',
      unit: 'ms',
      component_name: componentName,
      render_type: renderType,
    });
  }
};

/**
 * Track resource loading performance (images, scripts, styles)
 */
export const trackResourceLoadingPerformance = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      const resourceStats = {
        script: { count: 0, totalSize: 0, totalTime: 0 },
        stylesheet: { count: 0, totalSize: 0, totalTime: 0 },
        image: { count: 0, totalSize: 0, totalTime: 0 },
        fetch: { count: 0, totalSize: 0, totalTime: 0 },
      };

      resources.forEach((resource) => {
        const duration = resource.responseEnd - resource.startTime;
        const size = resource.transferSize || 0;

        if (resource.initiatorType === 'script') {
          resourceStats.script.count++;
          resourceStats.script.totalTime += duration;
          resourceStats.script.totalSize += size;
        } else if (resource.initiatorType === 'link' || resource.initiatorType === 'css') {
          resourceStats.stylesheet.count++;
          resourceStats.stylesheet.totalTime += duration;
          resourceStats.stylesheet.totalSize += size;
        } else if (resource.initiatorType === 'img') {
          resourceStats.image.count++;
          resourceStats.image.totalTime += duration;
          resourceStats.image.totalSize += size;
        } else if (resource.initiatorType === 'fetch' || resource.initiatorType === 'xmlhttprequest') {
          resourceStats.fetch.count++;
          resourceStats.fetch.totalTime += duration;
          resourceStats.fetch.totalSize += size;
        }

        // Track individual slow resources
        if (duration > 1000) {
          trackPerformance('slow_resource_load', Math.round(duration), {
            metric_type: 'resource_performance_issue',
            unit: 'ms',
            resource_type: resource.initiatorType,
            resource_name: resource.name,
            size_bytes: size,
          });
        }
      });

      // Track aggregate resource statistics
      Object.entries(resourceStats).forEach(([type, stats]) => {
        if (stats.count > 0) {
          trackPerformance(`${type}_resources_total_time`, Math.round(stats.totalTime), {
            metric_type: 'resource_loading',
            unit: 'ms',
            resource_type: type,
            resource_count: stats.count,
            total_size_bytes: stats.totalSize,
            avg_time_ms: Math.round(stats.totalTime / stats.count),
          });
        }
      });

      console.log('Resource loading performance tracked:', resourceStats);
    }, 0);
  });
};

/**
 * Track memory usage (if available)
 */
export const trackMemoryUsage = () => {
  if (typeof window === 'undefined') return;

  // @ts-ignore - performance.memory is non-standard but available in Chrome
  const memory = (performance as any).memory;

  if (memory) {
    trackPerformance('memory_usage', Math.round(memory.usedJSHeapSize / 1048576), {
      metric_type: 'memory',
      unit: 'MB',
      used_heap_mb: Math.round(memory.usedJSHeapSize / 1048576),
      total_heap_mb: Math.round(memory.totalJSHeapSize / 1048576),
      heap_limit_mb: Math.round(memory.jsHeapSizeLimit / 1048576),
    });
  }
};

/**
 * Track time to interactive (TTI)
 */
export const trackTimeToInteractive = () => {
  if (typeof window === 'undefined') return;

  // Simple TTI approximation using requestIdleCallback
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      const tti = performance.now();
      trackPerformance('time_to_interactive', Math.round(tti), {
        metric_type: 'user_experience',
        unit: 'ms',
        url: window.location.pathname,
      });
    });
  }
};

/**
 * Create a performance mark
 */
export const createPerformanceMark = (markName: string) => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(markName);
  }
};

/**
 * Measure performance between two marks
 */
export const measurePerformance = (
  measureName: string,
  startMark: string,
  endMark: string,
  metadata?: Record<string, any>
) => {
  if (typeof window === 'undefined' || !('performance' in window)) return;

  try {
    performance.measure(measureName, startMark, endMark);
    const measure = performance.getEntriesByName(measureName)[0];

    if (measure) {
      trackPerformance(measureName, Math.round(measure.duration), {
        metric_type: 'custom_measurement',
        unit: 'ms',
        start_mark: startMark,
        end_mark: endMark,
        ...metadata,
      });

      // Clean up marks and measures
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
    }
  } catch (error) {
    console.warn('Failed to measure performance:', error);
  }
};

/**
 * Get current FPS (frames per second)
 */
export const trackFPS = () => {
  if (typeof window === 'undefined') return;

  let lastTime = performance.now();
  let frames = 0;

  const measureFPS = () => {
    frames++;
    const currentTime = performance.now();

    if (currentTime >= lastTime + 1000) {
      const fps = Math.round((frames * 1000) / (currentTime - lastTime));

      trackPerformance('frames_per_second', fps, {
        metric_type: 'rendering',
        unit: 'fps',
        is_low_fps: fps < 30, // Flag low FPS
      });

      frames = 0;
      lastTime = currentTime;
    }

    requestAnimationFrame(measureFPS);
  };

  // Start measuring after a delay to avoid initial page load
  setTimeout(() => {
    requestAnimationFrame(measureFPS);
  }, 3000);
};

/**
 * Initialize all performance monitoring
 */
export const initializeAllPerformanceMonitoring = () => {
  console.log('Initializing comprehensive performance monitoring...');

  initializePerformanceMonitoring();
  trackPageLoadPerformance();
  trackResourceLoadingPerformance();
  trackTimeToInteractive();

  // Track memory usage periodically (every 30 seconds)
  setInterval(() => {
    trackMemoryUsage();
  }, 30000);

  // Track FPS for the first minute
  trackFPS();

  console.log('Performance monitoring fully initialized');
};

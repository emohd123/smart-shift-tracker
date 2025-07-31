import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  loadTime: number;
  memoryUsage: number;
  fps: number;
  timestamp: number;
}

interface ComponentMetrics {
  name: string;
  renderCount: number;
  averageRenderTime: number;
  maxRenderTime: number;
  lastRenderTime: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const [metrics, setMetrics] = useState<ComponentMetrics>({
    name: componentName,
    renderCount: 0,
    averageRenderTime: 0,
    maxRenderTime: 0,
    lastRenderTime: 0
  });

  const renderStartTime = useRef<number>();
  const renderTimes = useRef<number[]>([]);
  const frameCount = useRef(0);
  const fpsStartTime = useRef(Date.now());

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      renderTimes.current.push(renderTime);
      
      // Keep only last 100 render times
      if (renderTimes.current.length > 100) {
        renderTimes.current.shift();
      }

      const newMetrics: ComponentMetrics = {
        name: componentName,
        renderCount: metrics.renderCount + 1,
        lastRenderTime: renderTime,
        maxRenderTime: Math.max(metrics.maxRenderTime, renderTime),
        averageRenderTime: renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
      };

      setMetrics(newMetrics);

      // Log slow renders
      if (renderTime > 16) {
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }

      // Track performance metrics
      if ('performance' in window && 'measure' in performance) {
        performance.mark(`${componentName}-render-end`);
        performance.measure(
          `${componentName}-render`,
          `${componentName}-render-start`,
          `${componentName}-render-end`
        );
      }
    }
  });

  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      };
    }
    return null;
  }, []);

  const measureFPS = useCallback(() => {
    frameCount.current++;
    const now = Date.now();
    const elapsed = now - fpsStartTime.current;
    
    if (elapsed >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / elapsed);
      frameCount.current = 0;
      fpsStartTime.current = now;
      return fps;
    }
    
    requestAnimationFrame(() => measureFPS());
    return null;
  }, []);

  const exportMetrics = useCallback((): PerformanceMetrics => {
    const memory = getMemoryUsage();
    return {
      renderTime: metrics.lastRenderTime,
      loadTime: performance.now(),
      memoryUsage: memory?.used || 0,
      fps: measureFPS() || 60,
      timestamp: Date.now()
    };
  }, [metrics, getMemoryUsage, measureFPS]);

  return {
    metrics,
    exportMetrics,
    getMemoryUsage,
    measureFPS
  };
};

// Error tracking hook
export const useErrorTracking = () => {
  const [errors, setErrors] = useState<Array<{
    id: string;
    message: string;
    stack?: string;
    timestamp: number;
    component?: string;
    userAgent: string;
    url: string;
  }>>([]);

  const trackError = useCallback((error: Error, component?: string) => {
    const errorRecord = {
      id: Date.now().toString(),
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      component,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    setErrors(prev => [...prev, errorRecord]);

    // Log to console for development
    console.error('Error tracked:', errorRecord);

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // analytics.track('error', errorRecord);
    }

    return errorRecord.id;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const getErrorsByComponent = useCallback((componentName: string) => {
    return errors.filter(error => error.component === componentName);
  }, [errors]);

  return {
    errors,
    trackError,
    clearErrors,
    getErrorsByComponent,
    errorCount: errors.length
  };
};

// Real User Monitoring (RUM) hook
export const useRealUserMonitoring = () => {
  const [vitals, setVitals] = useState<{
    CLS: number;
    FID: number;
    FCP: number;
    LCP: number;
    TTFB: number;
  }>({
    CLS: 0,
    FID: 0,
    FCP: 0,
    LCP: 0,
    TTFB: 0
  });

  useEffect(() => {
    // Measure Core Web Vitals
    const measureVitals = () => {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcp = entries[entries.length - 1];
        setVitals(prev => ({ ...prev, FCP: fcp.startTime }));
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcp = entries[entries.length - 1];
        setVitals(prev => ({ ...prev, LCP: lcp.startTime }));
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'first-input') {
            const fidEntry = entry as any; // Type assertion for FID properties
            const fid = fidEntry.processingStart - fidEntry.startTime;
            setVitals(prev => ({ ...prev, FID: fid }));
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        setVitals(prev => ({ ...prev, CLS: clsValue }));
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Time to First Byte
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        setVitals(prev => ({ ...prev, TTFB: ttfb }));
      }
    };

    measureVitals();
  }, []);

  const getVitalsScore = useCallback(() => {
    const scores = {
      CLS: vitals.CLS < 0.1 ? 'good' : vitals.CLS < 0.25 ? 'needs-improvement' : 'poor',
      FID: vitals.FID < 100 ? 'good' : vitals.FID < 300 ? 'needs-improvement' : 'poor',
      FCP: vitals.FCP < 1800 ? 'good' : vitals.FCP < 3000 ? 'needs-improvement' : 'poor',
      LCP: vitals.LCP < 2500 ? 'good' : vitals.LCP < 4000 ? 'needs-improvement' : 'poor',
      TTFB: vitals.TTFB < 800 ? 'good' : vitals.TTFB < 1800 ? 'needs-improvement' : 'poor'
    };

    const goodCount = Object.values(scores).filter(score => score === 'good').length;
    const overallScore = goodCount >= 4 ? 'good' : goodCount >= 2 ? 'needs-improvement' : 'poor';

    return { scores, overallScore, vitals };
  }, [vitals]);

  return {
    vitals,
    getVitalsScore
  };
};

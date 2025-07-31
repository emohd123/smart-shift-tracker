import { useCallback, useMemo, useRef, useState } from "react";

// Debounce hook for performance optimization
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
};

// Throttle hook for performance optimization
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
};

// Memoized search/filter hook
export const useMemoizedFilter = <T>(
  data: T[],
  searchTerm: string,
  filterFn: (item: T, searchTerm: string) => boolean
) => {
  return useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item => filterFn(item, searchTerm));
  }, [data, searchTerm, filterFn]);
};

// Virtual scrolling hook for large lists
export const useVirtualScroll = (
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    itemCount
  );
  
  const totalHeight = itemCount * itemHeight;
  const offsetY = visibleStart * itemHeight;
  
  return {
    visibleStart,
    visibleEnd,
    totalHeight,
    offsetY,
    setScrollTop
  };
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>();
  const renderCount = useRef(0);

  // Track render start
  renderStartTime.current = performance.now();
  renderCount.current += 1;

  // Track render end
  const markRenderEnd = useCallback(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      
      if (renderTime > 16) { // Warn if render takes longer than one frame
        console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms (render #${renderCount.current})`);
      }
    }
  }, [componentName]);

  return { markRenderEnd, renderCount: renderCount.current };
};

// Optimized list rendering hook
export const useOptimizedList = <T>(
  items: T[],
  dependencies: any[] = []
) => {
  return useMemo(() => items, dependencies);
};
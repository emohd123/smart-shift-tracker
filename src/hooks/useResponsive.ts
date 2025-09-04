
import { useState, useEffect, useCallback } from "react";

type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

/**
 * A hook that provides responsive utilities based on window size
 * @returns Various responsive utilities and window information
 */
export function useResponsive() {
  // Use 0 as fallback for SSR
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const [windowHeight, setWindowHeight] = useState<number>(
    typeof window !== "undefined" ? window.innerHeight : 0
  );

  // Debounced resize handler to prevent too many updates
  const handleResize = useCallback(() => {
    setWindowWidth(window.innerWidth);
    setWindowHeight(window.innerHeight);
  }, []);

  useEffect(() => {
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // Responsive state values
  const isMobile = windowWidth < breakpoints.md;
  const isTablet = windowWidth >= breakpoints.md && windowWidth < breakpoints.lg;
  const isDesktop = windowWidth >= breakpoints.lg;
  
  // Screen orientation
  const isPortrait = windowHeight > windowWidth;
  const isLandscape = windowWidth > windowHeight;

  // Check if width is at or above a specific breakpoint
  const isBreakpoint = useCallback(
    (breakpoint: Breakpoint) => windowWidth >= breakpoints[breakpoint],
    [windowWidth]
  );
  
  // Get current breakpoint name
  const currentBreakpoint = useCallback((): Breakpoint => {
    if (windowWidth >= breakpoints["2xl"]) return "2xl";
    if (windowWidth >= breakpoints.xl) return "xl";
    if (windowWidth >= breakpoints.lg) return "lg";
    if (windowWidth >= breakpoints.md) return "md";
    if (windowWidth >= breakpoints.sm) return "sm";
    return "xs";
  }, [windowWidth]);

  return {
    windowWidth,
    windowHeight,
    isMobile,
    isTablet,
    isDesktop,
    isPortrait,
    isLandscape,
    isBreakpoint,
    currentBreakpoint,
    breakpoints,
  };
}

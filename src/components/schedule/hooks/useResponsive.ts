import { useState, useEffect } from "react";
import type { ResponsiveHook } from "../shared/types";

/**
 * Custom hook for responsive breakpoint detection with debouncing
 * Handles mobile/desktop detection based on screen width
 */
export function useResponsive(): ResponsiveHook {
  const [breakpoint, setBreakpoint] = useState<"mobile" | "desktop">(() => {
    // Initialize based on current window size (SSR-safe)
    if (typeof window !== "undefined") {
      return window.innerWidth < 1024 ? "mobile" : "desktop";
    }
    return "mobile"; // Default for SSR
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkBreakpoint = () => {
      const isMobile = window.innerWidth < 1024;
      const newBreakpoint = isMobile ? "mobile" : "desktop";

      if (newBreakpoint !== breakpoint) {
        // Debounce rapid resize events to prevent excessive re-renders
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setBreakpoint(newBreakpoint);
        }, 150);
      }
    };

    // Check on mount
    checkBreakpoint();

    // Listen for resize events
    window.addEventListener("resize", checkBreakpoint);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkBreakpoint);
      clearTimeout(timeoutId);
    };
  }, [breakpoint]);

  return {
    isMobile: breakpoint === "mobile",
    isDesktop: breakpoint === "desktop",
    breakpoint,
  };
}

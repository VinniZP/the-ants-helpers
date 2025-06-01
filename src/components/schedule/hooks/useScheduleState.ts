import { useState, useCallback, startTransition } from "react";
import type {
  ViewMode,
  LayoutMode,
  FocusFilter,
  ScheduleStateHook,
} from "../shared/types";

// Helper to get current day index (0 = Sunday, 1 = Monday, etc.)
function getCurrentDay(): number {
  return new Date().getDay();
}

/**
 * Custom hook for managing schedule view state
 * Handles day selection, view modes, and UI state with optimized updates
 */
export function useScheduleState(): ScheduleStateHook {
  // State initialization
  const [selectedDay, setSelectedDay] = useState<number>(getCurrentDay());
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("grid");
  const [focusFilter, setFocusFilter] = useState<FocusFilter>("all");
  const [visibleDays, setVisibleDays] = useState<boolean[]>([
    true,
    true,
    true,
    true,
    true,
    true,
    true, // All days visible by default
  ]);

  // Action handlers with useCallback for stability
  const handleSetSelectedDay = useCallback((day: number) => {
    if (day >= 0 && day <= 6) {
      setSelectedDay(day);
    }
  }, []);

  const handleSetViewMode = useCallback((mode: ViewMode) => {
    startTransition(() => {
      setViewMode(mode);
      // Auto-adjust selected day when switching to single view
      if (mode === "single") {
        setSelectedDay(getCurrentDay());
      }
    });
  }, []);

  const handleSetLayoutMode = useCallback((mode: LayoutMode) => {
    setLayoutMode(mode);
  }, []);

  const handleSetFocusFilter = useCallback((filter: FocusFilter) => {
    setFocusFilter(filter);
  }, []);

  const handleToggleDayVisibility = useCallback((day: number) => {
    if (day >= 0 && day <= 6) {
      setVisibleDays((prev) => {
        const newVisibleDays = [...prev];
        newVisibleDays[day] = !newVisibleDays[day];
        return newVisibleDays;
      });
    }
  }, []);

  return {
    state: {
      selectedDay,
      viewMode,
      layoutMode,
      focusFilter,
      visibleDays,
    },
    actions: {
      setSelectedDay: handleSetSelectedDay,
      setViewMode: handleSetViewMode,
      setLayoutMode: handleSetLayoutMode,
      setFocusFilter: handleSetFocusFilter,
      toggleDayVisibility: handleToggleDayVisibility,
    },
  };
}

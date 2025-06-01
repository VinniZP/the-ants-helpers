// Type definitions for the game schedule view rework
import type { GameEventReminder } from "../../../data/types";

// View mode types
export type ViewMode = "all" | "select" | "single";
export type LayoutMode = "grid" | "list";
export type FocusFilter = "all" | "active" | "inactive";

// Grouped events structure
export interface GroupedEvents {
  [utcTime: string]: GameEventReminder[];
}

// Event filtering configuration
export interface EventFilters {
  selectedDay?: number;
  viewMode: ViewMode;
  focusFilter: FocusFilter;
  visibleDays?: boolean[];
}

// Schedule state management
export interface ScheduleState {
  selectedDay: number;
  viewMode: ViewMode;
  layoutMode: LayoutMode;
  focusFilter: FocusFilter;
  visibleDays: boolean[];
}

// Event data structure
export interface EventData {
  events: GameEventReminder[];
  loading: boolean;
  eventsByTime: GroupedEvents;
  filteredEvents: GroupedEvents;
}

// Event toggle handler type
export type EventToggleHandler = (
  eventId: string,
  enabled: boolean,
  recurring?: boolean
) => Promise<void>;

// Hook return types
export interface ScheduleStateHook {
  state: ScheduleState;
  actions: {
    setSelectedDay: (day: number) => void;
    setViewMode: (mode: ViewMode) => void;
    setLayoutMode: (mode: LayoutMode) => void;
    setFocusFilter: (filter: FocusFilter) => void;
    toggleDayVisibility: (day: number) => void;
  };
}

export interface EventDataHook {
  data: EventData;
  actions: {
    loadEvents: () => Promise<void>;
    toggleEvent: EventToggleHandler;
    refreshEvents: () => Promise<void>;
  };
}

export interface ResponsiveHook {
  isMobile: boolean;
  isDesktop: boolean;
  breakpoint: "mobile" | "desktop";
}

// Component prop interfaces
export interface WeeklyScheduleProps {
  className?: string;
}

export interface MobileScheduleViewProps {
  scheduleState: ScheduleStateHook;
  eventData: EventDataHook;
}

export interface DesktopScheduleViewProps {
  scheduleState: ScheduleStateHook;
  eventData: EventDataHook;
}

export interface DayNavigatorProps {
  selectedDay: number;
  onDayChange: (day: number) => void;
  localizedDayNames: string[];
  showArrows?: boolean;
  showDayButtons?: boolean;
}

export interface ViewModeSelectorProps {
  viewMode: ViewMode;
  layoutMode: LayoutMode;
  focusFilter: FocusFilter;
  onViewModeChange: (mode: ViewMode) => void;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onFocusFilterChange: (filter: FocusFilter) => void;
}

export interface EventCardProps {
  event: GameEventReminder;
  onToggle: EventToggleHandler;
  size: "small" | "medium" | "large";
  className?: string;
}

export interface TimeSlotProps {
  utcTime: string;
  events: GameEventReminder[];
  viewMode: "mobile" | "desktop-grid" | "desktop-list";
  onEventToggle: EventToggleHandler;
  className?: string;
}

export interface TimeSlotGridProps {
  viewMode: ViewMode;
  selectedDay?: number;
  visibleDays?: boolean[];
  events: GroupedEvents;
  onEventToggle: EventToggleHandler;
  onDayToggle?: (day: number) => void;
}

export interface TimeSlotListProps {
  selectedDay: number;
  events: GroupedEvents;
  onEventToggle: EventToggleHandler;
}

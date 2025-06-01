import { useState, useEffect, useMemo, useCallback } from "react";
import { getAllGameEvents, toggleGameEvent } from "../../../data/database";
import { NotificationService } from "../../../services/notificationService";
import type { GameEventReminder } from "../../../data/types";
import type {
  EventDataHook,
  EventFilters,
  GroupedEvents,
} from "../shared/types";

/**
 * Groups game events by their UTC time
 */
function groupEventsByTime(events: GameEventReminder[]): GroupedEvents {
  return events.reduce((acc, event) => {
    if (!acc[event.utc_time]) {
      acc[event.utc_time] = [];
    }
    acc[event.utc_time].push(event);
    return acc;
  }, {} as GroupedEvents);
}

/**
 * Filters events based on view configuration
 */
function filterEventsForView(
  eventsByTime: GroupedEvents,
  filters: EventFilters
): GroupedEvents {
  const { selectedDay, viewMode, focusFilter, visibleDays } = filters;

  // Early return for simple cases
  if (focusFilter === "all" && viewMode === "all") {
    return eventsByTime;
  }

  return Object.entries(eventsByTime).reduce((acc, [time, timeEvents]) => {
    let filtered = timeEvents;

    // Apply focus filter (most selective first)
    if (focusFilter !== "all") {
      filtered = filtered.filter((event) =>
        focusFilter === "active" ? event.isEnabled : !event.isEnabled
      );
    }

    // Apply day visibility filter for select mode
    if (viewMode === "select" && visibleDays) {
      filtered = filtered.filter((event) => visibleDays[event.dayOfWeek]);
    }

    // Apply single day filter
    if (viewMode === "single" && selectedDay !== undefined) {
      filtered = filtered.filter((event) => event.dayOfWeek === selectedDay);
    }

    if (filtered.length > 0) {
      acc[time] = filtered;
    }

    return acc;
  }, {} as GroupedEvents);
}

/**
 * Custom hook for managing event data with filtering and caching
 */
export function useEventData(filters: EventFilters): EventDataHook {
  const [events, setEvents] = useState<GameEventReminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoize expensive operations
  const eventsByTime = useMemo(() => groupEventsByTime(events), [events]);

  const filteredEvents = useMemo(
    () => filterEventsForView(eventsByTime, filters),
    [eventsByTime, filters]
  );

  // Load events on mount
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const gameEvents = await getAllGameEvents();
      setEvents(gameEvents);
    } catch (error) {
      console.error("Error loading game events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle event handler with notification management
  const toggleEvent = useCallback(
    async (eventId: string, enabled: boolean, recurring?: boolean) => {
      try {
        // Update database first
        await toggleGameEvent(eventId, enabled, recurring);

        // Get the updated event for notification scheduling
        const updatedEvents = await getAllGameEvents();
        const updatedEvent = updatedEvents.find((e) => e.id === eventId);

        if (updatedEvent) {
          const notificationService = NotificationService.getInstance();

          if (enabled && updatedEvent.isEnabled) {
            // Schedule notification for the enabled game event
            await notificationService.scheduleGameEvent(updatedEvent);
          } else {
            // Cancel any existing notifications for this game event
            await notificationService.cancelNotification(eventId, "game");
          }
        }

        // Refresh the events list
        setEvents(updatedEvents);
      } catch (error) {
        console.error("Error toggling event:", error);
        throw error; // Re-throw to allow UI error handling
      }
    },
    []
  );

  // Refresh events (useful for manual refresh)
  const refreshEvents = useCallback(async () => {
    await loadEvents();
  }, [loadEvents]);

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    data: {
      events,
      loading,
      eventsByTime,
      filteredEvents,
    },
    actions: {
      loadEvents,
      toggleEvent,
      refreshEvents,
    },
  };
}

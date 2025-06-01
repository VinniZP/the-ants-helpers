import { memo } from "react";
import { EventCard } from "./EventCard";
import { formatGameEventTime } from "../../../lib/timezone";
import { getLocaleSettings, getLocalizedDayNames } from "../../../lib/locale";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { cn } from "../../../lib/utils";
import { Clock } from "lucide-react";
import type { TimeSlotGridProps } from "./types";

/**
 * Grid-based time slot component for desktop layouts
 * Displays events in a table-like structure with current time highlighting
 */
function TimeSlotGridComponent({
  viewMode,
  selectedDay,
  visibleDays,
  events,
  onEventToggle,
  onDayToggle,
}: TimeSlotGridProps) {
  const localeSettings = getLocaleSettings();
  const localizedDayNames = getLocalizedDayNames(localeSettings);
  const { isCurrentTimeSlot, isUpcomingTimeSlot, getCurrentDayOfWeek } =
    useCurrentTime();

  // Determine which days to show
  const daysToShow =
    viewMode === "single" && selectedDay !== undefined
      ? [selectedDay] // Show only the selected day
      : viewMode === "select" && visibleDays
      ? [0, 1, 2, 3, 4, 5, 6].filter((day) => visibleDays[day])
      : [0, 1, 2, 3, 4, 5, 6]; // All days

  // Get unique time slots and sort them
  const timeSlots = Object.keys(events).sort();

  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No events to display</p>
      </div>
    );
  }

  const currentDayOfWeek = getCurrentDayOfWeek();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[400px]">
        {/* Header Row */}
        <div
          className="grid gap-2 mb-4"
          style={{
            gridTemplateColumns: `120px repeat(${daysToShow.length}, 1fr)`,
          }}
        >
          {/* Time column header */}
          <div className="font-semibold text-sm text-gray-600 px-2 py-3 bg-gray-50 rounded">
            Time
          </div>

          {/* Day headers */}
          {daysToShow.map((dayIndex) => (
            <div
              key={dayIndex}
              className={cn(
                "font-semibold text-sm text-center px-2 py-3 rounded transition-colors",
                currentDayOfWeek === dayIndex
                  ? "bg-blue-100 text-blue-800 border-2 border-blue-300"
                  : viewMode === "select" && onDayToggle
                  ? "bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100"
                  : "bg-gray-50 text-gray-600"
              )}
              onClick={() => {
                if (viewMode === "select" && onDayToggle) {
                  onDayToggle(dayIndex);
                }
              }}
            >
              {localizedDayNames[dayIndex]}
              {currentDayOfWeek === dayIndex && (
                <span className="block text-xs text-blue-600 mt-1 font-medium">
                  Today
                </span>
              )}
              {viewMode === "select" && (
                <span className="block text-xs text-gray-500 mt-1">
                  Click to hide
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Time Slot Rows */}
        <div className="space-y-2">
          {timeSlots.map((timeSlot) => {
            const timeEvents = events[timeSlot] || [];
            const isCurrent = isCurrentTimeSlot(timeSlot);
            const isUpcoming = isUpcomingTimeSlot(timeSlot);

            return (
              <div
                key={timeSlot}
                className={cn(
                  "grid gap-2 transition-all duration-300",
                  isCurrent &&
                    "ring-2 ring-orange-400 ring-opacity-50 rounded-lg",
                  isUpcoming &&
                    !isCurrent &&
                    "ring-1 ring-blue-300 ring-opacity-50 rounded-lg"
                )}
                style={{
                  gridTemplateColumns: `120px repeat(${daysToShow.length}, 1fr)`,
                }}
              >
                {/* Time Label */}
                <div
                  className={cn(
                    "text-sm font-medium px-2 py-3 rounded flex items-center gap-2",
                    isCurrent
                      ? "bg-orange-100 text-orange-800 border-2 border-orange-300"
                      : isUpcoming
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-gray-50 text-gray-700"
                  )}
                >
                  {isCurrent && <Clock className="h-4 w-4" />}
                  {formatGameEventTime(timeSlot)}
                  {isCurrent && <span className="text-xs font-bold">NOW</span>}
                  {isUpcoming && !isCurrent && (
                    <span className="text-xs">SOON</span>
                  )}
                </div>

                {/* Event Cells for Each Day */}
                {daysToShow.map((dayIndex) => {
                  const dayEvents = timeEvents.filter(
                    (event) => event.dayOfWeek === dayIndex
                  );
                  const isCurrentDay = currentDayOfWeek === dayIndex;

                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        "min-h-[60px] p-2 border rounded flex flex-col gap-1 transition-colors",
                        isCurrent && isCurrentDay
                          ? "bg-orange-50 border-orange-200"
                          : isUpcoming && isCurrentDay
                          ? "bg-blue-50 border-blue-200"
                          : "bg-white border-gray-200",
                        viewMode === "single" ? "min-w-[200px]" : ""
                      )}
                    >
                      {dayEvents.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onToggle={onEventToggle}
                          size={viewMode === "single" ? "medium" : "small"}
                          className="w-full"
                        />
                      ))}
                      {dayEvents.length === 0 && (
                        <div className="flex items-center justify-center h-full text-xs text-gray-400">
                          No events
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const TimeSlotGrid = memo(TimeSlotGridComponent);

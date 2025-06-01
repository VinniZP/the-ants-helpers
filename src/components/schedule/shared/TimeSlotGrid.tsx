import { memo } from "react";
import { EventCard } from "./EventCard";
import { formatGameEventTime } from "../../../lib/timezone";
import { getLocaleSettings, getLocalizedDayNames } from "../../../lib/locale";
import { cn } from "../../../lib/utils";
import type { TimeSlotGridProps } from "./types";

/**
 * Grid-based time slot component for desktop layouts
 * Displays events in a table-like structure
 */
function TimeSlotGridComponent({
  viewMode,
  visibleDays,
  events,
  onEventToggle,
  onDayToggle,
}: TimeSlotGridProps) {
  const localeSettings = getLocaleSettings();
  const localizedDayNames = getLocalizedDayNames(localeSettings);

  // Determine which days to show
  const daysToShow =
    viewMode === "single"
      ? [] // Single day is handled differently
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

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
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
                viewMode === "select" && onDayToggle
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

            return (
              <div
                key={timeSlot}
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `120px repeat(${daysToShow.length}, 1fr)`,
                }}
              >
                {/* Time Label */}
                <div className="text-sm font-medium text-gray-700 px-2 py-3 bg-gray-50 rounded flex items-center">
                  {formatGameEventTime(timeSlot)}
                </div>

                {/* Event Cells for Each Day */}
                {daysToShow.map((dayIndex) => {
                  const dayEvents = timeEvents.filter(
                    (event) => event.dayOfWeek === dayIndex
                  );

                  return (
                    <div
                      key={dayIndex}
                      className="min-h-[60px] p-2 bg-white border border-gray-200 rounded flex flex-col gap-1"
                    >
                      {dayEvents.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onToggle={onEventToggle}
                          size="small"
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

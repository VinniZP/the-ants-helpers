import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { EventCard } from "./EventCard";
import { formatGameEventTime } from "../../../lib/timezone";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { cn } from "../../../lib/utils";
import { Clock } from "lucide-react";
import type { TimeSlotListProps } from "./types";

/**
 * List-based time slot component for single day views
 * Displays events in a vertical list format with current time highlighting
 */
function TimeSlotListComponent({
  selectedDay,
  events,
  onEventToggle,
}: TimeSlotListProps) {
  const { isCurrentTimeSlot, isUpcomingTimeSlot, getCurrentDayOfWeek } =
    useCurrentTime();

  // Filter events for the selected day and group by time
  const dayEvents = Object.entries(events)
    .filter(([_, events]) =>
      events.some((event) => event.dayOfWeek === selectedDay)
    )
    .map(([time, events]) => ({
      time,
      events: events.filter((event) => event.dayOfWeek === selectedDay),
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  if (dayEvents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No events for this day</p>
      </div>
    );
  }

  const currentDayOfWeek = getCurrentDayOfWeek();
  const isToday = selectedDay === currentDayOfWeek;

  return (
    <div className="space-y-4">
      {dayEvents.map(({ time, events }) => {
        const isCurrent = isCurrentTimeSlot(time);
        const isUpcoming = isUpcomingTimeSlot(time);

        return (
          <Card
            key={time}
            className={cn(
              "shadow-sm transition-all duration-300",
              isCurrent &&
                isToday &&
                "ring-2 ring-orange-400 ring-opacity-50 shadow-lg",
              isUpcoming &&
                isToday &&
                !isCurrent &&
                "ring-1 ring-blue-300 ring-opacity-50"
            )}
          >
            <CardHeader
              className={cn(
                "pb-3",
                isCurrent &&
                  isToday &&
                  "bg-orange-50 border-b border-orange-200",
                isUpcoming &&
                  isToday &&
                  !isCurrent &&
                  "bg-blue-50 border-b border-blue-200"
              )}
            >
              <CardTitle
                className={cn(
                  "text-base font-medium flex items-center gap-2",
                  isCurrent && isToday
                    ? "text-orange-800"
                    : isUpcoming && isToday
                    ? "text-blue-700"
                    : "text-gray-700"
                )}
              >
                {isCurrent && isToday && <Clock className="h-4 w-4" />}
                {formatGameEventTime(time)}
                {isCurrent && isToday && (
                  <span className="text-xs font-bold bg-orange-200 text-orange-800 px-2 py-1 rounded">
                    NOW
                  </span>
                )}
                {isUpcoming && isToday && !isCurrent && (
                  <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded">
                    UPCOMING
                  </span>
                )}
                <span className="text-sm text-gray-500 ml-auto">
                  ({events.length} event{events.length !== 1 ? "s" : ""})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent
              className={cn(
                "pt-0",
                isCurrent && isToday && "bg-orange-25",
                isUpcoming && isToday && !isCurrent && "bg-blue-25"
              )}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onToggle={onEventToggle}
                    size="medium"
                    className="w-full"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export const TimeSlotList = memo(TimeSlotListComponent);

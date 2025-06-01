import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { EventCard } from "./EventCard";
import { formatGameEventTime } from "../../../lib/timezone";
import type { TimeSlotListProps } from "./types";

/**
 * List-based time slot component for single day views
 * Displays events in a vertical list format
 */
function TimeSlotListComponent({
  selectedDay,
  events,
  onEventToggle,
}: TimeSlotListProps) {
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

  return (
    <div className="space-y-4">
      {dayEvents.map(({ time, events }) => (
        <Card key={time} className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-gray-700 font-medium">
              {formatGameEventTime(time)}
              <span className="text-sm text-gray-500 ml-2">
                ({events.length} event{events.length !== 1 ? "s" : ""})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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
      ))}
    </div>
  );
}

export const TimeSlotList = memo(TimeSlotListComponent);

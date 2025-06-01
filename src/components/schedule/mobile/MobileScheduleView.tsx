import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { DayNavigator } from "./DayNavigator";
import { EventCard } from "../shared/EventCard";
import { formatGameEventTime } from "../../../lib/timezone";
import { getLocaleSettings, getLocalizedDayNames } from "../../../lib/locale";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { cn } from "../../../lib/utils";
import { Clock } from "lucide-react";
import type { MobileScheduleViewProps } from "../shared/types";

/**
 * Mobile schedule view component
 * Displays single day with vertical time slot list and current time highlighting
 */
function MobileScheduleViewComponent({
  scheduleState,
  eventData,
}: MobileScheduleViewProps) {
  const { state, actions } = scheduleState;
  const { data } = eventData;
  const { isCurrentTimeSlot, isUpcomingTimeSlot, getCurrentDayOfWeek } =
    useCurrentTime();

  const localeSettings = getLocaleSettings();
  const localizedDayNames = getLocalizedDayNames(localeSettings);

  // Filter events for the selected day
  const dayEvents = Object.entries(data.filteredEvents)
    .filter(([_, events]) =>
      events.some((event) => event.dayOfWeek === state.selectedDay)
    )
    .map(([time, events]) => ({
      time,
      events: events.filter((event) => event.dayOfWeek === state.selectedDay),
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  const currentDayOfWeek = getCurrentDayOfWeek();
  const isToday = state.selectedDay === currentDayOfWeek;

  return (
    <div className="flex flex-col h-full">
      {/* Day Navigation Header */}
      <DayNavigator
        selectedDay={state.selectedDay}
        onDayChange={actions.setSelectedDay}
        localizedDayNames={localizedDayNames}
        showArrows={true}
        showDayButtons={false}
      />

      {/* Loading State */}
      {data.loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading events...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!data.loading && dayEvents.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg mb-2">No events today</p>
            <p className="text-gray-400 text-sm">
              Try switching to a different day
            </p>
          </div>
        </div>
      )}

      {/* Events List */}
      {!data.loading && dayEvents.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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
                      "text-sm font-medium flex items-center gap-2",
                      isCurrent && isToday
                        ? "text-orange-800"
                        : isUpcoming && isToday
                        ? "text-blue-700"
                        : "text-gray-600"
                    )}
                  >
                    {isCurrent && isToday && <Clock className="h-4 w-4" />}
                    {formatGameEventTime(time)}
                    {isCurrent && isToday && (
                      <span className="text-xs font-bold bg-orange-200 text-orange-800 px-2 py-1 rounded ml-auto">
                        NOW
                      </span>
                    )}
                    {isUpcoming && isToday && !isCurrent && (
                      <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded ml-auto">
                        SOON
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent
                  className={cn(
                    "pt-0",
                    isCurrent && isToday && "bg-orange-25",
                    isUpcoming && isToday && !isCurrent && "bg-blue-25"
                  )}
                >
                  <div className="grid grid-cols-1 gap-3">
                    {events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onToggle={eventData.actions.toggleEvent}
                        size="large"
                        className="w-full"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}

export const MobileScheduleView = memo(MobileScheduleViewComponent);

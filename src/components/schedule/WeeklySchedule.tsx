import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ChevronDown, Clock, Globe } from "lucide-react";
import { getAllGameEvents, toggleGameEvent } from "../../data/database";
import { NotificationService } from "../../services/notificationService";
import { formatGameEventTime, getCurrentTimezone } from "../../lib/timezone";
import type { GameEventReminder } from "../../data/types";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const colorMap: { [key: string]: string } = {
  yellow: "bg-yellow-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  "blue+green": "bg-gradient-to-r from-blue-500 to-green-500",
  "yellow+blue": "bg-gradient-to-r from-yellow-500 to-blue-500",
  "yellow+green": "bg-gradient-to-r from-yellow-500 to-green-500",
  none: "bg-gray-400",
};

export function WeeklySchedule() {
  const [gameEvents, setGameEvents] = useState<GameEventReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentTimezone] = useState(() => getCurrentTimezone());

  useEffect(() => {
    loadGameEvents();
  }, []);

  const loadGameEvents = async () => {
    try {
      const events = await getAllGameEvents();
      setGameEvents(events);
    } catch (error) {
      console.error("Error loading game events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventToggle = async (
    eventId: string,
    isEnabled: boolean,
    isWeeklyRecurring?: boolean
  ) => {
    try {
      // Update database first
      await toggleGameEvent(eventId, isEnabled, isWeeklyRecurring);

      // Get the updated event for notification scheduling
      const updatedEvents = await getAllGameEvents();
      const updatedEvent = updatedEvents.find((e) => e.id === eventId);

      if (updatedEvent) {
        const notificationService = NotificationService.getInstance();

        if (isEnabled && updatedEvent.isEnabled) {
          // Schedule notification for the enabled game event
          await notificationService.scheduleGameEvent(updatedEvent);
        } else {
          // Cancel any existing notifications for this game event
          await notificationService.cancelNotification(eventId, "game");
        }
      }

      // Refresh the list
      await loadGameEvents();
    } catch (error) {
      console.error("Error toggling event:", error);
    }
  };

  // Group events by time and convert to local timezone for display
  const eventsByTime = gameEvents.reduce((acc, event) => {
    if (!acc[event.utc_time]) {
      acc[event.utc_time] = [];
    }
    acc[event.utc_time].push(event);
    return acc;
  }, {} as { [time: string]: GameEventReminder[] });

  // Sort times
  const sortedTimes = Object.keys(eventsByTime).sort();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">Loading schedule...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              The Ants Events Schedule
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Tap events to enable notifications
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Globe className="h-3 w-3" />
                <span>{currentTimezone.replace("_", " ")}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1">
              {sortedTimes.map((utcTime) => {
                const timeEvents = eventsByTime[utcTime];
                const isExpanded = selectedTime === utcTime;
                const localTime = formatGameEventTime(utcTime);

                return (
                  <div key={utcTime} className="border rounded-lg">
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-3 h-auto min-h-[44px] touch-manipulation"
                      onClick={() =>
                        setSelectedTime(isExpanded ? null : utcTime)
                      }
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs sm:text-sm"
                        >
                          {localTime}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          UTC {utcTime}
                        </Badge>
                        <span className="text-xs sm:text-sm text-gray-600">
                          {timeEvents.filter((e) => e.isEnabled).length} enabled
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </Button>

                    {isExpanded && (
                      <div className="border-t p-2 sm:p-4 space-y-3">
                        {/* Day headers - responsive grid */}
                        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-xs sm:text-sm text-center font-medium text-gray-600 mb-2">
                          {dayNames.map((day) => (
                            <div key={day} className="truncate">
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Event cards grid - responsive */}
                        <div className="grid grid-cols-7 gap-1 sm:gap-2">
                          {dayNames.map((_, dayIndex) => {
                            const event = timeEvents.find(
                              (e) => e.dayOfWeek === dayIndex
                            );

                            return (
                              <div key={dayIndex} className="space-y-1">
                                {event ? (
                                  <div className="space-y-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div
                                          className={`h-10 sm:h-12 rounded text-white text-xs sm:text-sm p-1 sm:p-2 flex items-center justify-center cursor-pointer transition-all duration-200 min-h-[40px] touch-manipulation active:scale-95 relative ${
                                            colorMap[event.color] ||
                                            "bg-gray-400"
                                          } ${
                                            event.isEnabled
                                              ? "opacity-100 shadow-sm"
                                              : "opacity-50"
                                          } ${
                                            event.raspberry
                                              ? "ring-2 ring-purple-400 ring-opacity-60"
                                              : ""
                                          }`}
                                          onClick={() =>
                                            handleEventToggle(
                                              event.id,
                                              !event.isEnabled
                                            )
                                          }
                                        >
                                          <span className="text-center leading-tight overflow-hidden">
                                            {event.title.split(" ")[0]}
                                          </span>
                                          {event.raspberry && (
                                            <span className="absolute -top-1 -right-1 text-xs">
                                              🍇
                                            </span>
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="top"
                                        className="max-w-xs"
                                      >
                                        <div className="space-y-1">
                                          <div className="font-medium">
                                            {event.title}
                                            {event.raspberry && " 🍇"}
                                          </div>
                                          <div className="text-xs text-gray-200">
                                            {event.description}
                                          </div>
                                          <div className="text-xs text-gray-300">
                                            Local: {localTime} | UTC: {utcTime}
                                          </div>
                                          {event.raspberry && (
                                            <div className="text-xs text-purple-300">
                                              ⭐ Special event with extra
                                              rewards
                                            </div>
                                          )}
                                          <div className="text-xs text-gray-300">
                                            Click to{" "}
                                            {event.isEnabled
                                              ? "disable"
                                              : "enable"}
                                          </div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>

                                    {event.isEnabled && (
                                      <div className="flex justify-center">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 sm:h-8 sm:w-8 p-0 min-h-[32px] min-w-[32px] touch-manipulation"
                                            >
                                              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent
                                            align="center"
                                            className="w-36"
                                          >
                                            <DropdownMenuItem
                                              onClick={() =>
                                                handleEventToggle(
                                                  event.id,
                                                  true,
                                                  false
                                                )
                                              }
                                              className={`text-sm ${
                                                event.isWeeklyRecurring
                                                  ? ""
                                                  : "bg-blue-50"
                                              }`}
                                            >
                                              Once only
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() =>
                                                handleEventToggle(
                                                  event.id,
                                                  true,
                                                  true
                                                )
                                              }
                                              className={`text-sm ${
                                                event.isWeeklyRecurring
                                                  ? "bg-blue-50"
                                                  : ""
                                              }`}
                                            >
                                              Every week
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() =>
                                                handleEventToggle(
                                                  event.id,
                                                  false
                                                )
                                              }
                                              className="text-red-600 text-sm"
                                            >
                                              Turn off
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="h-10 sm:h-12 rounded bg-gray-100 flex items-center justify-center min-h-[40px]">
                                    <span className="text-xs text-gray-400">
                                      —
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Event details - enhanced mobile layout */}
                        {timeEvents.filter((e) => e.isEnabled).length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                              Active Events ({localTime} local):
                            </h4>
                            <div className="space-y-2">
                              {timeEvents
                                .filter((e) => e.isEnabled)
                                .map((event) => (
                                  <div
                                    key={event.id}
                                    className="flex items-start gap-2 p-2 rounded bg-gray-50"
                                  >
                                    <div
                                      className={`w-3 h-3 rounded flex-shrink-0 mt-0.5 ${
                                        colorMap[event.color] || "bg-gray-400"
                                      }`}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-xs sm:text-sm">
                                          {dayNames[event.dayOfWeek]}:
                                        </span>
                                        {event.isWeeklyRecurring && (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            Weekly
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                                        <div className="font-medium">
                                          {event.title}
                                        </div>
                                        <div className="text-gray-600 mt-1">
                                          {event.description}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

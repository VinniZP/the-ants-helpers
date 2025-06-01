import { useState, useEffect, useMemo } from "react";
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
import {
  getLocaleSettings,
  getLocalizedDayNames,
  getTranslation,
  convertDayIndexToLocale,
  convertDayIndexFromLocale,
  type LocaleSettings,
} from "../../lib/locale";
import type { GameEventReminder } from "../../data/types";

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

  // Locale settings
  const localeSettings = useMemo<LocaleSettings>(() => getLocaleSettings(), []);
  const localizedDayNames = useMemo(
    () => getLocalizedDayNames(localeSettings),
    [localeSettings]
  );

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
          <div className="text-center text-gray-500">
            {getTranslation("loadingSchedule", localeSettings.locale)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-2 lg:space-y-4">
        <Card>
          <CardHeader className="pb-2 lg:pb-4">
            <CardTitle className="text-lg lg:text-xl flex items-center gap-2">
              <Clock className="h-5 w-5 lg:h-6 lg:w-6" />
              {getTranslation("antsEventsSchedule", localeSettings.locale)}
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-sm lg:text-base text-gray-600">
                {getTranslation("tapEvents", localeSettings.locale)}
              </p>
              <div className="flex items-center gap-1 text-xs lg:text-sm text-gray-500">
                <Globe className="h-3 w-3 lg:h-4 lg:w-4" />
                <span>{currentTimezone.replace("_", " ")}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 lg:p-6">
            <div className="space-y-1 lg:space-y-3">
              {sortedTimes.map((utcTime) => {
                const timeEvents = eventsByTime[utcTime];
                const isExpanded = selectedTime === utcTime;
                const localTime = formatGameEventTime(utcTime);

                return (
                  <div
                    key={utcTime}
                    className="border rounded-lg lg:rounded-xl"
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-3 lg:p-4 h-auto min-h-[44px] lg:min-h-[52px] touch-manipulation lg:hover:bg-accent/50 transition-colors"
                      onClick={() =>
                        setSelectedTime(isExpanded ? null : utcTime)
                      }
                    >
                      <div className="flex items-center gap-2 lg:gap-3">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs sm:text-sm lg:text-base"
                        >
                          {localTime}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs lg:text-sm"
                        >
                          UTC {utcTime}
                        </Badge>
                        <span className="text-xs sm:text-sm lg:text-base text-gray-600">
                          {timeEvents.filter((e) => e.isEnabled).length}{" "}
                          {getTranslation("enabled", localeSettings.locale)}
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 lg:h-5 lg:w-5 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        } lg:hidden`}
                      />
                    </Button>

                    {/* Desktop: Always show content, Mobile: Show on expand */}
                    <div
                      className={`border-t p-2 sm:p-4 lg:p-6 space-y-3 lg:space-y-4 ${
                        isExpanded ? "block" : "hidden lg:block"
                      }`}
                    >
                      {/* Day headers - responsive grid with locale support */}
                      <div className="grid grid-cols-7 gap-1 sm:gap-2 lg:gap-3 text-xs sm:text-sm lg:text-base text-center font-medium text-gray-600 mb-2 lg:mb-4">
                        {localizedDayNames.map((day) => (
                          <div key={day} className="truncate">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Event cards grid - responsive with locale support */}
                      <div className="grid grid-cols-7 gap-1 sm:gap-2 lg:gap-3">
                        {localizedDayNames.map((_, localeDayIndex) => {
                          // Convert locale day index back to standard day index for event lookup
                          const standardDayIndex = convertDayIndexFromLocale(
                            localeDayIndex,
                            localeSettings.firstDayOfWeek
                          );
                          const event = timeEvents.find(
                            (e) => e.dayOfWeek === standardDayIndex
                          );

                          return (
                            <div
                              key={`${localeDayIndex}-${standardDayIndex}`}
                              className="space-y-1"
                            >
                              {event ? (
                                <div className="space-y-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={`h-10 sm:h-12 lg:h-16 rounded lg:rounded-lg text-white text-xs sm:text-sm lg:text-base p-1 sm:p-2 lg:p-3 flex items-center justify-center cursor-pointer transition-all duration-200 min-h-[40px] touch-manipulation active:scale-95 lg:hover:scale-105 lg:hover:shadow-lg relative ${
                                          colorMap[event.color] || "bg-gray-400"
                                        } ${
                                          event.isEnabled
                                            ? "opacity-100 shadow-sm lg:shadow-md"
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
                                          <span className="absolute -top-1 -right-1 text-xs lg:text-sm">
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
                                            ⭐ Special event with extra rewards
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
                                            {getTranslation(
                                              "onceOnly",
                                              localeSettings.locale
                                            )}
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
                                            {getTranslation(
                                              "everyWeek",
                                              localeSettings.locale
                                            )}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleEventToggle(event.id, false)
                                            }
                                            className="text-red-600 text-sm"
                                          >
                                            {getTranslation(
                                              "turnOff",
                                              localeSettings.locale
                                            )}
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="h-10 sm:h-12 lg:h-16 rounded lg:rounded-lg bg-gray-100 flex items-center justify-center min-h-[40px]">
                                  <span className="text-xs text-gray-400">
                                    —
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Event details - enhanced mobile layout with locale support */}
                      {timeEvents.filter((e) => e.isEnabled).length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            {getTranslation(
                              "activeEvents",
                              localeSettings.locale
                            )}{" "}
                            ({localTime} local):
                          </h4>
                          <div className="space-y-2">
                            {timeEvents
                              .filter((e) => e.isEnabled)
                              .map((event) => {
                                const localeDayIndex = convertDayIndexToLocale(
                                  event.dayOfWeek,
                                  localeSettings.firstDayOfWeek
                                );
                                return (
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
                                          {localizedDayNames[localeDayIndex]}:
                                        </span>
                                        {event.isWeeklyRecurring && (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {getTranslation(
                                              "everyWeek",
                                              localeSettings.locale
                                            )}
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
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
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

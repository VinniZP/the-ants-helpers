import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Calendar, Gamepad2, User, ChevronRight } from "lucide-react";
import { LoadingSpinner } from "../components/ui/loading-spinner";
import { ReminderCard } from "../components/reminders/ReminderCard";
import {
  getAllReminders,
  getEnabledGameEvents,
  updateReminder,
  deleteReminder,
} from "../data/database";
import { NotificationService } from "../services/notificationService";
import { formatGameEventTime, getCurrentTimezone } from "../lib/timezone";
import type { CustomReminder, SwipeAction } from "../data/types";
import { getAssetPath } from "../lib/utils";

export const Route = createFileRoute("/")({
  component: TodayPage,
});

interface TodayEvent {
  id: string;
  type: "custom" | "game";
  time: string;
  localTime: string;
  title: string;
  description: string;
  isEnabled: boolean;
  color?: string;
  category?: string;
  isWeeklyRecurring?: boolean;
  raspberry?: boolean;
}

function TodayPage() {
  const [todayEvents, setTodayEvents] = useState<TodayEvent[]>([]);
  const [customReminders, setCustomReminders] = useState<CustomReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTimezone] = useState(() => getCurrentTimezone());

  useEffect(() => {
    loadTodayData();
  }, []);

  // Only refresh when window becomes focused after being away for a while
  useEffect(() => {
    let lastFocusTime = Date.now();

    const handleFocus = () => {
      const now = Date.now();
      // Only reload if it's been more than 5 minutes since last focus
      if (now - lastFocusTime > 5 * 60 * 1000) {
        loadTodayData();
      }
      lastFocusTime = now;
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const loadTodayData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
      const today = new Date();
      const todayDayOfWeek = today.getDay();
      const todayDateString = today.toISOString().split("T")[0];

      // Load enabled game events for today
      const allGameEvents = await getEnabledGameEvents();
      const todayGameEvents = allGameEvents.filter(
        (event) => event.dayOfWeek === todayDayOfWeek
      );

      // Load custom reminders for today
      const allCustomReminders = await getAllReminders();
      const todayCustomReminders = allCustomReminders.filter(
        (reminder) =>
          reminder.isActive &&
          (reminder.recurrence === "daily" ||
            reminder.recurrence === "hourly" ||
            reminder.date === todayDateString)
      );

      // Combine and format all today's events
      const combinedEvents: TodayEvent[] = [
        // Game events with proper timezone conversion
        ...todayGameEvents.map(
          (event): TodayEvent => ({
            id: event.id,
            type: "game",
            time: event.utc_time,
            localTime: formatGameEventTime(event.utc_time),
            title: event.title,
            description: event.description,
            isEnabled: event.isEnabled,
            color: event.color,
            isWeeklyRecurring: event.isWeeklyRecurring,
            raspberry: event.raspberry,
          })
        ),

        // Custom reminders (already in local time)
        ...todayCustomReminders.map(
          (reminder): TodayEvent => ({
            id: reminder.id,
            type: "custom",
            time: reminder.time,
            localTime: reminder.time,
            title: reminder.title,
            description: reminder.description || "",
            isEnabled: reminder.isActive && reminder.notificationEnabled,
            category: reminder.category,
          })
        ),
      ];

      // Sort by local time
      combinedEvents.sort((a, b) => a.localTime.localeCompare(b.localTime));

      setTodayEvents(combinedEvents);
      setCustomReminders(todayCustomReminders);
    } catch (error) {
      console.error("Error loading today's data:", error);
      setError("Failed to load today's events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwipeAction = async (action: SwipeAction) => {
    try {
      const notificationService = NotificationService.getInstance();

      if (action.reminderType === "custom") {
        switch (action.type) {
          case "complete":
            await updateReminder(action.reminderId, {
              completedAt: new Date(),
            });
            break;

          case "delete":
            await notificationService.cancelNotification(
              action.reminderId,
              "custom"
            );
            await deleteReminder(action.reminderId);
            break;

          case "toggle":
            const reminder = customReminders.find(
              (r) => r.id === action.reminderId
            );
            if (reminder) {
              const newActiveState = !reminder.isActive;
              await updateReminder(action.reminderId, {
                isActive: newActiveState,
              });

              if (newActiveState && reminder.notificationEnabled) {
                const updatedReminder = {
                  ...reminder,
                  isActive: newActiveState,
                };
                await notificationService.scheduleCustomReminder(
                  updatedReminder
                );
              } else {
                await notificationService.cancelNotification(
                  action.reminderId,
                  "custom"
                );
              }
            }
            break;
        }
      }

      await loadTodayData();
    } catch (error) {
      console.error("Error handling swipe action:", error);
      setError("Failed to update reminder. Please try again.");
    }
  };

  const handleCardClick = (reminder: CustomReminder) => {
    console.log("Clicked reminder:", reminder);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getEventIcon = (event: TodayEvent) => {
    return event.type === "game" ? (
      <Gamepad2 className="h-4 w-4 text-blue-600" />
    ) : (
      <User className="h-4 w-4 text-green-600" />
    );
  };

  const getEventColor = (event: TodayEvent) => {
    if (event.type === "game") {
      switch (event.color) {
        case "yellow":
          return "border-l-yellow-400 bg-yellow-50";
        case "blue":
          return "border-l-blue-400 bg-blue-50";
        case "green":
          return "border-l-green-400 bg-green-50";
        default:
          return "border-l-gray-400 bg-gray-50";
      }
    } else {
      switch (event.category) {
        case "work":
          return "border-l-blue-400 bg-blue-50";
        case "personal":
          return "border-l-green-400 bg-green-50";
        case "health":
          return "border-l-red-400 bg-red-50";
        default:
          return "border-l-gray-400 bg-gray-50";
      }
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        size="lg"
        text="Loading today's events..."
        className="min-h-[50vh]"
      />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="font-medium mb-2">Something went wrong</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadTodayData}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <h1 className="text-lg font-bold">Today</h1>
        </div>
        <div className="text-right">
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </Badge>
          <div className="text-xs text-gray-500 mt-0.5">
            {currentTimezone.split("/")[1]?.replace("_", " ") ||
              currentTimezone}
          </div>
        </div>
      </div>

      {/* Compact Events List */}
      {todayEvents.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-gray-500 mb-1 text-sm">No events today</div>
            <p className="text-xs text-gray-400">
              Enable game events or create custom reminders
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {todayEvents.map((event) => (
            <Card
              key={`${event.type}-${event.id}`}
              className={`border-l-4 ${getEventColor(event)} ${
                !event.isEnabled ? "opacity-60" : ""
              } ${
                event.raspberry ? "ring-1 ring-purple-300 ring-opacity-50" : ""
              }`}
            >
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
                  {/* Time */}
                  <div className="flex flex-col items-center min-w-[50px]">
                    <div className="text-xs font-medium text-gray-900">
                      {formatTime(event.localTime)}
                    </div>
                    {event.type === "game" && (
                      <div className="text-xs text-gray-500 leading-tight">
                        {event.time}
                      </div>
                    )}
                  </div>

                  {/* Event Icon */}
                  <div className="flex-shrink-0">{getEventIcon(event)}</div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                        {event.raspberry && (
                          <img
                            src={getAssetPath("/raspberry.png")}
                            alt="Raspberry"
                            className="w-4 h-4"
                          />
                        )}
                      </h3>
                      {event.type === "game" && event.isWeeklyRecurring && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-1 py-0"
                        >
                          W
                        </Badge>
                      )}
                      {event.category && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {event.category.charAt(0).toUpperCase()}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 truncate leading-tight">
                      {event.description}
                    </p>
                  </div>

                  {/* Status & Action */}
                  <div className="flex items-center">
                    {!event.isEnabled ? (
                      <span className="text-xs text-gray-400">Off</span>
                    ) : (
                      <ChevronRight className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Compact Custom Reminders Section */}
      {customReminders.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-3 w-3 text-green-600" />
            <h2 className="text-sm font-semibold text-gray-700">Custom</h2>
            <Badge variant="outline" className="text-xs px-1 py-0">
              {customReminders.length}
            </Badge>
          </div>

          {customReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onSwipeAction={handleSwipeAction}
              onCardClick={handleCardClick}
              isToday={true}
            />
          ))}
        </div>
      )}

      {/* Mini Stats */}
      <div className="flex items-center justify-center gap-6 pt-1 border-t text-xs">
        <div className="text-center">
          <div className="text-gray-500">Game</div>
          <div className="font-medium">
            {todayEvents.filter((e) => e.type === "game" && e.isEnabled).length}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">Custom</div>
          <div className="font-medium">
            {
              todayEvents.filter((e) => e.type === "custom" && e.isEnabled)
                .length
            }
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">Total</div>
          <div className="font-medium">
            {todayEvents.filter((e) => e.isEnabled).length}
          </div>
        </div>
      </div>
    </div>
  );
}

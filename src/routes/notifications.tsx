import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { LoadingSpinner } from "../components/ui/loading-spinner";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { db } from "../data/database";
import { NotificationService } from "../services/notificationService";
import type { CustomReminder } from "../data/types";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const [scheduledReminders, setScheduledReminders] = useState<
    CustomReminder[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    loadScheduledNotifications();
  }, []);

  const loadScheduledNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all active reminders with notifications enabled
      const reminders = await db.customReminders
        .filter(
          (reminder: CustomReminder) =>
            reminder.isActive && reminder.notificationEnabled
        )
        .toArray();

      // Sort by time for better organization
      const sortedReminders = reminders.sort(
        (a: CustomReminder, b: CustomReminder) => {
          // Sort daily reminders first, then by time
          if (a.recurrence === "daily" && b.recurrence !== "daily") return -1;
          if (a.recurrence !== "daily" && b.recurrence === "daily") return 1;
          return a.time.localeCompare(b.time);
        }
      );

      setScheduledReminders(sortedReminders);
    } catch (error) {
      console.error("Error loading scheduled notifications:", error);
      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "work":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "personal":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "health":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getScheduleText = (reminder: CustomReminder) => {
    switch (reminder.recurrence) {
      case "hourly":
        return "Every Hour";
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "once":
        if (reminder.date) {
          const date = new Date(reminder.date);
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        }
        return "One-time";
      default:
        return "One-time";
    }
  };

  const handleDisableNotification = async (reminderId: string) => {
    try {
      // Update reminder to disable notifications
      await db.customReminders.update(reminderId, {
        notificationEnabled: false,
        updatedAt: new Date(),
      });

      // Cancel the scheduled notification
      await notificationService.cancelNotification(reminderId, "custom");

      // Reload the list
      await loadScheduledNotifications();

      console.log("Notification disabled for reminder:", reminderId);
    } catch (error) {
      console.error("Error disabling notification:", error);
      setError("Failed to disable notification. Please try again.");
    }
  };

  const handleRescheduleAll = async () => {
    try {
      setLoading(true);
      await notificationService.rescheduleAllActiveReminders();
      await loadScheduledNotifications();
      console.log("All notifications rescheduled successfully");
    } catch (error) {
      console.error("Error rescheduling notifications:", error);
      setError("Failed to reschedule notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    loadScheduledNotifications();
  };

  if (loading) {
    return (
      <LoadingSpinner
        size="lg"
        text="Loading scheduled notifications..."
        className="min-h-[50vh]"
      />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
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
        <Button onClick={handleRetry}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Scheduled Notifications</h2>
        <Button size="sm" variant="outline" onClick={handleRescheduleAll}>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reschedule All
        </Button>
      </div>

      {scheduledReminders.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-5 5v-5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 21H5a2 2 0 01-2-2V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="font-medium mb-1">No scheduled notifications</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enable notifications on your reminders to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scheduledReminders.map((reminder) => (
            <Card key={reminder.id} className="border">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium">
                      {reminder.title}
                    </CardTitle>
                    {reminder.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {reminder.description}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDisableNotification(reminder.id)}
                    className="ml-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                      />
                    </svg>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="font-mono text-xs">
                      {formatTime(reminder.time)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {getScheduleText(reminder)}
                    </Badge>
                    {reminder.category && (
                      <Badge
                        className={`text-xs ${getCategoryColor(
                          reminder.category
                        )}`}
                      >
                        {reminder.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

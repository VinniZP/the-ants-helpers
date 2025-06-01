import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CustomReminder, SwipeAction } from "@/data/types";

interface ReminderCardProps {
  reminder: CustomReminder;
  onSwipeAction: (action: SwipeAction) => void;
  onCardClick: (reminder: CustomReminder) => void;
  isToday?: boolean;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onSwipeAction,
  onCardClick,
  isToday = false,
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeleting, setIsSwiping] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipeleting) return;

    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;

    // Limit swipe to reasonable bounds
    const maxSwipe = 120;
    const clampedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
    setSwipeOffset(clampedDelta);
  };

  const handleTouchEnd = () => {
    if (!isSwipeleting) return;
    setIsSwiping(false);

    const deltaX = currentX.current - startX.current;
    const threshold = 60;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        // Swipe right - complete
        onSwipeAction({
          type: "complete",
          reminderId: reminder.id,
          reminderType: "custom",
        });
      } else {
        // Swipe left - delete
        onSwipeAction({
          type: "delete",
          reminderId: reminder.id,
          reminderType: "custom",
        });
      }
    }

    // Reset position
    setSwipeOffset(0);
  };

  const handleLongPress = () => {
    setShowActions(!showActions);
  };

  const getCategoryColor = (category?: string) => {
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

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isOverdue = () => {
    if (!isToday || reminder.recurrence === "once") return false;
    const now = new Date();
    const [hours, minutes] = reminder.time.split(":").map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);
    return now > reminderTime && !reminder.completedAt;
  };

  const isCompleted = () => {
    if (!isToday) return !!reminder.completedAt;

    // For recurring reminders, check if completed today
    if (reminder.recurrence !== "once" && reminder.completedAt) {
      const today = new Date().toDateString();
      const completedDate = new Date(reminder.completedAt).toDateString();
      return today === completedDate;
    }

    return !!reminder.completedAt;
  };

  const getRecurrenceLabel = () => {
    switch (reminder.recurrence) {
      case "hourly":
        return "Hourly";
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "once":
      default:
        return null;
    }
  };

  const overdue = isOverdue();
  const completed = isCompleted();
  const recurrenceLabel = getRecurrenceLabel();

  return (
    <div className="relative">
      {/* Swipe Action Background */}
      <div className="absolute inset-0 flex items-center justify-between px-4 rounded-lg">
        <div className="flex items-center justify-center w-16 h-full bg-green-500 rounded-l-lg">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div className="flex items-center justify-center w-16 h-full bg-red-500 rounded-r-lg">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>
      </div>

      {/* Main Card */}
      <Card
        ref={cardRef}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        className={`transition-transform duration-200 cursor-pointer py-2 ${
          completed ? "opacity-60" : ""
        } ${overdue ? "border-red-200 dark:border-red-800" : ""}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => onCardClick(reminder)}
        onContextMenu={(e) => {
          e.preventDefault();
          handleLongPress();
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3
                  className={`font-medium text-sm ${
                    completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {reminder.title}
                </h3>
                {completed && (
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {reminder.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {reminder.description}
                </p>
              )}

              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs font-medium ${
                    overdue
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatTime(reminder.time)}
                </span>

                {reminder.category && (
                  <Badge
                    variant="secondary"
                    className={`text-xs ${getCategoryColor(reminder.category)}`}
                  >
                    {reminder.category}
                  </Badge>
                )}

                {recurrenceLabel && (
                  <Badge variant="outline" className="text-xs">
                    {recurrenceLabel}
                  </Badge>
                )}

                {overdue && (
                  <Badge variant="destructive" className="text-xs">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end space-y-1">
              {reminder.notificationEnabled && (
                <svg
                  className="w-4 h-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-5 5v-5zM9 3v1a1 1 0 002 0V3h3a1 1 0 010 2h-1v1a1 1 0 002 0V5h3a1 1 0 010 2H9a1 1 0 010-2z"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Action Buttons (shown on long press) */}
          {showActions && (
            <div className="flex space-x-2 mt-3 pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwipeAction({
                    type: "edit",
                    reminderId: reminder.id,
                    reminderType: "custom",
                  });
                  setShowActions(false);
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwipeAction({
                    type: "complete",
                    reminderId: reminder.id,
                    reminderType: "custom",
                  });
                  setShowActions(false);
                }}
              >
                Complete
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwipeAction({
                    type: "delete",
                    reminderId: reminder.id,
                    reminderType: "custom",
                  });
                  setShowActions(false);
                }}
              >
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

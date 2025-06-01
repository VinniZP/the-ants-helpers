import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus } from "lucide-react";
import { ReminderCard } from "../components/reminders/ReminderCard";
import { AddReminderDialog } from "../components/reminders/AddReminderDialog";
import {
  getAllReminders,
  updateReminder,
  deleteReminder,
} from "../data/database";
import { NotificationService } from "../services/notificationService";
import type { CustomReminder, SwipeAction } from "../data/types";

export const Route = createFileRoute("/custom")({
  component: CustomRemindersPage,
});

function CustomRemindersPage() {
  const [reminders, setReminders] = useState<CustomReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const allReminders = await getAllReminders();
      setReminders(allReminders);
    } catch (error) {
      console.error("Error loading custom reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReminderAdded = () => {
    loadReminders();
  };

  const handleSwipeAction = async (action: SwipeAction) => {
    try {
      const notificationService = NotificationService.getInstance();

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
          const reminder = reminders.find((r) => r.id === action.reminderId);
          if (reminder) {
            const newActiveState = !reminder.isActive;
            await updateReminder(action.reminderId, {
              isActive: newActiveState,
            });

            if (newActiveState && reminder.notificationEnabled) {
              const updatedReminder = { ...reminder, isActive: newActiveState };
              await notificationService.scheduleCustomReminder(updatedReminder);
            } else {
              await notificationService.cancelNotification(
                action.reminderId,
                "custom"
              );
            }
          }
          break;

        case "edit":
          // TODO: Implement edit dialog
          console.log("Edit reminder:", action.reminderId);
          break;
      }

      await loadReminders();
    } catch (error) {
      console.error("Error handling swipe action:", error);
    }
  };

  const handleCardClick = (reminder: CustomReminder) => {
    // TODO: Show reminder details or edit dialog
    console.log("Clicked reminder:", reminder);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">
          Loading custom reminders...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Custom Reminders</h1>
        <Button onClick={() => setShowAddDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      {reminders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500 mb-4">No custom reminders yet</div>
            <Button onClick={() => setShowAddDialog(true)}>
              Create your first reminder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onSwipeAction={handleSwipeAction}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      )}

      <AddReminderDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onReminderAdded={handleReminderAdded}
      />
    </div>
  );
}

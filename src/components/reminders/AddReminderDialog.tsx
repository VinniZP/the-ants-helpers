import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { db } from "@/data/database";
import { NotificationService } from "@/services/notificationService";
import type { CustomReminder } from "@/data/types";
import { v4 as uuidv4 } from "uuid";

interface AddReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReminderAdded: () => void;
}

export const AddReminderDialog: React.FC<AddReminderDialogProps> = ({
  open,
  onOpenChange,
  onReminderAdded,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("09:00");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [recurrence, setRecurrence] = useState<
    "once" | "daily" | "weekly" | "hourly"
  >("once");
  const [category, setCategory] = useState<string>("personal");
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const notificationService = NotificationService.getInstance();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTime("09:00");
    setDate(new Date().toISOString().split("T")[0]);
    setRecurrence("once");
    setCategory("personal");
    setNotificationEnabled(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a title for your reminder.");
      return;
    }

    setIsLoading(true);

    try {
      const newReminder: CustomReminder = {
        id: uuidv4(),
        title: title.trim(),
        description: description.trim() || undefined,
        time,
        date: recurrence === "once" ? date : undefined,
        recurrence,
        isActive: true,
        notificationEnabled,
        category: category as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to database
      await db.customReminders.add(newReminder);

      // Schedule notification if enabled
      if (notificationEnabled) {
        await notificationService.scheduleCustomReminder(newReminder);
      }

      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
      onReminderAdded();

      console.log("Reminder created successfully:", newReminder.title);
    } catch (error) {
      console.error("Error creating reminder:", error);
      alert("Failed to create reminder. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
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

  const formatTimeForDisplay = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Add New Reminder</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter reminder title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add details about your reminder..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flex-1"
                required
              />
              <Badge variant="outline" className="text-xs">
                {formatTimeForDisplay(time)}
              </Badge>
            </div>
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <Label htmlFor="recurrence">Recurrence</Label>
            <Select
              value={recurrence}
              onValueChange={(value: "once" | "daily" | "weekly" | "hourly") =>
                setRecurrence(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Once</SelectItem>
                <SelectItem value="hourly">Every Hour</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date (only show if recurrence is "once") */}
          {recurrence === "once" && (
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
          )}

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={`text-xs ${getCategoryColor("personal")}`}
                    >
                      Personal
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="work">
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs ${getCategoryColor("work")}`}>
                      Work
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="health">
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs ${getCategoryColor("health")}`}>
                      Health
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="other">
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs ${getCategoryColor("other")}`}>
                      Other
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Enable Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Get notified when this reminder is due
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notificationEnabled}
              onCheckedChange={setNotificationEnabled}
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Creating..." : "Create Reminder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

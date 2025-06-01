export interface Reminder {
  id: string;
  title: string;
  description?: string;
  time: string; // Format: "HH:MM"
  date?: string; // Format: "YYYY-MM-DD" or null for daily
  isDaily: boolean;
  isActive: boolean;
  notificationEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  category?: string;
}

export interface PredefinedEvent {
  id: string;
  title: string;
  time: string; // Format: "HH:MM"
  description?: string;
  category: "work" | "personal" | "health" | "other";
  isTemplate: boolean;
}

export interface NotificationSchedule {
  id: string;
  reminderId: string;
  reminderType: "game" | "custom"; // New field to distinguish types
  scheduledTime: Date;
  title: string;
  body: string;
  isProcessed: boolean;
  createdAt: Date;
}

export interface AppSettings {
  id: string;
  notificationsEnabled: boolean;
  notificationPermission: NotificationPermission;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  theme: "light" | "dark" | "system";
  timeZone: string; // User's timezone for UTC conversion
  lastSync: Date;
}

export interface ViewFilter {
  date?: string;
  category?: string;
  isCompleted?: boolean;
  isActive?: boolean;
  reminderType?: "game" | "custom" | "all";
}

export type NavigationTab = "today" | "schedule" | "custom" | "settings";

export interface SwipeAction {
  type: "delete" | "complete" | "edit" | "toggle";
  reminderId: string;
  reminderType: "game" | "custom";
}

// Game event types
export interface GameEvent {
  utc_time: string; // Format: "HH:MM"
  days: {
    [dayName: string]: {
      // Russian day names as keys
      text: string;
      color: string;
      meaning: string;
      raspberry?: boolean; // Optional raspberry flag
    };
  };
}

export interface GameEventReminder {
  id: string;
  utc_time: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  title: string; // from text field
  description: string; // from meaning field
  color: string;
  raspberry?: boolean; // Optional raspberry flag
  isEnabled: boolean;
  isWeeklyRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomReminder {
  id: string;
  title: string;
  description?: string;
  time: string; // Format: "HH:MM"
  date?: string; // Format: "YYYY-MM-DD" or null for recurring
  recurrence: "once" | "daily" | "weekly" | "hourly";
  isActive: boolean;
  notificationEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  category?: string;
}

// Legacy type for backward compatibility during migration
export interface Reminder extends CustomReminder {}

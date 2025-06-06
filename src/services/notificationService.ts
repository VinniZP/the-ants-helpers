import { db } from "../data/database";
import type { CustomReminder, GameEventReminder } from "../data/types";
import { v4 as uuidv4 } from "uuid";

type ReminderType = "custom" | "game";

interface ScheduleRequest {
  id: string;
  type: ReminderType;
  title: string;
  description: string;
  scheduledTime: Date;
  isWeeklyRecurring?: boolean;
}

export class NotificationService {
  private static instance: NotificationService;
  private activeTimeouts: Map<string, ReturnType<typeof setTimeout>> =
    new Map();
  private isServiceWorkerAvailable = false;
  private soundEnabled = true; // Default to enabled
  private vibrationEnabled = true; // Default to enabled

  private constructor() {
    this.checkServiceWorkerSupport();
    this.setupServiceWorkerMessageListener();
    this.loadSoundPreferences();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private checkServiceWorkerSupport(): void {
    this.isServiceWorkerAvailable =
      "serviceWorker" in navigator && "Notification" in window;
  }

  private setupServiceWorkerMessageListener(): void {
    if (!this.isServiceWorkerAvailable) return;

    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "SHOW_NOTIFICATION") {
        this.showNotification(
          event.data.title,
          event.data.body,
          event.data.reminderId
        );
      }
    });
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return "denied";
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();

      // Update app settings with permission status
      await db.appSettings.update("default", {
        notificationPermission: permission,
        lastSync: new Date(),
      });

      return permission;
    }

    return Notification.permission;
  }

  // Enhanced method to handle both reminder types
  public async scheduleCustomReminder(reminder: CustomReminder): Promise<void> {
    if (!reminder.notificationEnabled || !reminder.isActive) {
      return;
    }

    const scheduledTime = this.calculateNextCustomReminderTime(reminder);
    if (!scheduledTime) {
      return;
    }

    await this.scheduleNotificationInternal({
      id: reminder.id,
      type: "custom",
      title: reminder.title,
      description: reminder.description || `Reminder: ${reminder.title}`,
      scheduledTime,
    });
  }

  public async scheduleGameEvent(gameEvent: GameEventReminder): Promise<void> {
    if (!gameEvent.isEnabled) {
      return;
    }

    const scheduledTime = this.calculateNextGameEventTime(gameEvent);
    if (!scheduledTime) {
      return;
    }

    await this.scheduleNotificationInternal({
      id: gameEvent.id,
      type: "game",
      title: gameEvent.title,
      description: gameEvent.description,
      scheduledTime,
      isWeeklyRecurring: gameEvent.isWeeklyRecurring,
    });
  }

  private async scheduleNotificationInternal(
    request: ScheduleRequest
  ): Promise<void> {
    // Store in database for service worker backup
    const scheduleId = uuidv4();
    await db.notificationSchedules.add({
      id: scheduleId,
      reminderId: request.id,
      reminderType: request.type,
      scheduledTime: request.scheduledTime,
      title: request.title,
      body: request.description,
      isProcessed: false,
      createdAt: new Date(),
    });

    // Schedule with setTimeout if time is within reasonable range (24 hours)
    const timeUntilNotification = request.scheduledTime.getTime() - Date.now();

    if (
      timeUntilNotification > 0 &&
      timeUntilNotification <= 24 * 60 * 60 * 1000
    ) {
      const timeoutId = setTimeout(() => {
        this.triggerNotification(
          scheduleId,
          request.title,
          request.description,
          request.id
        );
      }, timeUntilNotification);

      this.activeTimeouts.set(scheduleId, timeoutId);
    }

    // Also notify service worker for backup scheduling
    if (this.isServiceWorkerAvailable && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SCHEDULE_NOTIFICATION",
        data: {
          scheduleId,
          reminderId: request.id,
          reminderType: request.type,
          scheduledTime: request.scheduledTime.toISOString(),
          title: request.title,
          body: request.description,
        },
      });
    }
  }

  public async cancelNotification(
    reminderId: string,
    type?: ReminderType
  ): Promise<void> {
    // Cancel any active timeouts
    for (const [scheduleId, timeoutId] of this.activeTimeouts) {
      const schedule = await db.notificationSchedules.get(scheduleId);
      if (
        schedule &&
        schedule.reminderId === reminderId &&
        (!type || schedule.reminderType === type)
      ) {
        clearTimeout(timeoutId);
        this.activeTimeouts.delete(scheduleId);
      }
    }

    // Remove from database
    const deleteQuery = db.notificationSchedules
      .where("reminderId")
      .equals(reminderId);
    if (type) {
      await deleteQuery
        .and((schedule) => schedule.reminderType === type)
        .delete();
    } else {
      await deleteQuery.delete();
    }

    // Notify service worker
    if (this.isServiceWorkerAvailable && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CANCEL_NOTIFICATION",
        data: { reminderId, reminderType: type },
      });
    }
  }

  private async triggerNotification(
    scheduleId: string,
    title: string,
    body: string,
    reminderId: string
  ): Promise<void> {
    // Mark as processed
    await db.notificationSchedules.update(scheduleId, { isProcessed: true });

    // Remove from active timeouts
    this.activeTimeouts.delete(scheduleId);

    // Show notification
    await this.showNotification(title, body, reminderId);

    // For weekly recurring game events, schedule next occurrence
    const schedule = await db.notificationSchedules.get(scheduleId);
    if (schedule && schedule.reminderType === "game") {
      const gameEvent = await db.gameEventReminders.get(reminderId);
      if (gameEvent?.isWeeklyRecurring && gameEvent.isEnabled) {
        // Schedule next week's occurrence
        setTimeout(() => {
          this.scheduleGameEvent(gameEvent);
        }, 1000); // Brief delay to avoid conflicts
      }
    }
  }

  private async showNotification(
    title: string,
    body: string,
    reminderId: string
  ): Promise<void> {
    const permission = await this.requestPermission();

    if (permission !== "granted") {
      console.warn("Notification permission not granted");
      return;
    }

    try {
      // Use regular browser notifications with user preferences
      const notification = new Notification(title, {
        body,
        icon: "/pwa-192x192.png",
        tag: reminderId,
        data: { reminderId },
        requireInteraction: true,
        silent: !this.soundEnabled, // Respect user sound preference
      });

      // Add vibration for mobile devices if enabled and supported
      if (this.vibrationEnabled && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      notification.onerror = (error) => {
        console.error("Notification error:", error);
      };
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }

  private calculateNextCustomReminderTime(
    reminder: CustomReminder
  ): Date | null {
    const now = new Date();
    const [hours, minutes] = reminder.time.split(":").map(Number);

    switch (reminder.recurrence) {
      case "hourly":
        const nextHour = new Date(now);
        nextHour.setMinutes(minutes, 0, 0);
        if (nextHour <= now) {
          nextHour.setHours(nextHour.getHours() + 1);
        }
        return nextHour;
      case "daily":
        const today = new Date(now);
        today.setHours(hours, minutes, 0, 0);

        // If time has passed today, schedule for tomorrow
        if (today <= now) {
          today.setDate(today.getDate() + 1);
        }

        return today;

      case "weekly":
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);
        nextWeek.setHours(hours, minutes, 0, 0);
        return nextWeek;

      case "once":
      default:
        if (reminder.date) {
          const reminderDate = new Date(reminder.date);
          reminderDate.setHours(hours, minutes, 0, 0);

          // Only schedule if in the future
          return reminderDate > now ? reminderDate : null;
        }
        return null;
    }
  }

  private calculateNextGameEventTime(
    gameEvent: GameEventReminder
  ): Date | null {
    const now = new Date();
    const [hours, minutes] = gameEvent.utc_time.split(":").map(Number);

    // Create UTC date for next occurrence
    const nextOccurrence = new Date();

    // Set to today with the event's UTC time
    nextOccurrence.setUTCHours(hours, minutes, 0, 0);

    // Adjust to correct day of week
    const currentDay = nextOccurrence.getUTCDay();
    const daysUntilEvent = (gameEvent.dayOfWeek - currentDay + 7) % 7;

    if (daysUntilEvent === 0 && nextOccurrence <= now) {
      // Event is today but already passed, schedule for next week
      nextOccurrence.setUTCDate(nextOccurrence.getUTCDate() + 7);
    } else if (daysUntilEvent > 0) {
      // Event is later this week
      nextOccurrence.setUTCDate(nextOccurrence.getUTCDate() + daysUntilEvent);
    }

    return nextOccurrence;
  }

  public async checkMissedNotifications(): Promise<void> {
    const now = new Date();
    const missedSchedules = await db.notificationSchedules
      .where("scheduledTime")
      .below(now)
      .and((schedule) => !schedule.isProcessed)
      .toArray();

    for (const schedule of missedSchedules) {
      await this.triggerNotification(
        schedule.id,
        schedule.title,
        schedule.body,
        schedule.reminderId
      );
    }
  }

  public async rescheduleAllActiveReminders(): Promise<void> {
    // Clear existing timeouts
    this.activeTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.activeTimeouts.clear();

    // Get all active custom reminders
    const activeCustomReminders = await db.customReminders
      .filter((reminder) => reminder.isActive && reminder.notificationEnabled)
      .toArray();

    // Get all enabled game events
    const activeGameEvents = await db.gameEventReminders
      .filter((event) => event.isEnabled)
      .toArray();

    // Reschedule each reminder
    for (const reminder of activeCustomReminders) {
      await this.scheduleCustomReminder(reminder);
    }

    for (const gameEvent of activeGameEvents) {
      await this.scheduleGameEvent(gameEvent);
    }
  }

  public getDebugInfo(): any {
    return {
      permission: Notification.permission,
      serviceWorkerAvailable: this.isServiceWorkerAvailable,
      activeTimeoutsCount: this.activeTimeouts.size,
      activeTimeoutIds: Array.from(this.activeTimeouts.keys()),
    };
  }

  public async testNotification(): Promise<void> {
    const permission = await this.requestPermission();

    if (permission === "granted") {
      await this.showNotification(
        "Test Notification",
        "This is a test notification from the Ants Scheduler PWA",
        "test"
      );
      console.log("Test notification sent");
    } else {
      console.warn("Permission not granted for test notification");
    }
  }

  // Legacy method for backward compatibility
  public async scheduleNotification(reminder: any): Promise<void> {
    // Check if it's a custom reminder with the new interface
    if (reminder.recurrence !== undefined) {
      await this.scheduleCustomReminder(reminder as CustomReminder);
    } else {
      // Handle legacy reminder format
      console.warn("Legacy reminder format detected, attempting conversion");
      const customReminder: CustomReminder = {
        id: reminder.id,
        title: reminder.title,
        description: reminder.description,
        time: reminder.time,
        date: reminder.date,
        recurrence: reminder.isDaily ? "daily" : "once",
        isActive: reminder.isActive,
        notificationEnabled: reminder.notificationEnabled,
        createdAt: reminder.createdAt || new Date(),
        updatedAt: reminder.updatedAt || new Date(),
      };
      await this.scheduleCustomReminder(customReminder);
    }
  }

  private loadSoundPreferences(): void {
    const soundPref = localStorage.getItem("notification-sound-enabled");
    const vibrationPref = localStorage.getItem(
      "notification-vibration-enabled"
    );

    this.soundEnabled = soundPref !== null ? JSON.parse(soundPref) : true;
    this.vibrationEnabled =
      vibrationPref !== null ? JSON.parse(vibrationPref) : true;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    localStorage.setItem("notification-sound-enabled", JSON.stringify(enabled));
  }

  public setVibrationEnabled(enabled: boolean): void {
    this.vibrationEnabled = enabled;
    localStorage.setItem(
      "notification-vibration-enabled",
      JSON.stringify(enabled)
    );
  }

  public getSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public getVibrationEnabled(): boolean {
    return this.vibrationEnabled;
  }
}

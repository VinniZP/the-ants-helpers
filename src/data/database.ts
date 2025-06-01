import Dexie, { type Table } from "dexie";
import type {
  GameEventReminder,
  CustomReminder,
  NotificationSchedule,
  AppSettings,
  GameEvent,
} from "./types";
import gameScheduleData from "../../docs/default-schedule.json";

export class AntsCalcDatabase extends Dexie {
  gameEventReminders!: Table<GameEventReminder>;
  customReminders!: Table<CustomReminder>;
  notificationSchedules!: Table<NotificationSchedule>;
  appSettings!: Table<AppSettings>;

  constructor() {
    super("AntsCalcDatabase");

    // Version 1 - Legacy reminder schema (for migration)
    this.version(1).stores({
      reminders:
        "id, time, date, isDaily, isActive, notificationEnabled, category",
    });

    // Version 2 - New schema with separate tables
    this.version(2)
      .stores({
        gameEventReminders:
          "id, utc_time, dayOfWeek, isEnabled, isWeeklyRecurring",
        customReminders:
          "id, time, date, recurrence, isActive, notificationEnabled, category",
        notificationSchedules:
          "id, reminderId, reminderType, scheduledTime, isProcessed",
        appSettings:
          "id, notificationsEnabled, notificationPermission, timeZone",
      })
      .upgrade(async (trans) => {
        console.log("🔄 Migrating database from v1 to v2...");

        // Check if v1 reminders table exists and has data
        if (trans.table("reminders")) {
          try {
            const legacyReminders = await trans.table("reminders").toArray();
            console.log(
              `📦 Found ${legacyReminders.length} legacy reminders to migrate`
            );

            // Transform legacy reminders to new CustomReminder format
            const customReminders = legacyReminders.map((legacy: any) => ({
              id: legacy.id,
              title: legacy.title,
              description: legacy.description,
              time: legacy.time,
              date: legacy.date,
              recurrence: legacy.isDaily ? "daily" : "once",
              isActive: legacy.isActive,
              notificationEnabled: legacy.notificationEnabled,
              createdAt: legacy.createdAt || new Date(),
              updatedAt: legacy.updatedAt || new Date(),
              completedAt: legacy.completedAt,
              category: legacy.category,
            }));

            // Insert into new customReminders table
            if (customReminders.length > 0) {
              await trans.table("customReminders").bulkAdd(customReminders);
              console.log(
                `✅ Successfully migrated ${customReminders.length} custom reminders`
              );
            }
          } catch (error) {
            console.error("❌ Error during migration:", error);
            // Don't fail upgrade, just log the error
          }
        }

        // Initialize game events from JSON after migration
        await this.initializeGameEventsInTransaction(trans);
        console.log("✅ Database migration completed successfully");
      });

    // Version 3 - Updated to include events with color "none"
    this.version(3)
      .stores({
        gameEventReminders:
          "id, utc_time, dayOfWeek, isEnabled, isWeeklyRecurring",
        customReminders:
          "id, time, date, recurrence, isActive, notificationEnabled, category",
        notificationSchedules:
          "id, reminderId, reminderType, scheduledTime, isProcessed",
        appSettings:
          "id, notificationsEnabled, notificationPermission, timeZone",
      })
      .upgrade(async (trans) => {
        console.log(
          "🔄 Upgrading database to v3 - Adding events with color 'none'..."
        );

        // Clear existing game events to reinitialize with complete data
        await trans.table("gameEventReminders").clear();
        console.log(
          "🗑️ Cleared existing game events for complete reinitalization"
        );

        // Initialize game events from JSON with updated logic
        await this.initializeGameEventsInTransaction(trans);
        console.log("✅ Database upgrade to v3 completed successfully");
      });

    // Version 4 - Add raspberry field support
    this.version(4)
      .stores({
        gameEventReminders:
          "id, utc_time, dayOfWeek, isEnabled, isWeeklyRecurring, raspberry",
        customReminders:
          "id, time, date, recurrence, isActive, notificationEnabled, category",
        notificationSchedules:
          "id, reminderId, reminderType, scheduledTime, isProcessed",
        appSettings:
          "id, notificationsEnabled, notificationPermission, timeZone",
      })
      .upgrade(async (trans) => {
        console.log(
          "🔄 Upgrading database to v4 - Adding raspberry field support..."
        );

        // Clear existing game events to reinitialize with raspberry support
        await trans.table("gameEventReminders").clear();
        console.log(
          "🗑️ Cleared existing game events for raspberry field support"
        );

        // Initialize game events from JSON with raspberry support
        await this.initializeGameEventsInTransaction(trans);
        console.log("✅ Database upgrade to v4 completed successfully");
      });

    // Hooks for auto-updating timestamps
    this.gameEventReminders.hook("creating", (_primKey, obj, _trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.gameEventReminders.hook(
      "updating",
      (modifications: Partial<GameEventReminder>) => {
        modifications.updatedAt = new Date();
      }
    );

    this.customReminders.hook("creating", (_primKey, obj, _trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.customReminders.hook(
      "updating",
      (modifications: Partial<CustomReminder>) => {
        modifications.updatedAt = new Date();
      }
    );

    this.notificationSchedules.hook("creating", (_primKey, obj, _trans) => {
      obj.createdAt = new Date();
    });
  }

  private async initializeGameEventsInTransaction(trans: any): Promise<void> {
    try {
      const gameEvents = gameScheduleData as GameEvent[];
      const eventsToAdd: GameEventReminder[] = [];

      for (const event of gameEvents) {
        for (const [dayName, dayData] of Object.entries(event.days)) {
          const dayOfWeek = russianDayMapping[dayName];

          if (dayOfWeek !== undefined && dayData.text !== "—") {
            const eventId = `${event.utc_time}-${dayOfWeek}`;

            const title = dayData.text.replace(/\*\*/g, "").replace(/\n/g, " ");
            const description =
              dayData.meaning === "—"
                ? dayData.color === "none"
                  ? "Смешанная категория / Mixed category"
                  : title
                : dayData.meaning;

            eventsToAdd.push({
              id: eventId,
              utc_time: event.utc_time,
              dayOfWeek,
              title,
              description,
              color: dayData.color,
              raspberry: dayData.raspberry || false,
              isEnabled: false, // Start disabled, user can enable
              isWeeklyRecurring: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      }

      await trans.table("gameEventReminders").bulkAdd(eventsToAdd);
      console.log(
        `🎮 Initialized ${eventsToAdd.length} game events from schedule data`
      );
    } catch (error) {
      console.error("❌ Error initializing game events:", error);
    }
  }
}

export const db = new AntsCalcDatabase();

// Russian day names mapping to JavaScript day numbers (0=Sunday, 1=Monday, etc.)
const russianDayMapping: { [key: string]: number } = {
  Воскресенье: 0, // Sunday
  Понедельник: 1, // Monday
  Вторник: 2, // Tuesday
  Среда: 3, // Wednesday
  Четверг: 4, // Thursday
  Пятница: 5, // Friday
  Суббота: 6, // Saturday
};

export async function initializeDatabase(): Promise<void> {
  try {
    // Initialize app settings
    const existingSettings = await db.appSettings.get("default");
    if (!existingSettings) {
      await db.appSettings.add({
        id: "default",
        notificationsEnabled: false,
        notificationPermission: "default",
        soundEnabled: true,
        vibrationEnabled: true,
        theme: "system",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        lastSync: new Date(),
      });
    }

    // Check if game events exist, if not initialize them
    const existingGameEvents = await db.gameEventReminders.count();
    if (existingGameEvents === 0) {
      console.log(
        "🎮 No game events found, initializing from schedule data..."
      );

      const gameEvents = gameScheduleData as GameEvent[];
      const eventsToAdd: GameEventReminder[] = [];

      for (const event of gameEvents) {
        for (const [dayName, dayData] of Object.entries(event.days)) {
          const dayOfWeek = russianDayMapping[dayName];

          if (dayOfWeek !== undefined && dayData.text !== "—") {
            const eventId = `${event.utc_time}-${dayOfWeek}`;

            const title = dayData.text.replace(/\*\*/g, "").replace(/\n/g, " ");
            const description =
              dayData.meaning === "—"
                ? dayData.color === "none"
                  ? "Смешанная категория / Mixed category"
                  : title
                : dayData.meaning;

            eventsToAdd.push({
              id: eventId,
              utc_time: event.utc_time,
              dayOfWeek,
              title,
              description,
              color: dayData.color,
              raspberry: dayData.raspberry || false,
              isEnabled: false, // Start disabled, user can enable
              isWeeklyRecurring: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      }

      if (eventsToAdd.length > 0) {
        await db.gameEventReminders.bulkAdd(eventsToAdd);
        console.log(
          `🎮 Successfully initialized ${eventsToAdd.length} game events from schedule data`
        );
      }
    } else {
      console.log(`🎮 Found ${existingGameEvents} existing game events`);
    }

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Legacy functions for backward compatibility during migration
export async function getAllReminders(): Promise<CustomReminder[]> {
  return db.customReminders.orderBy("time").toArray();
}

export async function getActiveReminders(): Promise<CustomReminder[]> {
  return db.customReminders.filter((reminder) => reminder.isActive).toArray();
}

export async function createReminder(
  reminder: Omit<CustomReminder, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = new Date();
  const id = crypto.randomUUID();

  await db.customReminders.add({
    ...reminder,
    id,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

export async function updateReminder(
  id: string,
  updates: Partial<CustomReminder>
): Promise<void> {
  await db.customReminders.update(id, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteReminder(id: string): Promise<void> {
  await db.customReminders.delete(id);
}

// New game event functions
export async function getAllGameEvents(): Promise<GameEventReminder[]> {
  return db.gameEventReminders.orderBy("utc_time").toArray();
}

export async function getEnabledGameEvents(): Promise<GameEventReminder[]> {
  return db.gameEventReminders.filter((event) => event.isEnabled).toArray();
}

export async function toggleGameEvent(
  id: string,
  isEnabled: boolean,
  isWeeklyRecurring?: boolean
): Promise<void> {
  const updates: Partial<GameEventReminder> = {
    isEnabled,
    updatedAt: new Date(),
  };

  if (isWeeklyRecurring !== undefined) {
    updates.isWeeklyRecurring = isWeeklyRecurring;
  }

  await db.gameEventReminders.update(id, updates);
}

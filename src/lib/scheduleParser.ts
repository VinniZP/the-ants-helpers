/**
 * Schedule parsing algorithm with pre-computed weekly pattern cache
 * Implements the algorithm design from creative phase
 */

import type { GameEvent, GameEventReminder } from "../data/types";

// Russian day names mapping to JavaScript day numbers (0=Sunday, 1=Monday, etc.)
export const russianDayMapping: { [key: string]: number } = {
  Воскресенье: 0, // Sunday
  Понедельник: 1, // Monday
  Вторник: 2, // Tuesday
  Среда: 3, // Wednesday
  Четверг: 4, // Thursday
  Пятница: 5, // Friday
  Суббота: 6, // Saturday
};

// Reverse mapping for display purposes
export const dayNumberToRussian: { [key: number]: string } = {
  0: "Воскресенье",
  1: "Понедельник",
  2: "Вторник",
  3: "Среда",
  4: "Четверг",
  5: "Пятница",
  6: "Суббота",
};

export interface ParsedScheduleData {
  eventsByTime: Map<string, GameEventData[]>;
  timeSlots: string[];
  totalEvents: number;
  eventsByDay: Map<number, GameEventData[]>;
}

export interface GameEventData {
  dayOfWeek: number;
  title: string;
  description: string;
  color: string;
  utcTime: string;
  localTime?: string;
}

export interface WeeklyPattern {
  timeSlots: Map<string, GameEventData[]>; // UTC time -> events per day
  eventsByDay: Map<number, GameEventData[]>; // Day of week -> all events
  timeSlotsList: string[]; // Ordered list of time slots
  totalEvents: number;
}

export class ScheduleParser {
  private weeklyPattern: WeeklyPattern | null = null;

  /**
   * Parse JSON schedule into optimized data structures
   * O(n × d) complexity for initialization, O(1) for subsequent queries
   */
  static parse(scheduleJSON: GameEvent[]): ParsedScheduleData {
    const eventsByTime = new Map<string, GameEventData[]>();
    const eventsByDay = new Map<number, GameEventData[]>();
    const timeSlots: string[] = [];
    let totalEvents = 0;

    console.time("⏱️ Schedule parsing");

    for (const timeSlot of scheduleJSON) {
      const utcTime = timeSlot.utc_time;
      timeSlots.push(utcTime);

      const dayEvents: GameEventData[] = [];

      for (const [dayName, eventData] of Object.entries(timeSlot.days)) {
        const dayOfWeek = russianDayMapping[dayName];

        if (dayOfWeek !== undefined && eventData.text !== "—") {
          const title = eventData.text.replace(/\*\*/g, "").replace(/\n/g, " ");
          const description =
            eventData.meaning === "—"
              ? eventData.color === "none"
                ? "Смешанная категория / Mixed category"
                : title
              : eventData.meaning;

          const gameEventData: GameEventData = {
            dayOfWeek,
            title,
            description,
            color: eventData.color,
            utcTime: utcTime,
          };

          dayEvents.push(gameEventData);
          totalEvents++;

          // Also organize by day of week for daily views
          if (!eventsByDay.has(dayOfWeek)) {
            eventsByDay.set(dayOfWeek, []);
          }
          eventsByDay.get(dayOfWeek)!.push(gameEventData);
        }
      }

      eventsByTime.set(utcTime, dayEvents);
    }

    console.timeEnd("⏱️ Schedule parsing");
    console.log(
      `📊 Parsed ${totalEvents} events across ${timeSlots.length} time slots`
    );

    return { eventsByTime, timeSlots, totalEvents, eventsByDay };
  }

  /**
   * Initialize weekly pattern cache from JSON data
   */
  initializeWeeklyPattern(scheduleJSON: GameEvent[]): WeeklyPattern {
    if (this.weeklyPattern) {
      return this.weeklyPattern;
    }

    const parsedData = ScheduleParser.parse(scheduleJSON);

    this.weeklyPattern = {
      timeSlots: parsedData.eventsByTime,
      eventsByDay: parsedData.eventsByDay,
      timeSlotsList: parsedData.timeSlots.sort(), // Sort time slots
      totalEvents: parsedData.totalEvents,
    };

    return this.weeklyPattern;
  }

  /**
   * Get events for a specific time slot - O(1) query
   */
  getEventsForTimeSlot(utcTime: string): GameEventData[] {
    if (!this.weeklyPattern) {
      throw new Error(
        "Weekly pattern not initialized. Call initializeWeeklyPattern first."
      );
    }

    return this.weeklyPattern.timeSlots.get(utcTime) || [];
  }

  /**
   * Get all events for a specific day of week - O(1) query
   */
  getEventsForDay(dayOfWeek: number): GameEventData[] {
    if (!this.weeklyPattern) {
      throw new Error(
        "Weekly pattern not initialized. Call initializeWeeklyPattern first."
      );
    }

    return this.weeklyPattern.eventsByDay.get(dayOfWeek) || [];
  }

  /**
   * Get all time slots in order
   */
  getTimeSlots(): string[] {
    if (!this.weeklyPattern) {
      throw new Error(
        "Weekly pattern not initialized. Call initializeWeeklyPattern first."
      );
    }

    return this.weeklyPattern.timeSlotsList;
  }

  /**
   * Get events that have been enabled by the user
   */
  async getEnabledEventsForTimeSlot(
    utcTime: string,
    enabledEventIds: Set<string>
  ): Promise<GameEventData[]> {
    const allEvents = this.getEventsForTimeSlot(utcTime);

    return allEvents.filter((event) => {
      const eventId = `${event.utcTime}-${event.dayOfWeek}`;
      return enabledEventIds.has(eventId);
    });
  }

  /**
   * Convert GameEventData to GameEventReminder format
   */
  static gameEventDataToReminder(
    eventData: GameEventData
  ): Omit<GameEventReminder, "createdAt" | "updatedAt"> {
    return {
      id: `${eventData.utcTime}-${eventData.dayOfWeek}`,
      utc_time: eventData.utcTime,
      dayOfWeek: eventData.dayOfWeek,
      title: eventData.title,
      description: eventData.description,
      color: eventData.color,
      isEnabled: false,
      isWeeklyRecurring: false,
    };
  }

  /**
   * Get statistics about the parsed schedule
   */
  getScheduleStats(): {
    totalEvents: number;
    timeSlots: number;
    eventsByDay: { [day: string]: number };
    eventsByColor: { [color: string]: number };
  } {
    if (!this.weeklyPattern) {
      throw new Error("Weekly pattern not initialized.");
    }

    const eventsByDay: { [day: string]: number } = {};
    const eventsByColor: { [color: string]: number } = {};

    // Count events by day
    for (const [dayNum, events] of this.weeklyPattern.eventsByDay) {
      const dayName = dayNumberToRussian[dayNum];
      eventsByDay[dayName] = events.length;
    }

    // Count events by color
    for (const events of this.weeklyPattern.timeSlots.values()) {
      for (const event of events) {
        eventsByColor[event.color] = (eventsByColor[event.color] || 0) + 1;
      }
    }

    return {
      totalEvents: this.weeklyPattern.totalEvents,
      timeSlots: this.weeklyPattern.timeSlotsList.length,
      eventsByDay,
      eventsByColor,
    };
  }

  /**
   * Find events by search criteria
   */
  searchEvents(criteria: {
    title?: string;
    description?: string;
    color?: string;
    dayOfWeek?: number;
  }): GameEventData[] {
    if (!this.weeklyPattern) {
      return [];
    }

    const results: GameEventData[] = [];

    for (const events of this.weeklyPattern.timeSlots.values()) {
      for (const event of events) {
        let matches = true;

        if (
          criteria.title &&
          !event.title.toLowerCase().includes(criteria.title.toLowerCase())
        ) {
          matches = false;
        }

        if (
          criteria.description &&
          !event.description
            .toLowerCase()
            .includes(criteria.description.toLowerCase())
        ) {
          matches = false;
        }

        if (criteria.color && event.color !== criteria.color) {
          matches = false;
        }

        if (
          criteria.dayOfWeek !== undefined &&
          event.dayOfWeek !== criteria.dayOfWeek
        ) {
          matches = false;
        }

        if (matches) {
          results.push(event);
        }
      }
    }

    return results;
  }

  /**
   * Clear cached weekly pattern (useful for testing or data refresh)
   */
  clearCache(): void {
    this.weeklyPattern = null;
  }
}

// Export singleton instance
export const scheduleParser = new ScheduleParser();

// Utility functions
export function getDayName(
  dayOfWeek: number,
  language: "ru" | "en" = "ru"
): string {
  if (language === "ru") {
    return dayNumberToRussian[dayOfWeek] || "Unknown";
  }

  const englishDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return englishDays[dayOfWeek] || "Unknown";
}

export function getDayAbbreviation(
  dayOfWeek: number,
  language: "ru" | "en" = "en"
): string {
  if (language === "en") {
    const abbrevs = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return abbrevs[dayOfWeek] || "?";
  }

  const russianAbbrevs = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  return russianAbbrevs[dayOfWeek] || "?";
}

/**
 * Timezone conversion utilities with caching for optimal performance
 * Implements the algorithm design from creative phase
 */

export class TimezoneConverter {
  private conversionCache = new Map<string, Map<string, Date>>();
  private currentTimezone: string;

  constructor() {
    this.currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Convert UTC time to local timezone with caching
   * @param utcTime - UTC time in "HH:MM" format
   * @param timezone - Target timezone (defaults to user's current timezone)
   * @returns Date object in target timezone
   */
  convertUTCToLocal(utcTime: string, timezone?: string): Date {
    const targetTimezone = timezone || this.currentTimezone;

    // Check cache first
    const timezoneCache = this.conversionCache.get(targetTimezone);
    if (timezoneCache?.has(utcTime)) {
      return timezoneCache.get(utcTime)!;
    }

    // Parse UTC time
    const [hours, minutes] = utcTime.split(":").map(Number);

    // Create UTC date for today
    const utcDate = new Date();
    utcDate.setUTCHours(hours, minutes, 0, 0);

    // Convert to target timezone using Intl.DateTimeFormat for DST awareness
    const localTimeString = utcDate.toLocaleString("en-US", {
      timeZone: targetTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const localDate = new Date(localTimeString);

    // Cache result
    if (!this.conversionCache.has(targetTimezone)) {
      this.conversionCache.set(targetTimezone, new Map());
    }
    this.conversionCache.get(targetTimezone)!.set(utcTime, localDate);

    return localDate;
  }

  /**
   * Format time for display
   * @param date - Date object
   * @param options - Formatting options
   * @returns Formatted time string
   */
  formatForDisplay(
    date: Date,
    options: { hour12?: boolean; showSeconds?: boolean } = {}
  ): string {
    const { hour12 = false, showSeconds = false } = options;

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: showSeconds ? "2-digit" : undefined,
      hour12,
    });
  }

  /**
   * Get UTC offset for a timezone
   * @param timezone - Target timezone
   * @returns UTC offset in hours
   */
  getUTCOffset(timezone?: string): number {
    const targetTimezone = timezone || this.currentTimezone;
    const date = new Date();

    const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
    const localTime = new Date(
      utcTime + this.getTimezoneOffset(targetTimezone) * 3600000
    );

    return (localTime.getTime() - utcTime) / 3600000;
  }

  /**
   * Detect timezone changes and invalidate cache
   * @returns true if timezone changed
   */
  detectTimezoneChange(): boolean {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (detected !== this.currentTimezone) {
      console.log(
        `🌍 Timezone changed from ${this.currentTimezone} to ${detected}`
      );
      this.currentTimezone = detected;
      this.invalidateTimezoneCache();
      return true;
    }

    return false;
  }

  /**
   * Clear timezone conversion cache
   */
  invalidateTimezoneCache(): void {
    this.conversionCache.clear();
    console.log("🗑️ Timezone cache invalidated");
  }

  /**
   * Get timezone offset in hours for a specific timezone
   */
  private getTimezoneOffset(timezone: string): number {
    const date = new Date();
    const utc1 = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    const utc2 = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    return (utc2.getTime() - utc1.getTime()) / 3600000;
  }

  /**
   * Handle Daylight Saving Time transitions
   * @param utcTime - UTC time string
   * @param userTimezone - User's timezone
   * @returns DST-aware local date
   */
  handleDSTTransition(utcTime: string, userTimezone: string): Date {
    const [hours, minutes] = utcTime.split(":").map(Number);

    // Create UTC date
    const utcDate = new Date();
    utcDate.setUTCHours(hours, minutes, 0, 0);

    // Use Intl.DateTimeFormat for DST-aware conversion
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: userTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const formatted = formatter.format(utcDate);
    return new Date(formatted);
  }

  /**
   * Get current user's timezone
   */
  getCurrentTimezone(): string {
    return this.currentTimezone;
  }

  /**
   * Convert local time to UTC for scheduling
   * @param localTime - Local time in "HH:MM" format
   * @returns UTC time string
   */
  convertLocalToUTC(localTime: string): string {
    const [hours, minutes] = localTime.split(":").map(Number);

    // Create date in source timezone
    const localDate = new Date();
    localDate.setHours(hours, minutes, 0, 0);

    // Convert to UTC
    const utcTime = new Date(
      localDate.toLocaleString("en-US", { timeZone: "UTC" })
    );

    return `${utcTime.getUTCHours().toString().padStart(2, "0")}:${utcTime
      .getUTCMinutes()
      .toString()
      .padStart(2, "0")}`;
  }
}

// Export singleton instance
export const timezoneConverter = new TimezoneConverter();

// Utility functions for common operations
export function formatGameEventTime(
  utcTime: string,
  timezone?: string
): string {
  const localDate = timezoneConverter.convertUTCToLocal(utcTime, timezone);
  return timezoneConverter.formatForDisplay(localDate);
}

export function isTimezoneChanged(): boolean {
  return timezoneConverter.detectTimezoneChange();
}

export function getCurrentTimezone(): string {
  return timezoneConverter.getCurrentTimezone();
}

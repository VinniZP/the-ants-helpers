import { useState, useEffect } from "react";

/**
 * Custom hook to track current time and provide time-based highlighting logic
 */
export function useCurrentTime() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  /**
   * Check if a UTC time string represents the current hour
   * @param utcTime - Time in format "HH:MM" (UTC)
   * @returns boolean indicating if this is the current time slot
   */
  const isCurrentTimeSlot = (utcTime: string): boolean => {
    try {
      const [hours, minutes] = utcTime.split(":").map(Number);

      // Create a UTC date with today's date and the given time
      const utcDateTime = new Date();
      utcDateTime.setUTCHours(hours, minutes, 0, 0);

      // Convert to local time for comparison
      const localDateTime = new Date(utcDateTime.getTime());

      // Get current local time
      const now = currentTime;

      // Check if we're within the same hour
      const isSameHour = localDateTime.getHours() === now.getHours();
      const isSameDay = localDateTime.toDateString() === now.toDateString();

      return isSameHour && isSameDay;
    } catch (error) {
      console.warn("Error checking current time slot:", error);
      return false;
    }
  };

  /**
   * Check if a UTC time string represents the next upcoming time slot
   * @param utcTime - Time in format "HH:MM" (UTC)
   * @returns boolean indicating if this is the next time slot
   */
  const isUpcomingTimeSlot = (utcTime: string): boolean => {
    try {
      const [hours, minutes] = utcTime.split(":").map(Number);

      // Create a UTC date with today's date and the given time
      const utcDateTime = new Date();
      utcDateTime.setUTCHours(hours, minutes, 0, 0);

      // Convert to local time for comparison
      const localDateTime = new Date(utcDateTime.getTime());

      // Get current local time
      const now = currentTime;

      // Check if this time is in the next 1-2 hours
      const timeDiff = localDateTime.getTime() - now.getTime();
      const oneHour = 60 * 60 * 1000;
      const twoHours = 2 * oneHour;

      return timeDiff > 0 && timeDiff <= twoHours;
    } catch (error) {
      console.warn("Error checking upcoming time slot:", error);
      return false;
    }
  };

  /**
   * Get the current local time in HH:MM format
   */
  const getCurrentLocalTime = (): string => {
    return currentTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  /**
   * Get the current day of week (0 = Sunday, 1 = Monday, etc.)
   */
  const getCurrentDayOfWeek = (): number => {
    return currentTime.getDay();
  };

  return {
    currentTime,
    isCurrentTimeSlot,
    isUpcomingTimeSlot,
    getCurrentLocalTime,
    getCurrentDayOfWeek,
  };
}

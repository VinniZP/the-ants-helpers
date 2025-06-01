import { memo } from "react";
import { Button } from "../../ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { cn } from "../../../lib/utils";
import type { DayNavigatorProps } from "../shared/types";

/**
 * Day navigator component for mobile single-day view
 * Provides intuitive navigation between days of the week with current day highlighting
 */
function DayNavigatorComponent({
  selectedDay,
  onDayChange,
  localizedDayNames,
  showArrows = true,
  showDayButtons = false,
}: DayNavigatorProps) {
  const { getCurrentDayOfWeek } = useCurrentTime();
  const currentDayOfWeek = getCurrentDayOfWeek();
  const isToday = selectedDay === currentDayOfWeek;

  const handlePreviousDay = () => {
    const newDay = selectedDay === 0 ? 6 : selectedDay - 1;
    onDayChange(newDay);
  };

  const handleNextDay = () => {
    const newDay = selectedDay === 6 ? 0 : selectedDay + 1;
    onDayChange(newDay);
  };

  return (
    <div
      className={cn(
        "border-b border-gray-200 sticky top-0 z-10 transition-colors",
        isToday ? "bg-blue-50" : "bg-white"
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Previous Day Button */}
        {showArrows && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousDay}
            className="h-8 w-8 p-0 touch-manipulation"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Current Day Display */}
        <div className="flex-1 flex justify-center">
          <div className="text-center">
            <h2
              className={cn(
                "text-lg font-semibold flex items-center justify-center gap-2",
                isToday ? "text-blue-800" : "text-gray-900"
              )}
            >
              {isToday && <Calendar className="h-4 w-4" />}
              {localizedDayNames[selectedDay]}
              {isToday && (
                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded font-bold">
                  TODAY
                </span>
              )}
            </h2>
            <p
              className={cn(
                "text-xs mt-0.5",
                isToday ? "text-blue-600" : "text-gray-500"
              )}
            >
              {isToday
                ? "Showing current day events"
                : "Tap arrows to switch days"}
            </p>
          </div>
        </div>

        {/* Next Day Button */}
        {showArrows && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextDay}
            className="h-8 w-8 p-0 touch-manipulation"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Optional: Day buttons row for quick access */}
      {showDayButtons && (
        <div className="flex justify-center pb-2">
          <div className="flex space-x-1 overflow-x-auto px-4">
            {localizedDayNames.map((dayName, index) => {
              const isDayToday = index === currentDayOfWeek;
              return (
                <Button
                  key={index}
                  variant={index === selectedDay ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onDayChange(index)}
                  className={cn(
                    "min-w-[44px] text-xs touch-manipulation relative",
                    index === selectedDay
                      ? "bg-blue-600 text-white"
                      : isDayToday
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "text-gray-600"
                  )}
                >
                  {dayName.slice(0, 3)}
                  {isDayToday && index !== selectedDay && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full"></span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export const DayNavigator = memo(DayNavigatorComponent);

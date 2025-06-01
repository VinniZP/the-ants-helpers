import { memo } from "react";
import { Button } from "../../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { DayNavigatorProps } from "../shared/types";

/**
 * Day navigator component for mobile single-day view
 * Provides intuitive navigation between days of the week
 */
function DayNavigatorComponent({
  selectedDay,
  onDayChange,
  localizedDayNames,
  showArrows = true,
  showDayButtons = false,
}: DayNavigatorProps) {
  const handlePreviousDay = () => {
    const newDay = selectedDay === 0 ? 6 : selectedDay - 1;
    onDayChange(newDay);
  };

  const handleNextDay = () => {
    const newDay = selectedDay === 6 ? 0 : selectedDay + 1;
    onDayChange(newDay);
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
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
            <h2 className="text-lg font-semibold text-gray-900">
              {localizedDayNames[selectedDay]}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Tap arrows to switch days
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
            {localizedDayNames.map((dayName, index) => (
              <Button
                key={index}
                variant={index === selectedDay ? "default" : "ghost"}
                size="sm"
                onClick={() => onDayChange(index)}
                className={cn(
                  "min-w-[44px] text-xs touch-manipulation",
                  index === selectedDay
                    ? "bg-blue-600 text-white"
                    : "text-gray-600"
                )}
              >
                {dayName.slice(0, 3)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const DayNavigator = memo(DayNavigatorComponent);

import { memo } from "react";
import { Button } from "../../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { formatGameEventTime } from "../../../lib/timezone";
import { getTranslation } from "../../../lib/locale";
import { cn, getAssetPath } from "../../../lib/utils";
import type { EventCardProps } from "./types";

// Color mapping for event types
const colorMap: { [key: string]: string } = {
  yellow: "bg-yellow-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  "blue+green": "bg-gradient-to-r from-blue-500 to-green-500",
  "yellow+blue": "bg-gradient-to-r from-yellow-500 to-blue-500",
  "yellow+green": "bg-gradient-to-r from-yellow-500 to-green-500",
  none: "bg-gray-400",
};

// Size variants for different layouts
const sizeVariants = {
  small: {
    container: "h-8 sm:h-10",
    text: "text-xs",
    padding: "p-1",
    dropdown: "h-4 w-4",
    dropdownIcon: "h-2 w-2",
  },
  medium: {
    container: "h-10 sm:h-12 lg:h-16",
    text: "text-xs sm:text-sm",
    padding: "p-1 sm:p-2 lg:p-3",
    dropdown: "h-6 w-6 sm:h-8 sm:w-8",
    dropdownIcon: "h-3 w-3 sm:h-4 sm:w-4",
  },
  large: {
    container: "h-12 sm:h-16 lg:h-20",
    text: "text-sm sm:text-base lg:text-lg",
    padding: "p-2 sm:p-3 lg:p-4",
    dropdown: "h-8 w-8 sm:h-10 sm:w-10",
    dropdownIcon: "h-4 w-4 sm:h-5 sm:w-5",
  },
};

/**
 * EventCard component for displaying individual game events
 * Supports different sizes and maintains existing functionality
 */
function EventCardComponent({
  event,
  onToggle,
  size = "medium",
  className,
}: EventCardProps) {
  const sizeClasses = sizeVariants[size];
  const locale = navigator.language || "en-US";

  const handleToggle = () => {
    onToggle(event.id, !event.isEnabled);
  };

  const handleRecurrenceChange = (recurring: boolean) => {
    onToggle(event.id, true, recurring);
  };

  const handleDisable = () => {
    onToggle(event.id, false);
  };

  return (
    <div className="space-y-1">
      {/* Event Card */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              sizeClasses.container,
              sizeClasses.padding,
              "rounded lg:rounded-lg text-white flex items-center justify-center cursor-pointer transition-all duration-200 min-h-[40px] touch-manipulation active:scale-95 lg:hover:scale-105 lg:hover:shadow-lg relative",
              colorMap[event.color] || "bg-gray-400",
              event.isEnabled
                ? "opacity-100 shadow-sm lg:shadow-md"
                : "opacity-50",
              event.raspberry ? "ring-2 ring-purple-400 ring-opacity-60" : "",
              className
            )}
            onClick={handleToggle}
          >
            <span
              className={cn(
                sizeClasses.text,
                "text-center leading-tight overflow-hidden font-medium"
              )}
            >
              {event.title.split(" ")[0]}
            </span>
            {event.raspberry && (
              <span
                className={cn(
                  "absolute -top-3 -right-3",
                  size === "small" ? "text-xs" : "text-xs lg:text-sm"
                )}
              >
                <img
                  src={getAssetPath("/raspberry.png")}
                  alt="Raspberry"
                  className="size-8"
                />
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-medium">
              {event.title}
              {event.raspberry && (
                <img
                  src={getAssetPath("/raspberry.png")}
                  alt="Raspberry"
                  className="w-4 h-4"
                />
              )}
            </div>
            <div className="text-xs text-gray-200">{event.description}</div>
            <div className="text-xs text-gray-300">
              Local: {formatGameEventTime(event.utc_time)} | UTC:{" "}
              {event.utc_time}
            </div>
            {event.raspberry && (
              <div className="text-xs text-purple-300">
                ⭐ Special event with extra rewards
              </div>
            )}
            <div className="text-xs text-gray-300">
              Click to {event.isEnabled ? "disable" : "enable"}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Configuration Dropdown */}
      {event.isEnabled && (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  sizeClasses.dropdown,
                  "p-0 min-h-[32px] min-w-[32px] touch-manipulation"
                )}
              >
                <ChevronDown className={sizeClasses.dropdownIcon} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-36">
              <DropdownMenuItem
                onClick={() => handleRecurrenceChange(false)}
                className={cn(
                  "text-sm",
                  event.isWeeklyRecurring ? "" : "bg-blue-50"
                )}
              >
                {getTranslation("onceOnly", locale)}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleRecurrenceChange(true)}
                className={cn(
                  "text-sm",
                  event.isWeeklyRecurring ? "bg-blue-50" : ""
                )}
              >
                {getTranslation("everyWeek", locale)}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDisable}
                className="text-red-600 text-sm"
              >
                {getTranslation("turnOff", locale)}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const EventCard = memo(EventCardComponent);

import { memo } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import {
  Grid,
  List,
  Eye,
  EyeOff,
  Calendar,
  CalendarDays,
  Settings,
  Cherry,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { cn, getAssetPath } from "../../../lib/utils";
import type { ViewModeSelectorProps } from "../shared/types";

/**
 * Desktop view mode selector component
 * Provides controls for view mode, layout mode, focus filter, and raspberry filter
 */
function ViewModeSelectorComponent({
  viewMode,
  layoutMode,
  focusFilter,
  raspberryFilter,
  onViewModeChange,
  onLayoutModeChange,
  onFocusFilterChange,
  onRaspberryFilterChange,
  onToggleAllFiltered,
  hasFilteredEvents,
}: ViewModeSelectorProps) {
  const viewModeOptions = [
    {
      value: "all" as const,
      label: "All Days",
      description: "Show all 7 days of the week",
      icon: CalendarDays,
    },
    {
      value: "select" as const,
      label: "Select Days",
      description: "Toggle individual days on/off",
      icon: Calendar,
    },
    {
      value: "single" as const,
      label: "Single Day",
      description: "Focus on one day at a time",
      icon: Calendar,
    },
  ];

  const layoutModeOptions = [
    {
      value: "grid" as const,
      label: "Grid View",
      description: "Table-like grid layout",
      icon: Grid,
    },
    {
      value: "list" as const,
      label: "List View",
      description: "Vertical list layout",
      icon: List,
    },
  ];

  const focusFilterOptions = [
    {
      value: "all" as const,
      label: "All Events",
      description: "Show both active and inactive events",
      icon: Eye,
    },
    {
      value: "active" as const,
      label: "Active Only",
      description: "Show only enabled events",
      icon: Eye,
    },
    {
      value: "inactive" as const,
      label: "Inactive Only",
      description: "Show only disabled events",
      icon: EyeOff,
    },
  ];

  const raspberryFilterOptions = [
    {
      value: "all" as const,
      label: "All Events",
      description: "Show all events regardless of raspberry status",
      icon: Eye,
    },
    {
      value: "raspberry-only" as const,
      label: "Raspberry Only",
      description: "Show only events with raspberry rewards",
      icon: Cherry,
    },
  ];

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          View Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* View Mode Selection */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">View Mode</label>
          <div className="flex flex-wrap gap-2">
            {viewModeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Tooltip key={option.value}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={
                        viewMode === option.value ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => onViewModeChange(option.value)}
                      className={cn(
                        "flex items-center gap-2 min-w-[100px]",
                        viewMode === option.value && "bg-blue-600 text-white"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{option.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Layout Mode Selection */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Layout Mode
          </label>
          <div className="flex flex-wrap gap-2">
            {layoutModeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Tooltip key={option.value}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={
                        layoutMode === option.value ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => onLayoutModeChange(option.value)}
                      className={cn(
                        "flex items-center gap-2 min-w-[100px]",
                        layoutMode === option.value && "bg-green-600 text-white"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{option.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Focus Filter Selection */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Event Filter
          </label>
          <div className="flex flex-wrap gap-2">
            {focusFilterOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Tooltip key={option.value}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={
                        focusFilter === option.value ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => onFocusFilterChange(option.value)}
                      className={cn(
                        "flex items-center gap-2 min-w-[100px]",
                        focusFilter === option.value &&
                          "bg-purple-600 text-white"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{option.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Raspberry Filter Selection */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            Raspberry Filter
            <img
              src={getAssetPath("/raspberry.png")}
              alt="Raspberry"
              className="w-4 h-4"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {raspberryFilterOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Tooltip key={option.value}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={
                        raspberryFilter === option.value ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => onRaspberryFilterChange(option.value)}
                      className={cn(
                        "flex items-center gap-2 min-w-[100px]",
                        raspberryFilter === option.value &&
                          "bg-pink-600 text-white"
                      )}
                    >
                      {option.value === "raspberry-only" ? (
                        <img
                          src={getAssetPath("/raspberry.png")}
                          alt="Raspberry"
                          className="w-4 h-4"
                        />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                      {option.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{option.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Toggle All Filtered Events */}
        {hasFilteredEvents && (
          <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200">
            <label className="text-sm font-medium text-gray-700">
              Bulk Actions
            </label>
            <div className="flex flex-wrap gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleAllFiltered(true)}
                    className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-200"
                  >
                    <ToggleRight className="h-4 w-4 text-green-600" />
                    Enable All Filtered
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enable all events currently shown in the filtered view</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleAllFiltered(false)}
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 border-red-200"
                  >
                    <ToggleLeft className="h-4 w-4 text-red-600" />
                    Disable All Filtered
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Disable all events currently shown in the filtered view</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Additional Controls for Select Mode */}
        {viewMode === "select" && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">
              💡 In Select mode, click day headers in the schedule to toggle day
              visibility
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const ViewModeSelector = memo(ViewModeSelectorComponent);

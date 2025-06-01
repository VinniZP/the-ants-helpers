import { memo } from "react";
import { TooltipProvider } from "../ui/tooltip";
import { MobileScheduleView } from "./mobile/MobileScheduleView";
import { DesktopScheduleView } from "./desktop/DesktopScheduleView";
import { useScheduleState } from "./hooks/useScheduleState";
import { useEventData } from "./hooks/useEventData";
import { useResponsive } from "./hooks/useResponsive";
import { cn } from "../../lib/utils";
import type { WeeklyScheduleProps } from "./shared/types";

/**
 * Main WeeklySchedule component with responsive design
 * Automatically switches between mobile and desktop layouts
 */
function WeeklyScheduleComponent({ className }: WeeklyScheduleProps) {
  // Initialize hooks
  const scheduleState = useScheduleState();
  const responsive = useResponsive();

  // Create event filters from schedule state
  const eventFilters = {
    selectedDay: scheduleState.state.selectedDay,
    viewMode: scheduleState.state.viewMode,
    focusFilter: scheduleState.state.focusFilter,
    visibleDays: scheduleState.state.visibleDays,
  };

  const eventData = useEventData(eventFilters);

  return (
    <TooltipProvider>
      <div className={cn("w-full h-full", className)}>
        {/* Mobile Layout */}
        {responsive.isMobile && (
          <MobileScheduleView
            scheduleState={scheduleState}
            eventData={eventData}
          />
        )}

        {/* Desktop Layout */}
        {responsive.isDesktop && (
          <DesktopScheduleView
            scheduleState={scheduleState}
            eventData={eventData}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

export const WeeklySchedule = memo(WeeklyScheduleComponent);

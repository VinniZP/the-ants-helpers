import { memo } from "react";
import { ViewModeSelector } from "./ViewModeSelector";
import { TimeSlotGrid } from "../shared/TimeSlotGrid";
import { TimeSlotList } from "../shared/TimeSlotList";
import { DayNavigator } from "../mobile/DayNavigator";
import { getLocaleSettings, getLocalizedDayNames } from "../../../lib/locale";
import type { DesktopScheduleViewProps } from "../shared/types";

/**
 * Desktop schedule view component
 * Renders different layouts based on view mode and layout mode
 */
function DesktopScheduleViewComponent({
  scheduleState,
  eventData,
}: DesktopScheduleViewProps) {
  const { state, actions } = scheduleState;
  const { data } = eventData;

  const localeSettings = getLocaleSettings();
  const localizedDayNames = getLocalizedDayNames(localeSettings);

  return (
    <div className="space-y-4">
      {/* View Controls */}
      <ViewModeSelector
        viewMode={state.viewMode}
        layoutMode={state.layoutMode}
        focusFilter={state.focusFilter}
        onViewModeChange={actions.setViewMode}
        onLayoutModeChange={actions.setLayoutMode}
        onFocusFilterChange={actions.setFocusFilter}
      />

      {/* Single Day View - Uses day navigator */}
      {state.viewMode === "single" && (
        <div>
          <DayNavigator
            selectedDay={state.selectedDay}
            onDayChange={actions.setSelectedDay}
            localizedDayNames={localizedDayNames}
            showArrows={true}
            showDayButtons={true}
          />

          {/* Single day content */}
          <div className="mt-4">
            {state.layoutMode === "grid" ? (
              <TimeSlotGrid
                viewMode="single"
                events={data.filteredEvents}
                onEventToggle={eventData.actions.toggleEvent}
              />
            ) : (
              <TimeSlotList
                selectedDay={state.selectedDay}
                events={data.filteredEvents}
                onEventToggle={eventData.actions.toggleEvent}
              />
            )}
          </div>
        </div>
      )}

      {/* All Days View - Shows full grid/list */}
      {state.viewMode === "all" && (
        <div>
          {state.layoutMode === "grid" ? (
            <TimeSlotGrid
              viewMode="all"
              events={data.filteredEvents}
              onEventToggle={eventData.actions.toggleEvent}
            />
          ) : (
            <div className="space-y-6">
              {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                <div key={dayIndex}>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    {localizedDayNames[dayIndex]}
                  </h3>
                  <TimeSlotList
                    selectedDay={dayIndex}
                    events={data.filteredEvents}
                    onEventToggle={eventData.actions.toggleEvent}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Select Days View - Shows grid/list with day toggles */}
      {state.viewMode === "select" && (
        <div>
          {state.layoutMode === "grid" ? (
            <TimeSlotGrid
              viewMode="select"
              visibleDays={state.visibleDays}
              events={data.filteredEvents}
              onEventToggle={eventData.actions.toggleEvent}
              onDayToggle={actions.toggleDayVisibility}
            />
          ) : (
            <div className="space-y-6">
              {[0, 1, 2, 3, 4, 5, 6]
                .filter((dayIndex) => state.visibleDays[dayIndex])
                .map((dayIndex) => (
                  <div key={dayIndex}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {localizedDayNames[dayIndex]}
                      </h3>
                      <button
                        onClick={() => actions.toggleDayVisibility(dayIndex)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Hide Day
                      </button>
                    </div>
                    <TimeSlotList
                      selectedDay={dayIndex}
                      events={data.filteredEvents}
                      onEventToggle={eventData.actions.toggleEvent}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {data.loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 text-lg">Loading events...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!data.loading && Object.keys(data.filteredEvents).length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-500 text-xl mb-2">No events found</p>
            <p className="text-gray-400">
              Try adjusting your view settings or event filters
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export const DesktopScheduleView = memo(DesktopScheduleViewComponent);

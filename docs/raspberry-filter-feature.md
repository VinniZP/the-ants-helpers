# Raspberry Filter & Toggle All Feature

## Overview

Added filtering capabilities to show only events with "raspberry" rewards and bulk toggle functionality for all filtered events.

## Features Implemented

### 1. Raspberry Filter

- **All Events**: Shows all events regardless of raspberry status (default)
- **Raspberry Only**: Shows only events that have `raspberry: true` property
- Filter works in combination with existing filters (view mode, focus filter)

### 2. Toggle All Filtered Events

- **Enable All Filtered**: Enables all events currently visible in the filtered view
- **Disable All Filtered**: Disables all events currently visible in the filtered view
- Only appears when there are filtered events to operate on

## UI Components

### Filter Controls

Located in the Desktop View Controls panel:

- **Raspberry Filter section** with raspberry icon 🍇
- Two buttons: "All Events" and "Raspberry Only"
- Pink highlight for active raspberry filter

### Bulk Actions

Located below other filters when filtered events exist:

- **Enable All Filtered** button (green styling)
- **Disable All Filtered** button (red styling)
- Tooltips explain what each action does

## Technical Implementation

### Type Definitions

```typescript
export type RaspberryFilter = "all" | "raspberry-only";

export interface EventFilters {
  selectedDay?: number;
  viewMode: ViewMode;
  focusFilter: FocusFilter;
  raspberryFilter: RaspberryFilter;
  visibleDays?: boolean[];
}
```

### Filtering Logic

In `useEventData.ts`:

```typescript
// Apply raspberry filter
if (raspberryFilter === "raspberry-only") {
  filtered = filtered.filter((event) => event.raspberry === true);
}
```

### Toggle All Implementation

```typescript
const toggleAllFiltered = useCallback(
  async (enabled: boolean) => {
    // Get all unique events from the filtered view
    const filteredEventIds = new Set<string>();
    Object.values(filteredEvents).forEach((timeEvents) => {
      timeEvents.forEach((event) => {
        filteredEventIds.add(event.id);
      });
    });

    // Toggle each filtered event
    const togglePromises = Array.from(filteredEventIds).map((eventId) =>
      toggleEvent(eventId, enabled, undefined)
    );

    await Promise.all(togglePromises);
  },
  [filteredEvents, toggleEvent]
);
```

## Files Modified

1. **`src/components/schedule/shared/types.ts`**

   - Added `RaspberryFilter` type
   - Added `raspberryFilter` to event filters and schedule state
   - Added `toggleAllFiltered` function to EventDataHook

2. **`src/components/schedule/hooks/useScheduleState.ts`**

   - Added raspberry filter state management
   - Added `setRaspberryFilter` action

3. **`src/components/schedule/hooks/useEventData.ts`**

   - Added raspberry filtering logic
   - Implemented `toggleAllFiltered` function

4. **`src/components/schedule/desktop/ViewModeSelector.tsx`**

   - Added raspberry filter UI controls
   - Added bulk action buttons with proper styling

5. **`src/components/schedule/desktop/DesktopScheduleView.tsx`**

   - Connected raspberry filter props
   - Added filtered events detection for toggle controls

6. **`src/components/schedule/WeeklySchedule.tsx`**
   - Added raspberry filter to event filters passed to useEventData

## User Experience

### Filter Interaction

1. User clicks "Raspberry Only" to see only special events
2. Schedule immediately updates to show filtered results
3. Bulk action buttons appear when filters are active

### Bulk Actions

1. User applies filters (raspberry, focus, day selection)
2. Bulk action buttons become available
3. User can enable/disable all visible events with one click
4. All notifications are properly managed for toggled events

### Responsive Design

- Filter controls are desktop-only (mobile uses simplified interface)
- Raspberry icons use proper asset path for GitHub Pages compatibility
- Consistent styling with existing UI components

## Benefits

✅ **Quick filtering** - Find raspberry events instantly  
✅ **Bulk operations** - Enable/disable multiple events at once  
✅ **Smart integration** - Works with all existing filters  
✅ **Visual feedback** - Clear icons and color coding  
✅ **Efficient** - Memoized filtering and optimized re-renders  
✅ **Accessible** - Tooltips and clear labeling

## Usage Examples

### Filter for Raspberry Events Only

1. Go to Schedule page (desktop view)
2. In View Controls, find "Raspberry Filter" section
3. Click "Raspberry Only" button
4. Schedule shows only events with 🍇 raspberry rewards

### Bulk Enable Raspberry Events

1. Apply "Raspberry Only" filter
2. Bulk Actions section appears below filters
3. Click "Enable All Filtered" to activate all raspberry events
4. All visible raspberry events become enabled with notifications

### Combined Filtering

- Use "Raspberry Only" + "Inactive Only" to find disabled raspberry events
- Use "Single Day" + "Raspberry Only" to see today's raspberry events

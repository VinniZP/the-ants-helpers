import { useState, useEffect, useCallback } from "react";
import type { Building } from "../data/types";
import {
  validateBuildState,
  calculateBuildDependencies,
  type BuildRequirement,
} from "../services/dependencyCalculator";

// Extract BuildingId type from Building interface
type BuildingId = Building["id"];

// Build state interface
export interface BuildState {
  [buildingId: string]: number; // buildingId -> current level (0 if not built)
}

// Target building interface
export interface TargetBuilding {
  id: BuildingId;
  level: number;
}

// Minimal queue item for storage (no recursive dependencies)
interface MinimalQueueItem {
  id: BuildingId;
  level: number;
  step: number;
}

// Queue data interface for persistence
export interface QueueData {
  target: TargetBuilding;
  queue: MinimalQueueItem[]; // Store minimal data only
  calculatedAt: string;
  version: string;
}

const STORAGE_KEY = "ants-build-state";
const TARGET_STORAGE_KEY = "ants-target-building";
const QUEUE_STORAGE_KEY = "ants-build-queue";

/**
 * Queue persistence functions
 */
// Convert full BuildRequirement array to minimal storage format
function compressQueueForStorage(
  queue: BuildRequirement[]
): MinimalQueueItem[] {
  return queue.map((req) => ({
    id: req.id,
    level: req.level,
    step: req.step,
  }));
}

// Convert minimal storage format back to BuildRequirement array
function decompressQueueFromStorage(
  minimalQueue: MinimalQueueItem[],
  buildState: BuildState
): BuildRequirement[] {
  return minimalQueue.map((item) => ({
    id: item.id,
    level: item.level,
    step: item.step,
    isBuilt: (buildState[item.id] || 0) >= item.level,
    dependencies: [], // We don't need dependencies for display, just step order
  }));
}

function saveQueueToStorage(
  target: TargetBuilding,
  queue: BuildRequirement[]
): void {
  try {
    const queueData: QueueData = {
      target,
      queue: compressQueueForStorage(queue),
      calculatedAt: new Date().toISOString(),
      version: "1.0",
    };
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queueData));
  } catch (error) {
    console.error("Error saving queue to localStorage:", error);
    throw new Error("Failed to save build queue");
  }
}

function loadQueueFromStorage(
  buildState: BuildState
): BuildRequirement[] | null {
  try {
    const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as QueueData;

    // Validate queue data structure
    if (!parsed.target || !parsed.queue || !parsed.version) {
      console.warn("Invalid queue data structure, clearing stored queue");
      clearQueueFromStorage();
      return null;
    }

    // Decompress the minimal queue data back to full BuildRequirement format
    return decompressQueueFromStorage(parsed.queue, buildState);
  } catch (error) {
    console.error("Error loading queue from localStorage:", error);
    clearQueueFromStorage();
    return null;
  }
}

function getStoredQueueTarget(): TargetBuilding | null {
  try {
    const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as QueueData;
    return parsed.target || null;
  } catch (error) {
    return null;
  }
}

function clearQueueFromStorage(): void {
  try {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing queue from localStorage:", error);
  }
}

/**
 * Custom hook for managing building state with localStorage persistence
 */
// Base buildings that players start with
const BASE_BUILDINGS: BuildState = {
  // Core starting buildings
  queen: 1, // Queen level 1 as the base starting point
  plant_depot: 1,
  wet_soil_depot: 1,
  fungus_depot: 1,
  sand_depot: 1,
  meat_depot: 1,

  // Resource production buildings needed for depots
  plant_flora: 1,
  wet_soil_pile: 1,
  leafcutter: 1,
  sand_pile: 1,
  woodlouse_colony: 1,
};

export function useBuildState() {
  const [buildState, setBuildState] = useState<BuildState>(BASE_BUILDINGS);
  const [targetBuilding, setTargetBuilding] = useState<TargetBuilding | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Queue-related state
  const [buildQueue, setBuildQueue] = useState<BuildRequirement[] | null>(null);
  const [isCalculatingQueue, setIsCalculatingQueue] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      // Load build state
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as BuildState;

        // Ensure base buildings are always present and validate the loaded state
        const stateWithBaseBuildings = {
          ...BASE_BUILDINGS,
          ...parsed,
        };

        // Ensure base buildings are never below their minimum levels
        Object.keys(BASE_BUILDINGS).forEach((buildingId) => {
          const minLevel = BASE_BUILDINGS[buildingId];
          stateWithBaseBuildings[buildingId] = Math.max(
            minLevel,
            parsed[buildingId] || 0
          );
        });
        const validation = validateBuildState(stateWithBaseBuildings);
        if (validation.isValid) {
          setBuildState(stateWithBaseBuildings);
        } else {
          console.warn(
            "Invalid build state loaded from localStorage:",
            validation.errors
          );
          setError("Some saved building data was invalid and has been reset.");
          // Keep base buildings as minimum state if invalid
          setBuildState(BASE_BUILDINGS);
        }
      }

      // Load target building
      const savedTarget = localStorage.getItem(TARGET_STORAGE_KEY);
      if (savedTarget) {
        const parsed = JSON.parse(savedTarget) as TargetBuilding;
        setTargetBuilding(parsed);
      }

      // Load and validate build queue
      const stateToUse = saved
        ? { ...BASE_BUILDINGS, ...JSON.parse(saved) }
        : BASE_BUILDINGS;

      const savedQueue = loadQueueFromStorage(stateToUse);
      const storedQueueTarget = getStoredQueueTarget();

      if (savedQueue && storedQueueTarget) {
        // Check if saved queue matches current target
        if (savedTarget) {
          const currentTarget = JSON.parse(savedTarget) as TargetBuilding;
          if (
            storedQueueTarget.id === currentTarget.id &&
            storedQueueTarget.level === currentTarget.level
          ) {
            setBuildQueue(savedQueue);
          } else {
            // Target mismatch, clear old queue
            clearQueueFromStorage();
          }
        } else {
          // No target but queue exists, clear queue
          clearQueueFromStorage();
        }
      }
    } catch (error) {
      console.error("Error loading state from localStorage:", error);
      setError("Failed to load saved progress.");
      setBuildState(BASE_BUILDINGS);
      setTargetBuilding(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(buildState));
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error("Error saving build state to localStorage:", error);
        setError("Failed to save building progress.");
      }
    }
  }, [buildState, isLoading]);

  // Save target building to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        if (targetBuilding) {
          localStorage.setItem(
            TARGET_STORAGE_KEY,
            JSON.stringify(targetBuilding)
          );
        } else {
          localStorage.removeItem(TARGET_STORAGE_KEY);
        }
        setError(null);
      } catch (error) {
        console.error("Error saving target building to localStorage:", error);
        setError("Failed to save target selection.");
      }
    }
  }, [targetBuilding, isLoading]);

  // Set building level
  const setBuildingLevel = useCallback(
    (buildingId: BuildingId, level: number) => {
      setBuildState((prev) => {
        const newState = { ...prev };

        if (level <= 0) {
          // Remove building if level is 0 or negative
          delete newState[buildingId];
        } else {
          newState[buildingId] = level;
        }

        return newState;
      });
    },
    []
  );

  // Get building level
  const getBuildingLevel = useCallback(
    (buildingId: BuildingId): number => {
      return buildState[buildingId] || 0;
    },
    [buildState]
  );

  // Check if building is built to a specific level
  const isBuildingBuilt = useCallback(
    (buildingId: BuildingId, level: number): boolean => {
      return (buildState[buildingId] || 0) >= level;
    },
    [buildState]
  );

  // Build a building (increment level or set to specific level)
  const buildBuilding = useCallback(
    (buildingId: BuildingId, targetLevel: number = 1) => {
      setBuildState((prev) => ({
        ...prev,
        [buildingId]: Math.max(prev[buildingId] || 0, targetLevel),
      }));
    },
    []
  );

  // Unbuild a building (set to specific level or decrement)
  const unbuildBuilding = useCallback(
    (buildingId: BuildingId, targetLevel: number = 0) => {
      setBuildState((prev) => {
        const newState = { ...prev };

        if (targetLevel <= 0) {
          delete newState[buildingId];
        } else {
          newState[buildingId] = targetLevel;
        }

        return newState;
      });
    },
    []
  );

  // Reset all buildings (but keep base buildings at level 1)
  const resetAllBuildings = useCallback(() => {
    setBuildState(BASE_BUILDINGS);
  }, []);

  // Set target building
  const setTarget = useCallback((building: TargetBuilding | null) => {
    setTargetBuilding(building);
  }, []);

  // Calculate and store build queue
  const calculateAndStoreQueue = useCallback(
    async (buildingId: BuildingId, level: number) => {
      setIsCalculatingQueue(true);
      setQueueError(null);

      try {
        const dependencies = calculateBuildDependencies(
          buildingId,
          level,
          buildState
        );

        setBuildQueue(dependencies);
        setTargetBuilding({ id: buildingId, level });
        saveQueueToStorage({ id: buildingId, level }, dependencies);
      } catch (error) {
        console.error("Error calculating build queue:", error);
        setQueueError("Failed to calculate build queue");
      } finally {
        setIsCalculatingQueue(false);
      }
    },
    [buildState]
  );

  // Clear build queue
  const clearBuildQueue = useCallback(() => {
    setBuildQueue(null);
    clearQueueFromStorage();
  }, []);

  return {
    // State
    buildState,
    targetBuilding,
    isLoading,
    error,

    // Queue state
    buildQueue,
    isCalculatingQueue,
    queueError,

    // Building operations
    setBuildingLevel,
    getBuildingLevel,
    isBuildingBuilt,
    buildBuilding,
    unbuildBuilding,

    // Bulk operations
    resetAllBuildings,

    // Target operations
    setTarget,

    // Queue operations
    calculateAndStoreQueue,
    clearBuildQueue,
  };
}

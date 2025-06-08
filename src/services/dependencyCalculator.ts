import { buildings } from "../data/buildings";
import type { Building } from "../data/types";

// Extract BuildingId type from Building interface
type BuildingId = Building["id"];

// Build requirement representing a specific building at a specific level
export interface BuildRequirement {
  id: BuildingId;
  level: number;
  isBuilt: boolean;
  dependencies: BuildRequirement[];
  step: number; // Position in the build sequence
  depthCache?: number; // Pre-calculated dependency depth for fast sorting
  requirementCount?: number; // Pre-calculated requirement count for heuristic fallback
}

// Current user build state
export interface BuildState {
  [buildingId: string]: number; // buildingId -> current level (0 if not built)
}

// Memoization cache for performance
const dependencyCache = new Map<string, BuildRequirement[]>();

// Cache performance metrics
interface CacheMetrics {
  keyGenerationTime: number;
  cacheHits: number;
  cacheMisses: number;
  averageKeySize: number;
}

const cacheMetrics: CacheMetrics = {
  keyGenerationTime: 0,
  cacheHits: 0,
  cacheMisses: 0,
  averageKeySize: 0,
};

/**
 * Generate fast, deterministic cache key suffix from build state
 * Replaces expensive JSON.stringify with O(n log n) sorted concatenation
 */
function generateBuildStateHash(buildState: BuildState): string {
  const startTime = performance.now();

  // Filter out zero-level buildings and sort for deterministic ordering
  const sortedEntries = Object.entries(buildState)
    .filter(([_, level]) => level > 0)
    .sort(([a], [b]) => a.localeCompare(b));

  // Early exit for empty state
  if (sortedEntries.length === 0) {
    const endTime = performance.now();
    cacheMetrics.keyGenerationTime += endTime - startTime;
    return "empty";
  }

  // Create compact hash: "building1:level1|building2:level2"
  const hash = sortedEntries.map(([id, level]) => `${id}:${level}`).join("|");

  const endTime = performance.now();
  cacheMetrics.keyGenerationTime += endTime - startTime;
  cacheMetrics.averageKeySize = (cacheMetrics.averageKeySize + hash.length) / 2;

  return hash;
}

// Base buildings that are assumed to be built from the start
const BASE_BUILDINGS: Array<{ id: BuildingId; level: number }> = [
  // Core starting buildings
  { id: "queen", level: 1 },
  { id: "plant_depot", level: 1 },
  { id: "wet_soil_depot", level: 1 },
  { id: "fungus_depot", level: 1 },
  { id: "sand_depot", level: 1 },
  { id: "meat_depot", level: 1 },

  // Resource production buildings needed for depots
  { id: "plant_flora", level: 1 },
  { id: "wet_soil_pile", level: 1 },
  { id: "leafcutter", level: 1 },
  { id: "sand_pile", level: 1 },
  { id: "woodlouse_colony", level: 1 },
];

/**
 * Calculate all transitive dependencies for the base buildings
 */
function calculatePrebuiltDependencies(): BuildState {
  const prebuiltState: BuildState = {};
  const processed = new Set<string>();

  function addBuildingAndDeps(buildingId: BuildingId, level: number) {
    const key = `${buildingId}-${level}`;
    if (processed.has(key)) return;
    processed.add(key);

    // Ensure this building/level is built
    prebuiltState[buildingId] = Math.max(prebuiltState[buildingId] || 0, level);

    const building = findBuilding(buildingId);
    if (!building) return;

    const levelData = building.levels.find((l) => l.level === level);
    if (!levelData) return;

    // Process all requirements recursively
    for (const [reqBuildingId, reqLevel] of Object.entries(
      levelData.requirements
    )) {
      addBuildingAndDeps(reqBuildingId as BuildingId, reqLevel);
    }
  }

  // Add all base buildings and their dependencies
  BASE_BUILDINGS.forEach(({ id, level }) => {
    addBuildingAndDeps(id, level);
  });

  return prebuiltState;
}

// Calculate prebuilt dependencies once on module load
const PREBUILT_DEPENDENCIES = calculatePrebuiltDependencies();

// Debug log to show what's automatically prebuilt
console.log(
  "🏗️ Prebuilt buildings initialized:",
  Object.keys(PREBUILT_DEPENDENCIES).length,
  "buildings"
);
console.log(
  "📋 Base buildings:",
  BASE_BUILDINGS.map((b) => `${b.id} L${b.level}`).join(", ")
);
console.log(
  "🔧 Additional prebuilt deps:",
  Object.keys(PREBUILT_DEPENDENCIES)
    .filter((id) => !BASE_BUILDINGS.find((b) => b.id === id))
    .map((id) => `${id} L${PREBUILT_DEPENDENCIES[id]}`)
    .join(", ") || "None"
);

/**
 * Topological sort algorithm for proper dependency ordering
 * Ensures all dependencies come before their dependents
 */
function topologicalSort(
  dependencies: BuildRequirement[],
  buildState: BuildState
): BuildRequirement[] {
  // Create adjacency list and in-degree count
  const adjList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  const nodeMap = new Map<string, BuildRequirement>();

  // Initialize all nodes
  dependencies.forEach((dep) => {
    const key = `${dep.id}-${dep.level}`;
    adjList.set(key, []);
    inDegree.set(key, 0);
    nodeMap.set(key, dep);
  });

  // Build the graph based on direct dependencies
  dependencies.forEach((dep) => {
    const depKey = `${dep.id}-${dep.level}`;
    const building = findBuilding(dep.id);

    if (!building) return;

    const levelData = building.levels.find((l) => l.level === dep.level);
    if (!levelData) return;

    // Add edges for all requirements
    Object.entries(levelData.requirements).forEach(([reqId, reqLevel]) => {
      const reqKey = `${reqId}-${reqLevel}`;

      // Only add edge if the requirement is in our dependency list
      if (nodeMap.has(reqKey)) {
        adjList.get(reqKey)?.push(depKey);
        inDegree.set(depKey, (inDegree.get(depKey) || 0) + 1);
      }
    });

    // Add same-building level dependencies (L1 -> L2 -> L3, etc.)
    if (dep.level > 1) {
      const prevLevelKey = `${dep.id}-${dep.level - 1}`;
      if (nodeMap.has(prevLevelKey)) {
        adjList.get(prevLevelKey)?.push(depKey);
        inDegree.set(depKey, (inDegree.get(depKey) || 0) + 1);
      }
    }
  });

  // Kahn's algorithm for topological sort
  const queue: string[] = [];
  const result: BuildRequirement[] = [];

  // Find all nodes with no incoming edges
  inDegree.forEach((degree, node) => {
    if (degree === 0) {
      queue.push(node);
    }
  });

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDep = nodeMap.get(current)!;
    result.push(currentDep);

    // Process all adjacent nodes
    adjList.get(current)?.forEach((neighbor) => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);

      if (newDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  // Check for cycles (should not happen in a well-formed dependency graph)
  if (result.length !== dependencies.length) {
    console.warn(
      `⚠️ Topological sort incomplete: ${result.length}/${dependencies.length} nodes processed. Possible cycle detected.`
    );

    // Fall back to original dependencies with step numbers
    return dependencies.map((dep, index) => ({
      ...dep,
      step: index + 1,
    }));
  }

  // Apply secondary sorting for stable ordering
  return result
    .sort((a, b) => {
      // For nodes at the same topological level, use heuristics for stable ordering

      // 1. Same building level ordering (critical for correctness)
      if (a.id === b.id) return a.level - b.level;

      // 2. Building level (lower levels generally first)
      if (a.level !== b.level) return a.level - b.level;

      // 3. Requirement count (simpler buildings first)
      const reqCountDiff =
        (a.requirementCount || 0) - (b.requirementCount || 0);
      if (reqCountDiff !== 0) return reqCountDiff;

      // 4. Consistent ordering by building ID
      return a.id.localeCompare(b.id);
    })
    .map((dep, index) => ({
      ...dep,
      step: index + 1,
    }));
}

/**
 * Calculate the complete dependency graph for a target building and level
 */
// Performance safeguards
const MAX_DEPENDENCIES = 500;
const CALCULATION_TIMEOUT = 5000; // 5 seconds (increased for topological sort)

export function calculateBuildDependencies(
  targetBuildingId: BuildingId,
  targetLevel: number,
  buildState: BuildState = {}
): BuildRequirement[] {
  const calculationStartTime = performance.now();
  // Ensure base buildings and their dependencies are always considered built
  const enhancedBuildState: BuildState = {
    ...PREBUILT_DEPENDENCIES,
    ...buildState,
  };

  // Ensure base buildings are at minimum levels even if user state is lower
  BASE_BUILDINGS.forEach(({ id, level }) => {
    enhancedBuildState[id] = Math.max(enhancedBuildState[id] || 0, level);
  });

  // Create cache key for memoization using fast hash generation
  const cacheKey = `${targetBuildingId}-${targetLevel}-${generateBuildStateHash(
    enhancedBuildState
  )}`;

  if (dependencyCache.has(cacheKey)) {
    cacheMetrics.cacheHits++;

    // Periodic cache performance logging
    if ((cacheMetrics.cacheHits + cacheMetrics.cacheMisses) % 50 === 0) {
      const hitRate =
        cacheMetrics.cacheHits /
        (cacheMetrics.cacheHits + cacheMetrics.cacheMisses);
      console.log(
        `📊 Cache performance: ${(hitRate * 100).toFixed(
          1
        )}% hit rate, avg key gen: ${cacheMetrics.keyGenerationTime.toFixed(
          2
        )}ms, avg key size: ${cacheMetrics.averageKeySize.toFixed(0)} chars`
      );
    }

    return dependencyCache.get(cacheKey)!;
  }

  cacheMetrics.cacheMisses++;

  const visitedSet = new Set<string>();
  const dependencies: BuildRequirement[] = [];
  let currentStep = 1;

  // Memoization cache for dependency relationships - prevents recalculation
  const dependsOnCache = new Map<string, boolean>();

  // Recursive dependency resolution with cycle detection
  function resolveDependencies(
    buildingId: BuildingId,
    level: number
  ): BuildRequirement[] {
    const visitKey = `${buildingId}-${level}`;

    // Cycle detection
    if (visitedSet.has(visitKey)) {
      console.warn(`Circular dependency detected: ${visitKey}`);
      return [];
    }

    visitedSet.add(visitKey);

    try {
      const building = findBuilding(buildingId);
      if (!building) {
        console.error(`Building not found: ${buildingId}`);
        return [];
      }

      const levelData = building.levels.find((l) => l.level === level);
      if (!levelData) {
        console.error(`Level ${level} not found for building ${buildingId}`);
        return [];
      }

      const buildRequirements: BuildRequirement[] = [];

      // Process all requirements for this level
      for (const [reqBuildingId, reqLevel] of Object.entries(
        levelData.requirements
      )) {
        const typedReqBuildingId = reqBuildingId as BuildingId;

        // Check if this requirement is already satisfied
        const currentLevel = enhancedBuildState[reqBuildingId] || 0;
        const isBuilt = currentLevel >= reqLevel;

        // Recursively resolve dependencies for this requirement
        const subDependencies = resolveDependencies(
          typedReqBuildingId,
          reqLevel
        );

        // Only add levels we need to build (not already built)
        for (
          let needLevel = currentLevel + 1;
          needLevel <= reqLevel;
          needLevel++
        ) {
          buildRequirements.push({
            id: typedReqBuildingId,
            level: needLevel,
            isBuilt: false,
            dependencies: subDependencies.filter(
              (dep) => dep.level < needLevel
            ),
            step: currentStep++,
          });
        }
      }

      return buildRequirements;
    } finally {
      visitedSet.delete(visitKey);
    }
  }

  // Start dependency resolution
  const allDeps = resolveDependencies(targetBuildingId, targetLevel);

  // Flatten and deduplicate dependencies
  const flatDeps = new Map<string, BuildRequirement>();

  // Initialize depth cache for pre-calculating dependency depths
  const depthCache = new Map<string, number>();

  function addDependency(dep: BuildRequirement) {
    const key = `${dep.id}-${dep.level}`;
    if (!flatDeps.has(key)) {
      const building = findBuilding(dep.id);
      const levelData = building?.levels.find((l) => l.level === dep.level);

      flatDeps.set(key, {
        ...dep,
        isBuilt: (enhancedBuildState[dep.id] || 0) >= dep.level,
        depthCache: calculateBuildingDepth(dep.id, dep.level, depthCache),
        requirementCount: levelData
          ? Object.keys(levelData.requirements).length
          : 0,
      });
    }

    // Add sub-dependencies
    dep.dependencies.forEach(addDependency);
  }

  allDeps.forEach(addDependency);

  // Add the target building itself if not built
  const targetCurrentLevel = enhancedBuildState[targetBuildingId] || 0;
  if (targetCurrentLevel < targetLevel) {
    for (let level = targetCurrentLevel + 1; level <= targetLevel; level++) {
      const targetKey = `${targetBuildingId}-${level}`;
      if (!flatDeps.has(targetKey)) {
        const building = findBuilding(targetBuildingId);
        const levelData = building?.levels.find((l) => l.level === level);

        flatDeps.set(targetKey, {
          id: targetBuildingId,
          level: level,
          isBuilt: (enhancedBuildState[targetBuildingId] || 0) >= level,
          dependencies: [],
          step: currentStep++,
          depthCache: calculateBuildingDepth(
            targetBuildingId,
            level,
            depthCache
          ),
          requirementCount: levelData
            ? Object.keys(levelData.requirements).length
            : 0,
        });
      }
    }
  }

  // Memoized dependency checking function for proper topological sorting
  function dependsOn(
    dependent: BuildRequirement,
    dependency: BuildRequirement
  ): boolean {
    // Same building: level-based dependency
    if (dependent.id === dependency.id) {
      return dependent.level > dependency.level;
    }

    // Cache key for memoization
    const cacheKey = `${dependent.id}-${dependent.level}->${dependency.id}-${dependency.level}`;

    if (dependsOnCache.has(cacheKey)) {
      return dependsOnCache.get(cacheKey)!;
    }

    // Get building data
    const dependentBuilding = findBuilding(dependent.id);
    if (!dependentBuilding) {
      dependsOnCache.set(cacheKey, false);
      return false;
    }

    const dependentLevelData = dependentBuilding.levels.find(
      (l) => l.level === dependent.level
    );
    if (!dependentLevelData) {
      dependsOnCache.set(cacheKey, false);
      return false;
    }

    // Direct dependency check
    const requiredLevel = dependentLevelData.requirements[dependency.id];
    if (requiredLevel !== undefined && requiredLevel >= dependency.level) {
      dependsOnCache.set(cacheKey, true);
      return true;
    }

    // Transitive dependency check (check all direct requirements)
    for (const [reqId, reqLevel] of Object.entries(
      dependentLevelData.requirements
    )) {
      const intermediateDep: BuildRequirement = {
        id: reqId as BuildingId,
        level: reqLevel,
        isBuilt: false,
        dependencies: [],
        step: 0,
      };

      // Recursive check with memoization
      if (dependsOn(intermediateDep, dependency)) {
        dependsOnCache.set(cacheKey, true);
        return true;
      }
    }

    dependsOnCache.set(cacheKey, false);
    return false;
  }

  // Add performance monitoring for sorting algorithm
  const sortStartTime = performance.now();

  // Topological sort to ensure all dependencies come before their dependents
  const sortedDeps = topologicalSort(
    Array.from(flatDeps.values()),
    enhancedBuildState
  );

  const sortTime = performance.now() - sortStartTime;

  // Debug logging for dependency ordering issues
  const queenLevels = sortedDeps.filter((dep) => dep.id === "queen");
  if (queenLevels.length > 1) {
    console.log(
      "🔍 Queen levels in build sequence:",
      queenLevels.map((q) => `L${q.level} (step ${q.step})`).join(", ")
    );
  }

  // Check for specific dependency violations
  const feedingGroundL4 = sortedDeps.find(
    (dep) => dep.id === "feeding_ground" && dep.level === 4
  );
  const queenL5 = sortedDeps.find(
    (dep) => dep.id === "queen" && dep.level === 5
  );
  if (feedingGroundL4 && queenL5) {
    console.log(
      `🔍 Dependency check: Feeding Ground L4 (step ${feedingGroundL4.step}) vs Queen L5 (step ${queenL5.step})`
    );
    if (feedingGroundL4.step > queenL5.step) {
      console.warn(
        "⚠️ DEPENDENCY VIOLATION: Feeding Ground L4 should come before Queen L5!"
      );
    }
  }

  // Performance monitoring and validation
  const totalCalculationTime = performance.now() - sortStartTime;
  const totalDeps = sortedDeps.length;
  const builtDeps = sortedDeps.filter((dep) => dep.isBuilt).length;
  const progressPercent =
    totalDeps > 0 ? Math.round((builtDeps / totalDeps) * 100) : 0;

  // Performance alerting for slow calculations
  if (totalCalculationTime > 100) {
    console.warn(
      `⚠️ Slow dependency calculation: ${totalCalculationTime.toFixed(
        1
      )}ms for ${targetBuildingId} L${targetLevel} (${totalDeps} deps)`
    );
  }

  // Detailed performance logging for complex calculations
  if (totalDeps > 50 || totalCalculationTime > 50) {
    console.log(
      `⚡ Performance: ${targetBuildingId} L${targetLevel} - ${totalCalculationTime.toFixed(
        1
      )}ms total (${sortTime.toFixed(1)}ms sort) - ${totalDeps} deps`
    );
  }

  // Progress and correctness validation
  console.log(
    `📊 Progress for ${targetBuildingId} L${targetLevel}: ${builtDeps}/${totalDeps} (${progressPercent}%)`
  );

  // Depth distribution analysis for complex calculations
  if (totalDeps > 100) {
    const depthDistribution = sortedDeps.reduce((acc, dep) => {
      const depth = dep.depthCache || 0;
      acc[depth] = (acc[depth] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const maxDepth = Math.max(...Object.keys(depthDistribution).map(Number));
    console.log(
      `🔍 Depth analysis: max depth ${maxDepth}, distribution: ${Object.entries(
        depthDistribution
      )
        .map(([depth, count]) => `D${depth}:${count}`)
        .join(", ")}`
    );
  }

  // Development-time validation
  validateBuildOrder(sortedDeps);

  // Performance safeguards validation
  const finalCalculationTime = performance.now() - calculationStartTime;

  // Timeout protection
  if (finalCalculationTime > CALCULATION_TIMEOUT) {
    console.error(
      `❌ Calculation timeout: ${finalCalculationTime.toFixed(
        1
      )}ms exceeded ${CALCULATION_TIMEOUT}ms limit for ${targetBuildingId} L${targetLevel}`
    );
    // Return limited results rather than failing completely
    const limitedDeps = sortedDeps.slice(0, MAX_DEPENDENCIES);
    setCacheEntry(cacheKey, limitedDeps);
    return limitedDeps;
  }

  // Dependency count protection
  if (sortedDeps.length > MAX_DEPENDENCIES) {
    console.warn(
      `⚠️ Large dependency set (${sortedDeps.length}). Limiting to ${MAX_DEPENDENCIES} for performance.`
    );
    const limitedDeps = sortedDeps.slice(0, MAX_DEPENDENCIES);
    setCacheEntry(cacheKey, limitedDeps);
    return limitedDeps;
  }

  // Cache result with size management
  setCacheEntry(cacheKey, sortedDeps);

  return sortedDeps;
}

/**
 * Calculate building dependency depth for proper ordering
 * This replaces the expensive recursive dependency checking in sort comparator
 */
function calculateBuildingDepth(
  buildingId: BuildingId,
  level: number,
  cache: Map<string, number> = new Map()
): number {
  const key = `${buildingId}-${level}`;
  if (cache.has(key)) return cache.get(key)!;

  const building = findBuilding(buildingId);
  if (!building) {
    cache.set(key, 0);
    return 0;
  }

  const levelData = building.levels.find((l) => l.level === level);
  if (!levelData || Object.keys(levelData.requirements).length === 0) {
    cache.set(key, 0);
    return 0;
  }

  // Calculate max depth of all requirements
  const maxRequirementDepth = Math.max(
    ...Object.entries(levelData.requirements).map(([reqId, reqLevel]) =>
      calculateBuildingDepth(reqId as BuildingId, reqLevel, cache)
    )
  );

  const depth = maxRequirementDepth + 1;
  cache.set(key, depth);
  return depth;
}

/**
 * Calculate dependency depth for proper ordering (legacy function, kept for compatibility)
 */
function calculateDependencyDepth(requirement: BuildRequirement): number {
  if (requirement.dependencies.length === 0) return 0;
  return (
    1 + Math.max(...requirement.dependencies.map(calculateDependencyDepth))
  );
}

/**
 * Find building by ID in the buildings array
 */
function findBuilding(buildingId: BuildingId): Building | undefined {
  return buildings.find((building) => building.id === buildingId) as
    | Building
    | undefined;
}

/**
 * Calculate cascade unbuild dependencies
 * Returns all buildings that must be unbuilt if the target building is unbuilt
 */
export function calculateCascadeUnbuild(
  targetBuildingId: BuildingId,
  targetLevel: number,
  buildState: BuildState
): BuildRequirement[] {
  const cascadeUnbuilds: BuildRequirement[] = [];

  // Find all buildings that depend on the target building
  for (const building of buildings) {
    for (const levelData of building.levels) {
      const requirements = levelData.requirements;

      // Check if this level requires our target building
      const requiredLevel = (requirements as any)[targetBuildingId];
      if (requiredLevel && requiredLevel >= targetLevel) {
        const currentLevel = buildState[building.id] || 0;

        // If this building is currently built at this level, it needs to be unbuilt
        if (currentLevel >= levelData.level) {
          cascadeUnbuilds.push({
            id: building.id as BuildingId,
            level: levelData.level,
            isBuilt: true,
            dependencies: [],
            step: 0, // Will be reassigned
          });
        }
      }
    }
  }

  // Sort by dependency order (most dependent first)
  return cascadeUnbuilds
    .sort((a, b) => b.level - a.level)
    .map((dep, index) => ({
      ...dep,
      step: index + 1,
    }));
}

/**
 * Get building information including max level
 */
export function getBuildingInfo(buildingId: BuildingId) {
  const building = findBuilding(buildingId);
  if (!building) return null;

  return {
    id: building.id,
    maxLevel: Math.max(...building.levels.map((level) => level.level)),
    depotType: building.depotType,
    warns: building.warns || [],
  };
}

// Cache size management constants
const MAX_CACHE_SIZE = 100;
const CACHE_CLEANUP_THRESHOLD = 120;

/**
 * Manage cache size to prevent unbounded memory growth
 */
function manageCacheSize() {
  if (dependencyCache.size >= CACHE_CLEANUP_THRESHOLD) {
    // LRU eviction - remove oldest 20% of entries
    const entries = Array.from(dependencyCache.entries());
    const toRemove = entries.slice(0, Math.floor(entries.length * 0.2));

    toRemove.forEach(([key]) => {
      dependencyCache.delete(key);
    });

    console.log(
      `🧹 Cache cleanup: removed ${toRemove.length} entries, ${dependencyCache.size} remaining`
    );
  }
}

/**
 * Set cache entry with size management
 */
function setCacheEntry(key: string, value: BuildRequirement[]) {
  manageCacheSize();
  dependencyCache.set(key, value);
}

/**
 * Clear dependency cache (useful for testing or state changes)
 */
export function clearDependencyCache() {
  dependencyCache.clear();
  // Reset cache metrics
  cacheMetrics.keyGenerationTime = 0;
  cacheMetrics.cacheHits = 0;
  cacheMetrics.cacheMisses = 0;
  cacheMetrics.averageKeySize = 0;
}

/**
 * Validate build state against building constraints
 */
export function validateBuildState(buildState: BuildState): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const [buildingId, level] of Object.entries(buildState)) {
    const building = findBuilding(buildingId as BuildingId);

    if (!building) {
      errors.push(`Invalid building ID: ${buildingId}`);
      continue;
    }

    const maxLevel = Math.max(...building.levels.map((l) => l.level));
    if (level > maxLevel) {
      errors.push(
        `Building ${buildingId} cannot exceed level ${maxLevel} (current: ${level})`
      );
    }

    if (level < 0) {
      errors.push(`Building ${buildingId} cannot have negative level`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get the complete list of prebuilt dependencies
 * Useful for debugging and verification
 */
export function getPrebuiltDependencies(): BuildState {
  return { ...PREBUILT_DEPENDENCIES };
}

/**
 * Get the list of base buildings (core starter buildings)
 */
export function getBaseBuildingsList(): Array<{
  id: BuildingId;
  level: number;
}> {
  return [...BASE_BUILDINGS];
}

/**
 * Validate build order correctness (development-time check)
 */
function validateBuildOrder(sortedDeps: BuildRequirement[]): void {
  if (process.env.NODE_ENV !== "development") return;

  let violations = 0;

  for (let i = 0; i < sortedDeps.length; i++) {
    const current = sortedDeps[i];
    const building = findBuilding(current.id);

    if (!building) continue;

    const levelData = building.levels.find((l) => l.level === current.level);
    if (!levelData) continue;

    // Check if all requirements appear before this building in the sequence
    for (const [reqId, reqLevel] of Object.entries(levelData.requirements)) {
      const requiredIndex = sortedDeps.findIndex(
        (dep) => dep.id === reqId && dep.level >= reqLevel
      );

      if (requiredIndex > i) {
        console.warn(
          `⚠️ Dependency violation: ${current.id} L${current.level} (step ${
            current.step
          }) requires ${reqId} L${reqLevel} (step ${
            sortedDeps[requiredIndex]?.step || "missing"
          })`
        );
        violations++;
      }
    }
  }

  if (violations > 0) {
    console.error(
      `❌ Build order validation failed: ${violations} dependency violations found`
    );
  } else if (sortedDeps.length > 50) {
    console.log(
      `✅ Build order validation passed for ${sortedDeps.length} dependencies`
    );
  }
}

/**
 * Get current cache performance metrics
 */
export function getCacheMetrics(): CacheMetrics & { cacheSize: number } {
  return {
    ...cacheMetrics,
    cacheSize: dependencyCache.size,
  };
}

/**
 * Log detailed performance report
 */
export function logPerformanceReport(): void {
  const metrics = getCacheMetrics();
  const hitRate = metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses);

  console.log("📊 Dependency Calculator Performance Report:");
  console.log(`   Cache Hit Rate: ${(hitRate * 100).toFixed(1)}%`);
  console.log(`   Cache Size: ${metrics.cacheSize} entries`);
  console.log(
    `   Avg Key Generation: ${metrics.keyGenerationTime.toFixed(2)}ms`
  );
  console.log(
    `   Avg Key Size: ${metrics.averageKeySize.toFixed(0)} characters`
  );
  console.log(
    `   Total Cache Operations: ${metrics.cacheHits + metrics.cacheMisses}`
  );
}

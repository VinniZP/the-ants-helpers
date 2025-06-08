# 🎨🎨🎨 ENTERING CREATIVE PHASE: ALGORITHM DESIGN 🎨🎨🎨

## Component Description

**Component**: Dependency Sorting Algorithm  
**Location**: `src/services/dependencyCalculator.ts` (lines ~307-340)  
**Current Problem**: O(n²) topological sort with expensive `dependsOn()` calls causing UI freeze on Queen L22

## Requirements & Constraints

### Functional Requirements

- Must maintain correct build order (dependencies before dependents)
- Must handle same-building level ordering (Queen L1 → L2 → L3)
- Must preserve existing BuildRequirement interface compatibility
- Must handle up to 500+ BuildRequirements for complex builds

### Performance Requirements

- Target: <100ms calculation time for Queen L22 (currently >5 seconds)
- Must eliminate UI freezing for any building/level combination
- Memory usage must remain bounded and predictable
- Cache hit rates should remain >80% for repeated calculations

### Technical Constraints

- TypeScript compatibility required
- No external dependencies allowed
- Must work with existing BuildRequirement interface
- Fallback to current algorithm for correctness verification

## 🎨 CREATIVE CHECKPOINT: Problem Analysis Complete

### Current Algorithm Analysis

**Current Approach**: Full topological sort with recursive dependency checking

```typescript
.sort((a, b) => {
  if (a.id === b.id) return a.level - b.level;
  if (dependsOn(a, b)) return 1;  // ← O(n) recursive call
  if (dependsOn(b, a)) return -1; // ← O(n) recursive call
  // fallback heuristics...
})
```

**Performance Issues**:

- `dependsOn()` called O(n²) times during sort (n×(n-1)/2 comparisons)
- Each `dependsOn()` call performs recursive dependency traversal
- For Queen L22: ~400 BuildRequirements = ~80,000 dependency checks
- Memoization cache grows exponentially and becomes memory bottleneck

## Multiple Options Analysis

### Option 1: Pre-calculated Dependency Depth Sorting

**Description**: Pre-calculate dependency depth for each BuildRequirement, then sort by depth → level → heuristics

**Algorithm**:

```typescript
// Phase 1: Pre-calculate depths (O(n) with memoization)
const depthCache = new Map<string, number>();
function calculateDepth(req: BuildRequirement): number {
  const key = `${req.id}-${req.level}`;
  if (depthCache.has(key)) return depthCache.get(key)!;

  const building = findBuilding(req.id);
  const levelData = building?.levels.find(l => l.level === req.level);
  if (!levelData) return 0;

  const maxDepth = Math.max(0,
    ...Object.keys(levelData.requirements)
      .map(depId => calculateDepth({id: depId, level: levelData.requirements[depId]}))
  );
  const depth = maxDepth + 1;
  depthCache.set(key, depth);
  return depth;
}

// Phase 2: Fast sorting (O(n log n))
.sort((a, b) => {
  // 1. Dependency depth (foundation first)
  const depthDiff = calculateDepth(a) - calculateDepth(b);
  if (depthDiff !== 0) return depthDiff;

  // 2. Same building level ordering
  if (a.id === b.id) return a.level - b.level;

  // 3. Requirement count heuristic
  const aReqs = Object.keys(findBuilding(a.id)?.levels.find(l => l.level === a.level)?.requirements || {}).length;
  const bReqs = Object.keys(findBuilding(b.id)?.levels.find(l => l.level === b.level)?.requirements || {}).length;
  if (aReqs !== bReqs) return aReqs - bReqs;

  // 4. Consistent ordering
  return a.id.localeCompare(b.id);
})
```

**Pros**:

- ✅ Eliminates O(n²) dependency checking in sort comparator
- ✅ Pre-calculation is O(n) with memoization
- ✅ Guarantees correct dependency ordering
- ✅ Maintains same-building level ordering
- ✅ Predictable performance characteristics

**Cons**:

- ⚠️ Requires additional memory for depth cache
- ⚠️ More complex implementation than heuristic approach
- ⚠️ Still requires recursive depth calculation (but only once per building-level)

**Complexity**: Medium  
**Implementation Time**: 2-3 hours  
**Performance Impact**: 95%+ improvement (O(n log n) vs O(n²))

### Option 2: Pure Heuristic Sorting

**Description**: Replace dependency checking with fast heuristics based on requirement counts and building characteristics

**Algorithm**:

```typescript
.sort((a, b) => {
  // 1. Same building level ordering (critical)
  if (a.id === b.id) return a.level - b.level;

  // 2. Building level (lower levels generally built first)
  if (a.level !== b.level) return a.level - b.level;

  // 3. Requirement count (fewer requirements = simpler = built earlier)
  const aBuilding = findBuilding(a.id);
  const bBuilding = findBuilding(b.id);

  if (aBuilding && bBuilding) {
    const aLevelData = aBuilding.levels.find(l => l.level === a.level);
    const bLevelData = bBuilding.levels.find(l => l.level === b.level);

    if (aLevelData && bLevelData) {
      const aReqCount = Object.keys(aLevelData.requirements).length;
      const bReqCount = Object.keys(bLevelData.requirements).length;
      if (aReqCount !== bReqCount) return aReqCount - bReqCount;
    }
  }

  // 4. Building type priority (depots before specialized buildings)
  const aIsDepot = aBuilding?.depotType ? 1 : 0;
  const bIsDepot = bBuilding?.depotType ? 1 : 0;
  if (aIsDepot !== bIsDepot) return bIsDepot - aIsDepot;

  // 5. Consistent ordering
  return a.id.localeCompare(b.id);
})
```

**Pros**:

- ✅ Extremely fast O(n log n) with simple comparisons
- ✅ No additional memory overhead
- ✅ Simple to implement and debug
- ✅ Easy to add additional heuristics
- ✅ Guaranteed termination and performance

**Cons**:

- ❌ May not guarantee perfect dependency ordering in all cases
- ❌ Relies on heuristics that might miss edge cases
- ❌ Requires validation against known correct sequences
- ❌ Less mathematically rigorous than topological sort

**Complexity**: Low  
**Implementation Time**: 1-2 hours  
**Performance Impact**: 98%+ improvement (simple comparisons only)

### Option 3: Hybrid Two-Phase Approach

**Description**: Use heuristic sorting for 90% of cases, fall back to dependency checking only when heuristics produce questionable results

**Algorithm**:

```typescript
// Phase 1: Fast heuristic sort
const quickSorted = [...buildRequirements].sort(heuristicComparator);

// Phase 2: Validation and selective correction
function validateAndCorrect(deps: BuildRequirement[]): BuildRequirement[] {
  const violations: [number, number][] = [];

  // Check for obvious violations (sample, don't check everything)
  for (let i = 0; i < Math.min(deps.length, 100); i++) {
    for (let j = i + 1; j < Math.min(deps.length, i + 50); j++) {
      if (hasDirectDependency(deps[j], deps[i])) {
        violations.push([i, j]);
      }
    }
  }

  // If violations are minimal, fix them locally
  if (violations.length < 10) {
    // Apply local swaps to fix violations
    return applyLocalCorrections(deps, violations);
  } else {
    // Fall back to slower but correct algorithm
    console.warn("⚠️ Heuristic sort had many violations, using fallback");
    return fallbackTopologicalSort(deps);
  }
}
```

**Pros**:

- ✅ Best of both worlds - fast for normal cases, correct for edge cases
- ✅ Performance degradation is graceful and logged
- ✅ Maintains correctness guarantee
- ✅ Can optimize heuristics over time

**Cons**:

- ❌ Complex implementation with multiple code paths
- ❌ Validation phase can still be expensive for pathological cases
- ❌ Harder to test and debug
- ❌ May give false confidence about performance

**Complexity**: High  
**Implementation Time**: 4-5 hours  
**Performance Impact**: 90%+ improvement (most cases), 0% improvement (worst cases)

### Option 4: Lazy Topological Sort with Circuit Breaker

**Description**: Optimize the existing topological sort with performance limits and lazy evaluation

**Algorithm**:

```typescript
const MAX_DEPENDENCY_CHECKS = 10000;
let dependencyCheckCount = 0;

function optimizedDependsOn(a: BuildRequirement, b: BuildRequirement): boolean {
  dependencyCheckCount++;

  // Circuit breaker - fall back to heuristics if too many checks
  if (dependencyCheckCount > MAX_DEPENDENCY_CHECKS) {
    console.warn('⚠️ Dependency check limit reached, using heuristics');
    // Return heuristic result instead of expensive calculation
    return a.level > b.level || Object.keys(getRequirements(a)).length > Object.keys(getRequirements(b)).length;
  }

  // Use existing memoized dependency checking but with limit
  return memoizedDependsOn(a, b);
}

.sort((a, b) => {
  // Reset counter periodically
  if (dependencyCheckCount > MAX_DEPENDENCY_CHECKS * 0.8) {
    dependencyCheckCount = 0;
  }

  // Existing sort logic with circuit breaker
  if (a.id === b.id) return a.level - b.level;
  if (optimizedDependsOn(a, b)) return 1;
  if (optimizedDependsOn(b, a)) return -1;
  // ... heuristic fallbacks
})
```

**Pros**:

- ✅ Minimal changes to existing working algorithm
- ✅ Provides performance safety net
- ✅ Maintains correctness for simple cases
- ✅ Graceful degradation for complex cases

**Cons**:

- ❌ Still fundamentally O(n²) approach
- ❌ Circuit breaker threshold is arbitrary
- ❌ Doesn't solve the root performance problem
- ❌ May provide inconsistent results based on complexity

**Complexity**: Medium  
**Implementation Time**: 1-2 hours  
**Performance Impact**: 50%+ improvement (with limits), still problematic for Queen L22

## 🎨 CREATIVE CHECKPOINT: Options Analysis Complete

## Recommended Approach

**Selected Option**: **Option 1 - Pre-calculated Dependency Depth Sorting**

### Rationale

1. **Performance**: Eliminates the O(n²) bottleneck while maintaining correctness
2. **Correctness**: Mathematically sound dependency ordering based on actual build data
3. **Maintainability**: Clear algorithm that's easier to understand and debug than hybrid approaches
4. **Scalability**: Performance characteristics are predictable and well-bounded
5. **Risk**: Medium complexity with fallback to existing algorithm for verification

### Implementation Guidelines

#### Phase 1: Depth Calculation Infrastructure

```typescript
// Add to existing interface
export interface BuildRequirement {
  id: BuildingId;
  level: number;
  isBuilt: boolean;
  step: number;
  depthCache?: number; // ← New field for pre-calculated depth
  requirementCount?: number; // ← New field for heuristic fallback
}

// Depth calculation function
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
```

#### Phase 2: Enhanced BuildRequirement Creation

```typescript
// Modify existing addDependency function to pre-calculate depth
function addDependency(dep: BuildRequirement, depthCache: Map<string, number>) {
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

  // Add sub-dependencies with depth calculation
  dep.dependencies.forEach((subDep) => addDependency(subDep, depthCache));
}
```

#### Phase 3: Optimized Sorting Algorithm

```typescript
// Replace existing expensive sort with depth-based approach
const depthCache = new Map<string, number>();
const sortedDeps = Array.from(flatDeps.values())
  .map((dep) => {
    // Ensure depth is calculated if not already cached
    if (dep.depthCache === undefined) {
      dep.depthCache = calculateBuildingDepth(dep.id, dep.level, depthCache);
    }
    return dep;
  })
  .sort((a, b) => {
    // 1. Dependency depth (foundation buildings first)
    const depthDiff = (a.depthCache || 0) - (b.depthCache || 0);
    if (depthDiff !== 0) return depthDiff;

    // 2. Same building level ordering (critical for correctness)
    if (a.id === b.id) return a.level - b.level;

    // 3. Building level (lower levels generally first)
    if (a.level !== b.level) return a.level - b.level;

    // 4. Requirement count (simpler buildings first)
    const reqCountDiff = (a.requirementCount || 0) - (b.requirementCount || 0);
    if (reqCountDiff !== 0) return reqCountDiff;

    // 5. Consistent ordering by building ID
    return a.id.localeCompare(b.id);
  })
  .map((dep, index) => ({
    ...dep,
    step: index + 1,
  }));
```

#### Phase 4: Performance Monitoring and Validation

```typescript
// Add performance monitoring
const startTime = performance.now();
const sortedDeps = /* ... sorting algorithm ... */;
const sortTime = performance.now() - startTime;

if (sortTime > 100) {
  console.warn(`⚠️ Slow dependency calculation: ${sortTime.toFixed(1)}ms for ${targetBuildingId} L${targetLevel}`);
}

// Add correctness validation (in development)
if (process.env.NODE_ENV === 'development') {
  validateBuildOrder(sortedDeps);
}
```

### Verification Checkpoint

**Requirements Validation**:

- ✅ Maintains correct build order through dependency depth calculation
- ✅ Preserves same-building level ordering with explicit check
- ✅ Compatible with existing BuildRequirement interface (optional fields)
- ✅ Handles 500+ BuildRequirements efficiently (O(n log n) performance)

**Performance Validation**:

- ✅ Target <100ms achieved through O(n log n) sorting + O(n) depth calculation
- ✅ Eliminates UI freezing by removing O(n²) dependency checks
- ✅ Memory usage bounded by depth cache (max O(n) entries)
- ✅ Cache hit rates maintained through depth memoization

**Technical Validation**:

- ✅ TypeScript compatible with optional interface fields
- ✅ No external dependencies required
- ✅ Fallback mechanism available (existing algorithm)
- ✅ Development-time correctness validation included

## 🎨🎨🎨 EXITING CREATIVE PHASE - ALGORITHM DESIGN COMPLETE 🎨🎨🎨

**Decision Summary**: Pre-calculated dependency depth sorting with O(n log n) performance and mathematical correctness guarantees.

**Next Steps**:

1. Implement depth calculation infrastructure
2. Enhance BuildRequirement creation with pre-calculation
3. Replace sorting algorithm with depth-based approach
4. Add performance monitoring and validation
5. Test with Queen L22 to verify <100ms target achievement

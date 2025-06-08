# 🎨🎨🎨 ENTERING CREATIVE PHASE: ALGORITHM DESIGN 🎨🎨🎨

## Component: Dependency Graph Traversal & Build Sequence Optimization

**What is this component?** A sophisticated algorithm system that calculates optimal building dependency sequences, resolves circular dependencies, and provides efficient caching for performance with 56 buildings × 25 levels.

**What does it do?** Takes a target building + level as input and produces an optimized build sequence showing exactly which buildings must be constructed and in what order, while handling complex dependency chains and cascade unbuild scenarios.

## Requirements & Constraints

### Functional Requirements

- **Complete Dependency Resolution**: Calculate all required buildings for any target
- **Sequence Optimization**: Provide optimal build order considering dependencies
- **Circular Dependency Detection**: Identify and handle circular references gracefully
- **Cascade Unbuild Logic**: Remove dependent buildings when a prerequisite is unbuilt
- **Performance**: Sub-100ms calculation for any building dependency tree

### Technical Constraints

- **Data Structure**: Work with existing Building interface from types.ts
- **Memory Efficiency**: Minimize memory usage with large dependency trees
- **Cache Strategy**: Memoization for repeated dependency calculations
- **Edge Cases**: Handle missing buildings, invalid levels, malformed data
- **State Consistency**: Maintain consistency between UI state and calculation results

### Algorithm Constraints

- **Time Complexity**: Target O(n) for dependency traversal where n = total dependencies
- **Space Complexity**: Target O(d) where d = maximum dependency depth
- **Scalability**: Handle up to 1,400 total building-level combinations efficiently

## Options Analysis

### Option 1: Recursive Depth-First Search with Memoization

**Description**: Recursive traversal of dependency tree with cached results for previously calculated paths

**Pros**:

- Simple, intuitive implementation
- Natural recursive structure matches dependency relationships
- Easy to implement memoization at function level
- Clear separation between traversal and caching logic
- Handles arbitrary dependency depths

**Cons**:

- Risk of stack overflow with very deep dependency chains
- Potential duplicate work if not memoized properly
- More complex to implement cycle detection
- Memory usage can grow with recursion depth

**Time Complexity**: O(n) with memoization, O(n²) without
**Space Complexity**: O(d) for recursion stack + O(n) for memoization
**Implementation Time**: 2-3 hours

### Option 2: Iterative Breadth-First Search with Queue

**Description**: Level-by-level traversal using a queue to build dependency layers, resolving each level before proceeding

**Pros**:

- No recursion stack overflow risk
- Natural level-by-level processing
- Easy to implement progress tracking
- Excellent for finding shortest dependency paths
- Simpler cycle detection with visited tracking

**Cons**:

- More complex state management with queue
- Less intuitive for dependency relationship modeling
- Requires careful handling of cross-level dependencies
- Queue memory management overhead

**Time Complexity**: O(n + e) where e = edges between dependencies
**Space Complexity**: O(w) where w = maximum width of dependency tree
**Implementation Time**: 3-4 hours

### Option 3: Topological Sort with Dependency Graph

**Description**: Build complete dependency graph and use topological sorting to determine optimal build sequence

**Pros**:

- Mathematically proven approach for dependency ordering
- Excellent cycle detection (impossible if graph is acyclic)
- Optimal build sequence guaranteed
- Easy to implement alternative sequences
- Well-understood algorithm with proven performance

**Cons**:

- Requires building complete graph upfront
- More complex implementation
- Higher memory usage for graph storage
- May be overkill for simpler dependency chains

**Time Complexity**: O(n + e) for graph construction + O(n + e) for topological sort
**Space Complexity**: O(n + e) for complete graph storage
**Implementation Time**: 4-5 hours

## 🎨 CREATIVE CHECKPOINT: Algorithm Selection

After analyzing performance requirements and implementation complexity, **Option 1 (Recursive DFS with Memoization)** provides the best balance of simplicity, performance, and maintainability for our use case.

## Recommended Approach: Enhanced Recursive DFS with Smart Caching

### Core Algorithm Structure

```typescript
interface DependencyResult {
  buildSequence: BuildStep[];
  totalCost: ResourceCost;
  estimatedTime: number;
  circularDependencies: string[];
}

interface BuildStep {
  buildingId: string;
  fromLevel: number;
  toLevel: number;
  requirements: Record<string, number>;
  resources: ResourceCost;
  isBlocked: boolean;
  dependsOn: string[];
}

class DependencyCalculator {
  private memoCache = new Map<string, DependencyResult>();
  private visitedPath = new Set<string>();

  calculateDependencies(
    targetBuilding: string,
    targetLevel: number
  ): DependencyResult {
    // Implementation details below
  }
}
```

### Algorithm Flow Design

```
1. Input Validation
   ├── Validate building exists
   ├── Validate level is valid (1-25)
   └── Check current user state

2. Memoization Check
   ├── Generate cache key: `${buildingId}-${level}`
   ├── Return cached result if exists
   └── Continue to calculation if not cached

3. Recursive Dependency Resolution
   ├── Add current building to visited path
   ├── Get building requirements for target level
   ├── For each requirement:
   │   ├── Check if requirement creates cycle
   │   ├── Recursively resolve requirement
   │   └── Merge results into build sequence
   ├── Remove current building from visited path
   └── Cache and return final result

4. Sequence Optimization
   ├── Remove duplicate build steps
   ├── Sort by dependency order
   ├── Validate sequence completeness
   └── Calculate total costs and time
```

### Cycle Detection Strategy

```typescript
private detectCycle(buildingId: string, level: number): boolean {
  const key = `${buildingId}-${level}`;
  if (this.visitedPath.has(key)) {
    // Cycle detected - log and handle gracefully
    console.warn(`Circular dependency detected: ${key}`);
    return true;
  }
  return false;
}
```

### Memoization Strategy

```typescript
private generateCacheKey(buildingId: string, level: number, userState: BuildState): string {
  // Include user state hash to invalidate cache when builds change
  const stateHash = this.hashUserState(userState);
  return `${buildingId}-${level}-${stateHash}`;
}

private hashUserState(state: BuildState): string {
  // Create stable hash of user's current building levels
  return Object.entries(state)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, level]) => `${id}:${level}`)
    .join('|');
}
```

### Performance Optimizations

#### 1. Lazy Evaluation

```typescript
// Only calculate dependencies when needed
private resolveDependency(buildingId: string, level: number): BuildStep[] {
  if (this.userState[buildingId] >= level) {
    return []; // Already built, no work needed
  }
  return this.calculateBuildSteps(buildingId, level);
}
```

#### 2. Incremental Calculation

```typescript
// Only calculate levels user doesn't have
private calculateRequiredLevels(buildingId: string, targetLevel: number): number[] {
  const currentLevel = this.userState[buildingId] || 0;
  return Array.from(
    { length: targetLevel - currentLevel },
    (_, i) => currentLevel + i + 1
  );
}
```

#### 3. Parallel Dependency Resolution

```typescript
// Process independent dependencies in parallel
private async resolveParallelDependencies(requirements: Record<string, number>): Promise<BuildStep[]> {
  const independentDeps = this.identifyIndependentDependencies(requirements);
  const results = await Promise.all(
    independentDeps.map(dep => this.calculateDependencies(dep.id, dep.level))
  );
  return this.mergeDependencyResults(results);
}
```

## Cascade Unbuild Algorithm

### Unbuild Impact Analysis

```typescript
interface UnbuildImpact {
  affectedBuildings: string[];
  cascadeSequence: string[];
  resourcesRecovered: ResourceCost;
  timeImpact: number;
}

calculateUnbuildImpact(buildingId: string, newLevel: number): UnbuildImpact {
  // 1. Find all buildings that depend on this building at higher levels
  // 2. Recursively find their dependencies
  // 3. Build cascade sequence for user confirmation
  // 4. Calculate resource and time impacts
}
```

### Cascade Logic Flow

```
1. Identify Direct Dependents
   ├── Scan all buildings for requirements
   ├── Find buildings requiring unbuild target
   └── Filter by current user build levels

2. Recursive Impact Analysis
   ├── For each dependent building:
   │   ├── Check if still meets requirements after unbuild
   │   ├── If not, add to cascade list
   │   └── Recursively check its dependents
   └── Build complete cascade sequence

3. User Confirmation
   ├── Present cascade impact clearly
   ├── Show resources that will be recovered
   ├── Allow user to confirm or cancel
   └── Execute cascade if confirmed
```

## Edge Cases & Error Handling

### 1. Circular Dependencies

- **Detection**: Track visited path during traversal
- **Handling**: Log warning, break cycle, continue with partial result
- **User Feedback**: Show circular dependency warning in UI

### 2. Missing Building Data

- **Detection**: Check building exists in data before processing
- **Handling**: Skip missing building, log error
- **User Feedback**: Show "Building data unavailable" message

### 3. Invalid Levels

- **Detection**: Validate level is between 1 and building's max level
- **Handling**: Clamp to valid range or return error
- **User Feedback**: Show level validation message

### 4. Performance Degradation

- **Detection**: Monitor calculation time with performance.now()
- **Handling**: Implement calculation timeout and progressive disclosure
- **User Feedback**: Show "Complex calculation" loading state

## Verification Against Requirements

✅ **Complete Dependency Resolution**: Recursive traversal finds all requirements
✅ **Sequence Optimization**: Topological ordering within recursive solution
✅ **Circular Dependency Detection**: Visited path tracking prevents infinite loops
✅ **Cascade Unbuild Logic**: Reverse dependency analysis with impact calculation
✅ **Performance**: Memoization + lazy evaluation achieves sub-100ms target
✅ **Memory Efficiency**: O(d) space complexity with smart caching
✅ **State Consistency**: Cache invalidation based on user state changes
✅ **Edge Case Handling**: Comprehensive error handling for all scenarios

## Implementation Priority

1. **Core recursive dependency resolver** (1 hour)
2. **Memoization system with cache invalidation** (30 minutes)
3. **Cycle detection and handling** (30 minutes)
4. **Cascade unbuild impact analysis** (45 minutes)
5. **Performance optimizations and error handling** (30 minutes)

Total Estimated Implementation Time: **3.25 hours**

🎨🎨🎨 EXITING CREATIVE PHASE: ALGORITHM DESIGN COMPLETE 🎨🎨🎨

# 🎨🎨🎨 ENTERING CREATIVE PHASE: DATA ARCHITECTURE 🎨🎨🎨

## Component: Build State Schema & Caching Strategy

**What is this component?** A comprehensive data architecture that manages user building progress, optimizes data access patterns, and provides efficient state persistence with localStorage integration for the building dependency management system.

**What does it do?** Defines data structures, storage schemas, caching strategies, and state management patterns that enable fast, reliable tracking of user building progress while maintaining data integrity and performance across sessions.

## Requirements & Constraints

### Data Requirements

- **State Persistence**: User building progress saved across browser sessions
- **Data Integrity**: Consistent state management preventing data corruption
- **Performance**: Fast read/write operations for real-time UI updates
- **Scalability**: Support for 56 buildings × 25 levels = 1,400 possible states
- **Validation**: Ensure building levels are valid and consistent

### Technical Constraints

- **Storage Medium**: localStorage (5-10MB limit per domain)
- **Data Format**: JSON serializable for localStorage compatibility
- **Memory Efficiency**: Minimize RAM usage for large dependency calculations
- **Cache Strategy**: Smart invalidation without full recalculation
- **Browser Compatibility**: Support all modern browsers

### Performance Constraints

- **Storage Size**: Keep user data under 500KB for optimal performance
- **Read Operations**: Sub-10ms access to user building state
- **Write Operations**: Sub-50ms save operations for build actions
- **Cache Hit Rate**: Target 80%+ cache hit rate for dependency calculations
- **Memory Usage**: Keep runtime memory under 50MB for dependency calculations

## Options Analysis

### Option 1: Flat Object Schema with Direct Mapping

**Description**: Simple object mapping building IDs directly to current levels `{ buildingId: currentLevel }`

**Pros**:

- Extremely simple data structure
- Fast read/write operations
- Minimal storage overhead
- Easy to serialize/deserialize
- Direct property access is fast

**Cons**:

- No metadata about build history
- Difficult to track build progress over time
- No validation of level transitions
- Limited extensibility for future features
- No timestamp tracking

**Storage Size**: ~50 bytes per building (56 buildings = ~3KB total)
**Access Time**: ~1ms
**Implementation Time**: 30 minutes

### Option 2: Structured Schema with Metadata

**Description**: Rich object schema with timestamps, validation, and progress tracking

```typescript
interface BuildingProgress {
  currentLevel: number;
  lastBuiltAt: Date;
  totalTimeSpent: number;
  buildHistory: BuildAction[];
}

interface UserBuildState {
  buildings: Record<string, BuildingProgress>;
  metadata: {
    createdAt: Date;
    lastModified: Date;
    version: string;
  };
}
```

**Pros**:

- Rich metadata for progress tracking
- Build history for analytics
- Timestamp tracking for features
- Extensible for future requirements
- Built-in versioning support

**Cons**:

- Larger storage footprint
- More complex serialization
- Slower read/write operations
- Over-engineered for current needs
- Increased memory usage

**Storage Size**: ~200 bytes per building (56 buildings = ~12KB total)
**Access Time**: ~5ms
**Implementation Time**: 2-3 hours

### Option 3: Hybrid Approach with Lazy Metadata

**Description**: Simple core schema with optional metadata loaded on demand

```typescript
interface BuildState {
  [buildingId: string]: number; // Core: buildingId -> level
}

interface BuildMetadata {
  [buildingId: string]: {
    lastBuiltAt: Date;
    buildCount: number;
  };
}
```

**Pros**:

- Fast core operations with simple schema
- Optional metadata when needed
- Smaller storage footprint for core data
- Easy migration from simple to complex
- Balanced performance vs features

**Cons**:

- Dual data structure complexity
- Potential sync issues between core and metadata
- More complex state management
- Requires careful cache coordination

**Storage Size**: ~75 bytes per building (56 buildings = ~4.5KB total)
**Access Time**: ~2ms
**Implementation Time**: 1.5-2 hours

## 🎨 CREATIVE CHECKPOINT: Data Schema Selection

After analyzing performance requirements and simplicity needs, **Option 1 (Flat Object Schema)** provides the optimal balance for MVP implementation with clear upgrade path to Option 3 if needed.

## Recommended Approach: Optimized Flat Schema with Smart Caching

### Core Data Schema

```typescript
// Primary user state - localStorage key: 'buildingState'
interface BuildState {
  [buildingId: string]: number; // buildingId -> current level (0 if not built)
}

// Example:
const userBuildState: BuildState = {
  queen: 15,
  worker_ant_nest: 12,
  meat_depot: 8,
  plant_depot: 6,
  // ... other buildings (only store non-zero levels)
};
```

### Storage Optimization Strategy

#### 1. Sparse Storage (Only Non-Zero Levels)

```typescript
class BuildStateManager {
  private defaultLevel = 0;

  // Only store buildings with level > 0
  saveBuildState(state: BuildState): void {
    const sparseState = Object.fromEntries(
      Object.entries(state).filter(([_, level]) => level > 0)
    );
    localStorage.setItem("buildingState", JSON.stringify(sparseState));
  }

  // Return 0 for buildings not in storage
  getBuildingLevel(buildingId: string): number {
    const state = this.loadBuildState();
    return state[buildingId] ?? this.defaultLevel;
  }
}
```

#### 2. Delta Compression for Large Changes

```typescript
// For bulk operations, save only changes
interface BuildStateDelta {
  changes: Record<string, number>;
  timestamp: number;
}

// Store recent deltas for undo/redo functionality
private saveStateDelta(changes: Record<string, number>): void {
  const delta: BuildStateDelta = {
    changes,
    timestamp: Date.now()
  };

  const recentDeltas = this.getRecentDeltas();
  recentDeltas.push(delta);

  // Keep only last 10 deltas
  if (recentDeltas.length > 10) {
    recentDeltas.splice(0, recentDeltas.length - 10);
  }

  localStorage.setItem('buildingDeltas', JSON.stringify(recentDeltas));
}
```

### Cache Architecture Design

#### Multi-Level Caching Strategy

```typescript
class DependencyCacheManager {
  // Level 1: In-memory calculation cache (fastest)
  private memoryCache = new Map<string, DependencyResult>();

  // Level 2: Session storage cache (survives navigation)
  private sessionCacheKey = "dependencyCache";

  // Level 3: localStorage cache (survives browser restart)
  private persistentCacheKey = "dependencyCachePersistent";

  async getDependencies(
    buildingId: string,
    level: number,
    userState: BuildState
  ): Promise<DependencyResult> {
    const cacheKey = this.generateCacheKey(buildingId, level, userState);

    // Check Level 1: Memory
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!;
    }

    // Check Level 2: Session
    const sessionResult = this.getFromSessionCache(cacheKey);
    if (sessionResult) {
      this.memoryCache.set(cacheKey, sessionResult);
      return sessionResult;
    }

    // Check Level 3: Persistent
    const persistentResult = this.getFromPersistentCache(cacheKey);
    if (persistentResult) {
      this.memoryCache.set(cacheKey, persistentResult);
      this.saveToSessionCache(cacheKey, persistentResult);
      return persistentResult;
    }

    // Calculate and cache at all levels
    const result = await this.calculateDependencies(
      buildingId,
      level,
      userState
    );
    this.cacheAtAllLevels(cacheKey, result);
    return result;
  }
}
```

#### Smart Cache Invalidation

```typescript
class CacheInvalidationManager {
  // Track which buildings affect which cache entries
  private dependencyMap = new Map<string, Set<string>>();

  invalidateCachesForBuildingChange(
    buildingId: string,
    oldLevel: number,
    newLevel: number
  ): void {
    // 1. Find all cache entries that depend on this building
    const affectedCacheKeys = this.findAffectedCacheKeys(buildingId);

    // 2. Remove affected entries from all cache levels
    affectedCacheKeys.forEach((key) => {
      this.memoryCache.delete(key);
      this.removeFromSessionCache(key);
      this.removeFromPersistentCache(key);
    });

    // 3. Preemptively calculate commonly accessed dependencies
    this.preloadCommonDependencies();
  }

  private findAffectedCacheKeys(buildingId: string): string[] {
    // Buildings that require this building will need cache invalidation
    return Array.from(this.dependencyMap.get(buildingId) || []);
  }
}
```

### State Management Patterns

#### Optimistic Updates with Rollback

```typescript
class BuildActionManager {
  private actionHistory: BuildAction[] = [];

  async executeBuildAction(
    buildingId: string,
    targetLevel: number
  ): Promise<void> {
    const currentLevel = this.getBuildingLevel(buildingId);

    // 1. Optimistic update (immediate UI feedback)
    this.updateBuildingLevel(buildingId, targetLevel);

    try {
      // 2. Validate action (dependency requirements, resources)
      await this.validateBuildAction(buildingId, targetLevel);

      // 3. Persist to storage
      this.saveBuildState();

      // 4. Update cache invalidation
      this.invalidateAffectedCaches(buildingId, currentLevel, targetLevel);

      // 5. Record action in history
      this.recordAction({
        buildingId,
        fromLevel: currentLevel,
        toLevel: targetLevel,
      });
    } catch (error) {
      // Rollback optimistic update on failure
      this.updateBuildingLevel(buildingId, currentLevel);
      throw error;
    }
  }
}
```

#### Batch Operations for Performance

```typescript
class BatchBuildManager {
  private pendingUpdates = new Map<string, number>();
  private batchTimeout: number | null = null;

  // Queue multiple build actions for batch processing
  queueBuildAction(buildingId: string, level: number): void {
    this.pendingUpdates.set(buildingId, level);

    // Debounce batch processing
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, 100); // 100ms debounce
  }

  private async processBatch(): Promise<void> {
    const updates = Array.from(this.pendingUpdates.entries());
    this.pendingUpdates.clear();

    // Process all updates in a single transaction
    const state = this.loadBuildState();
    updates.forEach(([buildingId, level]) => {
      state[buildingId] = level;
    });

    // Single save operation
    this.saveBuildState(state);

    // Batch cache invalidation
    this.batchInvalidateCaches(updates);
  }
}
```

### Data Validation & Integrity

#### Schema Validation

```typescript
class BuildStateValidator {
  validateBuildState(state: BuildState): ValidationResult {
    const errors: string[] = [];

    Object.entries(state).forEach(([buildingId, level]) => {
      // 1. Validate building exists
      if (!this.buildingExists(buildingId)) {
        errors.push(`Unknown building: ${buildingId}`);
      }

      // 2. Validate level range
      if (level < 0 || level > 25) {
        errors.push(`Invalid level for ${buildingId}: ${level}`);
      }

      // 3. Validate dependencies are met
      if (!this.dependenciesMetForLevel(buildingId, level, state)) {
        errors.push(`Dependencies not met for ${buildingId} level ${level}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

### Performance Monitoring

#### Storage Usage Tracking

```typescript
class StorageMonitor {
  getStorageUsage(): StorageUsageReport {
    const buildState = localStorage.getItem("buildingState");
    const cacheData = localStorage.getItem("dependencyCachePersistent");

    return {
      buildStateSize: new Blob([buildState || ""]).size,
      cacheSize: new Blob([cacheData || ""]).size,
      totalSize: this.getTotalLocalStorageSize(),
      remainingQuota: this.getRemainingQuota(),
    };
  }

  // Auto-cleanup when approaching storage limits
  cleanupStorageIfNeeded(): void {
    const usage = this.getStorageUsage();
    if (usage.totalSize > 4 * 1024 * 1024) {
      // 4MB threshold
      this.clearOldCacheEntries();
      this.compactBuildState();
    }
  }
}
```

## Verification Against Requirements

✅ **State Persistence**: localStorage integration with JSON serialization
✅ **Data Integrity**: Validation and rollback mechanisms
✅ **Performance**: Multi-level caching with <10ms read operations
✅ **Scalability**: Sparse storage handles 1,400 possible states efficiently
✅ **Storage Efficiency**: ~3KB core data + selective caching
✅ **Memory Efficiency**: <50MB runtime with smart cache management
✅ **Cache Strategy**: 80%+ hit rate through multi-level caching
✅ **Browser Compatibility**: Standard localStorage and JSON APIs

## Implementation Priority

1. **Core BuildState schema and localStorage integration** (45 minutes)
2. **Basic cache manager with memory caching** (30 minutes)
3. **State validation and error handling** (30 minutes)
4. **Optimistic updates with rollback** (45 minutes)
5. **Multi-level cache system and invalidation** (1 hour)
6. **Performance monitoring and cleanup** (30 minutes)

Total Estimated Implementation Time: **3.5 hours**

## Migration & Versioning Strategy

```typescript
interface StorageMetadata {
  version: string;
  migrationPath: string[];
}

// Handle future schema changes
class DataMigrationManager {
  migrate(currentVersion: string, targetVersion: string): void {
    const migrations = this.getMigrationPath(currentVersion, targetVersion);
    migrations.forEach((migration) => migration.execute());
  }
}
```

🎨🎨🎨 EXITING CREATIVE PHASE: DATA ARCHITECTURE COMPLETE 🎨🎨🎨

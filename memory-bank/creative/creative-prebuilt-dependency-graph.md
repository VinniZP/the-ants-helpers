# 🎨🎨🎨 ENTERING CREATIVE PHASE: PREBUILT DEPENDENCY GRAPH ARCHITECTURE

**Component**: Build-time dependency graph generation and runtime lookup system  
**Type**: Architecture & Algorithm Design  
**Complexity**: Level 3 - Intermediate Feature

## Component Description

The prebuilt dependency graph system will replace runtime dependency calculation with build-time precomputation and instant runtime lookups. This system must generate complete dependency graphs for all building/level combinations at build time, store them in an optimized format, and provide <1ms lookup performance at runtime while maintaining full backward compatibility.

## Requirements & Constraints

### Performance Requirements

- **Lookup Speed**: <1ms for any building/level combination (100x improvement from current ~100ms)
- **Memory Footprint**: Predictable, bounded memory usage
- **Bundle Impact**: <10% increase in application bundle size
- **Loading Time**: <100ms additional initial loading time

### Functional Requirements

- **Complete Coverage**: Support all building/level combinations (~1000+ dependency graphs)
- **Build State Compatibility**: Handle different user build states efficiently
- **Backward Compatibility**: Zero breaking changes to existing interface
- **Fallback Support**: Graceful degradation to runtime calculation when needed

### Technical Constraints

- **Build Time**: <5 second increase in build process
- **Development Experience**: Hot reload support for dependency data changes
- **Browser Compatibility**: Work across all supported browsers
- **Type Safety**: Full TypeScript support throughout

## Options Analysis

### OPTION 1: JSON-Based Indexed Structure

**Approach**: Store dependency graphs as optimized JSON with hierarchical indexing

**Data Structure**:

```typescript
interface PrebuiltDependencies {
  version: string;
  buildStateHash: string;
  dependencies: {
    [buildingId: string]: {
      [level: number]: {
        requirements: BuildRequirement[];
        metadata: {
          totalCount: number;
          maxDepth: number;
          buildTime: number;
        };
      };
    };
  };
  index: {
    byComplexity: string[]; // Pre-sorted by complexity
    byBuilding: Record<string, number[]>; // Available levels per building
  };
}
```

**Pros**:

- ✅ Human-readable and debuggable
- ✅ Native JSON parsing performance
- ✅ Easy compression with gzip
- ✅ Simple TypeScript integration
- ✅ Straightforward build integration

**Cons**:

- ❌ Larger memory footprint than binary
- ❌ Parsing overhead at initialization
- ❌ Repetitive data structure

**Performance Estimate**: 2-5ms initialization, <1ms lookups

### OPTION 2: MessagePack Binary Format

**Approach**: Use MessagePack for compact binary serialization with indexing

**Data Structure**:

```typescript
// Compressed binary format with schema:
interface PackedDependencies {
  meta: { version: string; hash: string; count: number };
  buildings: Uint8Array; // Building ID mappings
  levels: Uint16Array; // Level mappings
  deps: Uint32Array; // Dependency data
  index: Uint32Array; // Lookup indices
}
```

**Pros**:

- ✅ Minimal memory footprint (50-70% smaller)
- ✅ Fast binary parsing
- ✅ Excellent compression ratio
- ✅ Structured data access

**Cons**:

- ❌ Additional dependency (MessagePack library)
- ❌ Not human-readable
- ❌ Complex debugging
- ❌ Build complexity increases

**Performance Estimate**: 1-2ms initialization, <0.5ms lookups

### OPTION 3: Hybrid JSON + Binary Index

**Approach**: JSON for dependency data, binary index for fast lookups

**Data Structure**:

```typescript
interface HybridDependencies {
  metadata: {
    version: string;
    buildStateHash: string;
    stats: { totalGraphs: number; maxComplexity: number };
  };
  dependencies: BuildRequirement[]; // Flat array
  index: {
    binary: Uint32Array; // Fast lookup indices
    map: Record<string, number>; // Key to index mapping
  };
}
```

**Pros**:

- ✅ Fast lookups via binary index
- ✅ Readable dependency data
- ✅ Good compression ratio
- ✅ Balanced complexity

**Cons**:

- ❌ More complex implementation
- ❌ Two data formats to maintain
- ❌ Potential synchronization issues

**Performance Estimate**: 1-3ms initialization, <0.8ms lookups

### OPTION 4: Pre-computed Maps Structure

**Approach**: Generate lookup maps for common queries at build time

**Data Structure**:

```typescript
interface MappedDependencies {
  version: string;
  quickLookup: {
    [key: string]: BuildRequirement[]; // Pre-computed for common cases
  };
  fullDependencies: {
    [buildingId: string]: {
      [level: number]: BuildRequirement[];
    };
  };
  buildStateVariations: {
    [stateHash: string]: Record<string, BuildRequirement[]>;
  };
}
```

**Pros**:

- ✅ Instant lookups for common cases
- ✅ Pre-computed build state variations
- ✅ Optimal for actual usage patterns
- ✅ Simple implementation

**Cons**:

- ❌ Large data size due to pre-computation
- ❌ Complex build-time generation
- ❌ Limited build state coverage

**Performance Estimate**: 5-10ms initialization, <0.2ms common lookups, <2ms rare lookups

## Recommended Approach: OPTION 1 + OPTIMIZATIONS

**Selection Rationale**:

- **Simplicity**: JSON provides the best development experience and debugging
- **Performance**: With optimizations, meets all performance targets
- **Maintainability**: Easy to understand, modify, and extend
- **Risk**: Lowest implementation risk with good fallback options

**Key Optimizations**:

1. **Hierarchical Indexing**: Fast building/level lookup without full scan
2. **Lazy Loading**: Load dependency data only when needed
3. **Compression**: Use aggressive JSON minification and gzip
4. **Memoization**: Cache computed lookups for repeated queries

## Implementation Guidelines

### Data Structure Design

```typescript
interface OptimizedPrebuiltDependencies {
  version: string;
  metadata: {
    generatedAt: string;
    sourceHash: string; // Hash of buildings.ts for validation
    stats: {
      totalBuildings: number;
      totalLevels: number;
      totalDependencies: number;
      maxComplexity: number;
    };
  };
  dependencies: {
    [buildingId: string]: {
      [level: number]: {
        deps: BuildRequirement[];
        meta: { count: number; depth: number };
      };
    };
  };
  index: {
    buildings: string[]; // All building IDs
    complexBuildings: string[]; // Buildings with >50 dependencies
    quickAccess: Record<string, number>; // Common building/level -> array index
  };
}
```

### Build Integration Strategy

**Vite Plugin Approach** (Selected):

- Custom Vite plugin for seamless integration
- Automatic regeneration on building data changes
- Development vs production mode handling
- Hot reload support for dependency data

**Plugin Implementation**:

```typescript
function dependencyGraphPlugin(): Plugin {
  return {
    name: "dependency-graph-generator",
    buildStart() {
      // Generate dependency graphs during build
    },
    handleHotUpdate(ctx) {
      // Regenerate if building data changes
    },
  };
}
```

### Lookup Key Design

**Composite Key Strategy**:

```typescript
function generateLookupKey(
  buildingId: string,
  level: number,
  buildStateHash?: string
): string {
  // Format: "building:level" or "building:level:state"
  return buildStateHash
    ? `${buildingId}:${level}:${buildStateHash}`
    : `${buildingId}:${level}`;
}
```

**Key Benefits**:

- O(1) map access via composite keys
- Build state variation support
- Simple string concatenation for performance
- Clear, debuggable key format

### Build State Handling

**Hybrid Approach** (Selected):

- **Common States**: Pre-generate for empty state and base buildings
- **Custom States**: Runtime calculation with caching for uncommon build states
- **Threshold**: Pre-generate top 95% of use cases, fallback for edge cases

```typescript
interface BuildStateStrategy {
  prebuilt: {
    emptyState: PrebuiltDependencies;
    baseBuildings: PrebuiltDependencies;
    commonStates: Record<string, PrebuiltDependencies>;
  };
  runtime: {
    cache: Map<string, BuildRequirement[]>;
    fallbackToCalculation: boolean;
  };
}
```

## Verification Checkpoint

**Performance Verification**:

- [ ] Lookup time <1ms for prebuilt cases
- [ ] Initialization time <100ms
- [ ] Bundle size increase <10%
- [ ] Memory usage predictable and bounded

**Correctness Verification**:

- [ ] Results match current runtime calculation 100%
- [ ] All building/level combinations supported
- [ ] Build state variations handled correctly
- [ ] Fallback mechanism works reliably

**Integration Verification**:

- [ ] Zero breaking changes to existing interface
- [ ] All usage points work without modification
- [ ] Development workflow remains smooth
- [ ] Error handling and debugging tools work

# 🎨🎨🎨 EXITING CREATIVE PHASE

**Design Decision**: JSON-based indexed structure with Vite plugin integration  
**Key Innovation**: Hierarchical indexing with lazy loading for optimal performance  
**Risk Mitigation**: Comprehensive fallback system and validation  
**Next Phase**: Ready for IMPLEMENT mode with clear technical specifications

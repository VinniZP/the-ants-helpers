import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { getBuildingDisplayName } from "../../constants/buildingDisplayNames";
import type { BuildRequirement } from "../../services/dependencyCalculator";
import type { Building } from "../../data/types";
import type { BuildState } from "../../hooks/useBuildState";

// Extract BuildingId type from Building interface
type BuildingId = Building["id"];

interface BuildingProgressSummaryProps {
  targetBuilding: { id: BuildingId; level: number };
  buildState: BuildState;
  buildQueue: BuildRequirement[] | null;
}

export function BuildingProgressSummary({
  targetBuilding,
  buildState,
  buildQueue,
}: BuildingProgressSummaryProps) {
  // Use cached queue instead of expensive recalculation
  const dependencies = buildQueue || [];

  // Helper function to check if a step is built
  const isStepBuilt = (dependency: BuildRequirement): boolean => {
    return (buildState[dependency.id] || 0) >= dependency.level;
  };

  const totalBuildings = dependencies.length;
  const builtBuildings = dependencies.filter(isStepBuilt).length;
  const progressPercentage =
    totalBuildings > 0
      ? Math.round((builtBuildings / totalBuildings) * 100)
      : 0;

  // Get all currently built buildings from build state
  const allBuiltBuildings = Object.entries(buildState)
    .filter(([_, level]) => level > 0)
    .map(([buildingId, level]) => ({
      id: buildingId as BuildingId,
      level,
      name: getBuildingDisplayName(buildingId as BuildingId),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Debug: Check if progress calculation is working
  console.log("🔍 Progress Debug:", {
    target: `${getBuildingDisplayName(targetBuilding.id)} L${
      targetBuilding.level
    }`,
    totalDeps: totalBuildings,
    builtDeps: builtBuildings,
    progress: progressPercentage,
    sampleDeps: dependencies
      .slice(0, 5)
      .map((d) => `${d.id} L${d.level} (${d.isBuilt ? "built" : "unbuilt"})`),
    totalBuiltBuildings: allBuiltBuildings.length,
  });

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progress Summary</span>
            <Badge variant="secondary">
              {builtBuildings}/{totalBuildings} dependencies
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Target:</span>
              <span className="font-medium">
                {getBuildingDisplayName(targetBuilding.id)} Level{" "}
                {targetBuilding.level}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Overall Progress:
              </span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Progress based on cached build queue (no recalculation)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Built Buildings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Currently Built Buildings</span>
            <Badge variant="outline">
              {allBuiltBuildings.length} buildings
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allBuiltBuildings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {allBuiltBuildings.map((building) => (
                <div
                  key={`${building.id}-${building.level}`}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <span className="text-sm font-medium truncate">
                    {building.name}
                  </span>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    L{building.level}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <p>No buildings built yet</p>
              <p className="text-xs mt-1">Start building to see progress</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

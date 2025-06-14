import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { getBuildingDisplayName } from "../../constants/buildingDisplayNames";
import { buildings } from "../../data/buildings";
import type { BuildRequirement } from "../../services/dependencyCalculator";
import type { Building } from "../../data/types";
import type { BuildState } from "../../hooks/useBuildState";
import { useMemo } from "react";

// Extract BuildingId type from Building interface
type BuildingId = Building["id"];

interface ResourceTotals {
  meat: number;
  fungus: number;
  plant: number;
  wet_soil: number;
  sand: number;
  diamonds: number;
  honeydew: number;
}

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

  // Calculate total resources needed for the build queue
  const totalResources = useMemo((): ResourceTotals => {
    if (!buildQueue || buildQueue.length === 0) {
      return {
        meat: 0,
        fungus: 0,
        plant: 0,
        wet_soil: 0,
        sand: 0,
        diamonds: 0,
        honeydew: 0,
      };
    }

    const totals: ResourceTotals = {
      meat: 0,
      fungus: 0,
      plant: 0,
      wet_soil: 0,
      sand: 0,
      diamonds: 0,
      honeydew: 0,
    };

    buildQueue.forEach((req) => {
      // Only count resources for unbuilt steps
      if (!isStepBuilt(req)) {
        const building = buildings.find((b) => b.id === req.id);
        const levelData = building?.levels.find((l) => l.level === req.level);
        if (levelData) {
          totals.meat += levelData.meat || 0;
          totals.fungus += levelData.fungus || 0;
          totals.plant += levelData.plant || 0;
          totals.wet_soil += levelData.wet_soil || 0;
          totals.sand += levelData.sand || 0;
          totals.diamonds += levelData.diamonds || 0;
          totals.honeydew += levelData.honeydew || 0;
        }
      }
    });

    return totals;
  }, [buildQueue, buildState]);

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

  // Helper function to format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Get non-zero resources for display
  const resourceEntries = Object.entries(totalResources)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key,
      displayName: key
        .replace("_", " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      value,
      formattedValue: formatNumber(value),
    }));

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

      {/* Total Resources Needed */}
      {buildQueue && buildQueue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Total Resources Needed</CardTitle>
          </CardHeader>
          <CardContent>
            {resourceEntries.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {resourceEntries.map((resource) => (
                  <div
                    key={resource.name}
                    className="flex flex-col items-center p-3 bg-muted rounded-lg"
                  >
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      {resource.displayName}
                    </div>
                    <Badge variant="outline" className="text-sm font-mono">
                      {resource.formattedValue}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                <p>No additional resources needed</p>
                <p className="text-xs mt-1">All dependencies are built!</p>
              </div>
            )}
            <div className="mt-3 text-xs text-muted-foreground text-center">
              Resources calculated for remaining unbuilt dependencies only
            </div>
          </CardContent>
        </Card>
      )}

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

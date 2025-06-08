import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { getBuildingDisplayName } from "../../constants/buildingDisplayNames";
import { type BuildRequirement } from "../../services/dependencyCalculator";
import type { Building } from "../../data/types";
import type { BuildState } from "../../hooks/useBuildState";

// Extract BuildingId type from Building interface
type BuildingId = Building["id"];

interface BuildSequenceViewerProps {
  buildQueue: BuildRequirement[] | null;
  buildState: BuildState;
  showBuiltOnly: boolean;
  onBuildAction: (buildingId: BuildingId, level: number) => void;
  onUnbuildAction: (buildingId: BuildingId, level: number) => void;
}

export function BuildSequenceViewer({
  buildQueue,
  buildState,
  showBuiltOnly,
  onBuildAction,
  onUnbuildAction,
}: BuildSequenceViewerProps) {
  // Helper function to check if a step is built
  const isStepBuilt = (dependency: BuildRequirement): boolean => {
    return (buildState[dependency.id] || 0) >= dependency.level;
  };

  // Filter queue based on showBuiltOnly setting
  const filteredQueue = buildQueue
    ? showBuiltOnly
      ? buildQueue.filter((dep) => !isStepBuilt(dep))
      : buildQueue
    : [];

  const handleBuildClick = (buildingId: BuildingId, level: number) => {
    onBuildAction(buildingId, level);
  };

  const handleUnbuildClick = (buildingId: BuildingId, level: number) => {
    // Simple direct unbuild without expensive cascade calculation
    // The queue is static - we just update the build state directly
    onUnbuildAction(buildingId, Math.max(0, level - 1));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Build Sequence</CardTitle>
      </CardHeader>
      <CardContent>
        {!buildQueue ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-lg mb-2">No build queue calculated</div>
            <div className="text-sm">
              Select a target building and click "Select Target & Calculate
              Queue" to generate the build sequence
            </div>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {showBuiltOnly
              ? "All dependencies are built!"
              : "No dependencies found."}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredQueue.map((dependency) => {
              const isBuilt = isStepBuilt(dependency);
              // Calculate the original step number from the unfiltered queue
              const originalStepIndex = buildQueue.findIndex(
                (dep) =>
                  dep.id === dependency.id && dep.level === dependency.level
              );
              const originalStepNumber = originalStepIndex + 1;

              return (
                <div
                  key={`${dependency.id}-${dependency.level}`}
                  className={`flex items-center justify-between p-2 rounded-md border ${
                    isBuilt ? "bg-green-50 border-green-200" : "border-border"
                  }`}
                >
                  {/* Left side: Step + Building info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Step Number */}
                    <div
                      className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                        isBuilt
                          ? "bg-green-600 text-white"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {originalStepNumber}
                    </div>

                    {/* Building Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {getBuildingDisplayName(dependency.id)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Level {dependency.level}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Status and Actions */}
                  <div className="flex items-center gap-2">
                    {isBuilt ? (
                      <>
                        <Badge
                          variant="default"
                          className="bg-green-600 text-xs"
                        >
                          ✓ Built
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() =>
                            handleUnbuildClick(dependency.id, dependency.level)
                          }
                        >
                          Unbuild
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() =>
                          handleBuildClick(dependency.id, dependency.level)
                        }
                        size="sm"
                        className="h-7 px-2 text-xs"
                      >
                        Build
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {buildQueue && filteredQueue.length > 0 && (
          <div className="mt-3 text-xs text-muted-foreground text-center">
            Build sequence calculated and cached. Positions remain stable - only
            visual states update.
            {showBuiltOnly && (
              <div className="mt-1">
                Showing {filteredQueue.length} unbuilt of {buildQueue.length}{" "}
                total steps
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
        <div className="space-y-3">
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
            filteredQueue.map((dependency, index) => {
              const isBuilt = isStepBuilt(dependency);
              // Calculate the original step number from the unfiltered queue
              const originalStepIndex = buildQueue.findIndex(
                (dep) =>
                  dep.id === dependency.id && dep.level === dependency.level
              );
              const originalStepNumber = originalStepIndex + 1;

              return (
                <Card
                  key={`${dependency.id}-${dependency.level}`}
                  small={true}
                  className={`relative ${
                    isBuilt ? "bg-green-50 border-green-200" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Step Number */}
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                            isBuilt
                              ? "bg-green-600 text-white"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          {originalStepNumber}
                        </div>

                        {/* Building Info */}
                        <div>
                          <div className="font-medium">
                            {getBuildingDisplayName(dependency.id)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Level {dependency.level}
                          </div>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center gap-2">
                        {isBuilt ? (
                          <>
                            <Badge variant="default" className="bg-green-600">
                              ✓ Built
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleUnbuildClick(
                                  dependency.id,
                                  dependency.level
                                )
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
                          >
                            Build
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {buildQueue && filteredQueue.length > 0 && (
          <div className="mt-4 text-xs text-muted-foreground text-center">
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

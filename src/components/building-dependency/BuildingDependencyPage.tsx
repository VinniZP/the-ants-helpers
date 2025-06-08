import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { TargetBuildingSelector } from "./TargetBuildingSelector";
import { BuildingProgressSummary } from "./BuildingProgressSummary";
import { FilterControls } from "./FilterControls";
import { BuildSequenceViewer } from "./BuildSequenceViewer";
import { useBuildState } from "../../hooks/useBuildState";
import type { Building } from "../../data/types";

// Extract BuildingId type from Building interface
type BuildingId = Building["id"];

export function BuildingDependencyPage() {
  const {
    buildState,
    targetBuilding,
    buildQueue,
    isCalculatingQueue,
    queueError,
    setBuildingLevel,
    isLoading,
    error,
    calculateAndStoreQueue,
  } = useBuildState();
  const [showBuiltOnly, setShowBuiltOnly] = useState(false);

  const handleCalculateQueue = (buildingId: BuildingId, level: number) => {
    calculateAndStoreQueue(buildingId, level);
  };

  const handleBuildAction = (buildingId: BuildingId, level: number) => {
    setBuildingLevel(buildingId, level);
  };

  const handleUnbuildAction = (buildingId: BuildingId, level: number) => {
    setBuildingLevel(buildingId, level);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p>Loading building data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            <p>Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Page Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏗️ Building Dependency Calculator
          </CardTitle>
          <CardDescription>
            Plan your building sequence and track progress for The Ants game
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Target Building Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Target Building</CardTitle>
          <CardDescription>
            Choose the building and level you want to achieve, then click
            "Select Target" to calculate the build sequence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TargetBuildingSelector
            onCalculateQueue={handleCalculateQueue}
            currentTarget={targetBuilding}
            isCalculating={isCalculatingQueue}
            calculationError={queueError}
          />
        </CardContent>
      </Card>

      {/* Progress Summary */}
      {targetBuilding && buildQueue && (
        <BuildingProgressSummary
          targetBuilding={targetBuilding}
          buildState={buildState}
          buildQueue={buildQueue}
        />
      )}

      {/* Filter Controls */}
      {buildQueue && (
        <FilterControls
          showBuiltOnly={showBuiltOnly}
          onFilterChange={setShowBuiltOnly}
          buildState={buildState}
        />
      )}

      {/* Build Sequence */}
      {buildQueue && (
        <BuildSequenceViewer
          buildQueue={buildQueue}
          buildState={buildState}
          showBuiltOnly={showBuiltOnly}
          onBuildAction={handleBuildAction}
          onUnbuildAction={handleUnbuildAction}
        />
      )}

      {/* Empty State */}
      {!buildQueue && !isCalculatingQueue && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground">
              <p className="text-lg mb-2">
                Select a target building to get started
              </p>
              <p className="text-sm">
                Choose any building and level, then click "Select Target &
                Calculate Queue" to see the complete dependency sequence
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isCalculatingQueue && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground">
              <p className="text-lg mb-2">Calculating build queue...</p>
              <p className="text-sm">
                This may take a few seconds for complex targets
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

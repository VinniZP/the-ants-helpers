import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import type { BuildState } from "../../hooks/useBuildState";

interface FilterControlsProps {
  showBuiltOnly: boolean;
  onFilterChange: (showBuiltOnly: boolean) => void;
  buildState: BuildState;
}

export function FilterControls({
  showBuiltOnly,
  onFilterChange,
  buildState,
}: FilterControlsProps) {
  const totalBuildings = Object.keys(buildState).length;
  const builtBuildings = Object.values(buildState).filter(
    (level) => level > 0
  ).length;
  const unbuiltBuildings = totalBuildings - builtBuildings;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button
              variant={!showBuiltOnly ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(false)}
              className="relative"
            >
              All Buildings
              <Badge variant="secondary" className="ml-2">
                {totalBuildings}
              </Badge>
            </Button>

            <Button
              variant={showBuiltOnly ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(true)}
              className="relative"
            >
              Unbuilt Only
              <Badge variant="secondary" className="ml-2">
                {unbuiltBuildings}
              </Badge>
            </Button>
          </div>

          {/* Progress Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>{builtBuildings} built</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <span>{unbuiltBuildings} unbuilt</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search, Target, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Alert, AlertDescription } from "../ui/alert";
import {
  getAllBuildingsWithNames,
  getBuildingDisplayName,
} from "../../constants/buildingDisplayNames";
import type { Building } from "../../data/types";

// Extract BuildingId type from Building interface
type BuildingId = Building["id"];

interface TargetBuildingSelectorProps {
  onCalculateQueue: (buildingId: BuildingId, level: number) => void;
  currentTarget: { id: BuildingId; level: number } | null;
  isCalculating: boolean;
  calculationError: string | null;
}

export function TargetBuildingSelector({
  onCalculateQueue,
  currentTarget,
  isCalculating,
  calculationError,
}: TargetBuildingSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingId | null>(
    currentTarget?.id || null
  );
  const [selectedLevel, setSelectedLevel] = useState<number>(
    currentTarget?.level || 1
  );

  const buildings = getAllBuildingsWithNames();

  // Sync with currentTarget prop changes
  useEffect(() => {
    if (currentTarget) {
      setSelectedBuilding(currentTarget.id);
      setSelectedLevel(currentTarget.level);
    } else {
      setSelectedBuilding(null);
      setSelectedLevel(1);
    }
  }, [currentTarget]);

  const handleBuildingSelect = (buildingId: BuildingId) => {
    setSelectedBuilding(buildingId);
    setOpen(false);
    // Removed auto-trigger - user must click "Select Target" button
  };

  const handleLevelSelect = (level: string) => {
    const levelNum = parseInt(level, 10);
    setSelectedLevel(levelNum);
    // Removed auto-trigger - user must click "Select Target" button
  };

  const handleSelectTarget = () => {
    if (selectedBuilding && selectedLevel > 0) {
      onCalculateQueue(selectedBuilding, selectedLevel);
    }
  };

  const canSelectTarget =
    selectedBuilding && selectedLevel > 0 && !isCalculating;

  // Generate level options (1-25 for most buildings)
  const levelOptions = Array.from({ length: 25 }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Building Selector */}
        <div className="space-y-2">
          <Label htmlFor="building-select">Building</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                id="building-select"
                disabled={isCalculating}
              >
                {selectedBuilding
                  ? getBuildingDisplayName(selectedBuilding)
                  : "Select building..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search buildings..." />
                <CommandList>
                  <CommandEmpty>No building found.</CommandEmpty>
                  {/* Group buildings by category */}
                  {Object.entries(
                    buildings.reduce((acc, building) => {
                      if (!acc[building.category]) {
                        acc[building.category] = [];
                      }
                      acc[building.category].push(building);
                      return acc;
                    }, {} as Record<string, typeof buildings>)
                  ).map(([category, categoryBuildings]) => (
                    <CommandGroup
                      key={category}
                      heading={category.replace("_", " ")}
                    >
                      {categoryBuildings.map((building) => (
                        <CommandItem
                          key={building.id}
                          value={building.name}
                          onSelect={() => handleBuildingSelect(building.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedBuilding === building.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {building.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Level Selector */}
        <div className="space-y-2">
          <Label htmlFor="level-select">Target Level</Label>
          <Select
            value={selectedLevel.toString()}
            onValueChange={handleLevelSelect}
            disabled={isCalculating}
          >
            <SelectTrigger id="level-select">
              <SelectValue placeholder="Select level..." />
            </SelectTrigger>
            <SelectContent>
              {levelOptions.map((level) => (
                <SelectItem key={level} value={level.toString()}>
                  Level {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selection Summary & Target Button */}
      {selectedBuilding && selectedLevel > 0 && (
        <div className="space-y-3 p-4 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">
            Selected:{" "}
            <span className="font-medium text-foreground">
              {getBuildingDisplayName(selectedBuilding)} Level {selectedLevel}
            </span>
          </div>

          <Button
            onClick={handleSelectTarget}
            disabled={!canSelectTarget}
            className="w-full"
            size="lg"
          >
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating Build Queue...
              </>
            ) : (
              <>
                <Target className="mr-2 h-4 w-4" />
                Select Target & Calculate Queue
              </>
            )}
          </Button>
        </div>
      )}

      {/* Error Display */}
      {calculationError && (
        <Alert variant="destructive">
          <AlertDescription>{calculationError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

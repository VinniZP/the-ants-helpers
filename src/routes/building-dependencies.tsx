import { createFileRoute } from "@tanstack/react-router";
import { BuildingDependencyPage } from "../components/building-dependency/BuildingDependencyPage";

export const Route = createFileRoute("/building-dependencies")({
  component: BuildingDependenciesPage,
});

function BuildingDependenciesPage() {
  return (
    <div className="min-h-screen bg-background">
      <BuildingDependencyPage />
    </div>
  );
}

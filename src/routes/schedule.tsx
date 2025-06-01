import { createFileRoute } from "@tanstack/react-router";
import { WeeklySchedule } from "../components/schedule/WeeklySchedule";

export const Route = createFileRoute("/schedule")({
  component: SchedulePage,
});

function SchedulePage() {
  return (
    <div className="p-4">
      <WeeklySchedule />
    </div>
  );
}

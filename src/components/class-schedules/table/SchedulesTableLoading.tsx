
import { Loader2 } from "lucide-react";

export function SchedulesTableLoading() {
  return (
    <div className="py-10 text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-mckaynine-600" />
      <p>Loading schedules...</p>
    </div>
  );
}


import { CircleX } from "lucide-react";

export function ClosedBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-zinc-200 text-zinc-700 text-xs font-semibold rounded px-2 py-1">
      <CircleX className="h-3 w-3 text-zinc-700" />
      Closed
    </span>
  );
}

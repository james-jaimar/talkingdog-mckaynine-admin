
import { Skeleton } from "@/components/ui/skeleton";

export function TabsLoadingState() {
  return (
    <div className="mt-4 bg-gray-100 rounded-md p-3">
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

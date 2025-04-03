
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface NoSchedulesProps {
  message?: string;
  subtitle?: string;
}

export function NoSchedules({ 
  message = "No schedules found for this class.",
  subtitle = "Please add a schedule to this class before adding handlers."
}: NoSchedulesProps) {
  return (
    <div className="text-center p-8 bg-yellow-50 rounded-md border border-yellow-200">
      <p className="text-yellow-700">{message}</p>
      <p className="text-sm mt-2 text-yellow-600">{subtitle}</p>
    </div>
  );
}

export function LoadingHandlers() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-4 border rounded-md">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function LoadingSchedules() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function ErrorState({ refetch }: { refetch: () => void }) {
  return (
    <div className="text-center p-8 bg-red-50 rounded-md border border-red-200">
      <p className="text-red-700">Error loading handlers.</p>
      <p className="text-sm mt-2 text-red-600">
        Please try refreshing the page or contact support.
      </p>
      <Button variant="outline" className="mt-4" onClick={refetch}>
        Try Again
      </Button>
    </div>
  );
}

export function NoHandlersAvailable() {
  return (
    <div className="text-center p-8 bg-gray-50 rounded-md border">
      <p className="text-muted-foreground">No handlers available to add to this class.</p>
      <p className="text-sm mt-2">
        All handlers have already been added or no handlers match your search.
      </p>
    </div>
  );
}

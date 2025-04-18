
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ClassesTableErrorProps {
  error: Error | null;
  onRetry?: () => void;
}

export function ClassesTableError({ error, onRetry }: ClassesTableErrorProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center text-red-500">
          Error loading classes. Please try again.
        </div>
        {onRetry && (
          <Button onClick={onRetry} className="mt-4">
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}


import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export function ClassesTableLoading() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-mckaynine-600" />
          <p>Loading classes...</p>
        </div>
      </CardContent>
    </Card>
  );
}

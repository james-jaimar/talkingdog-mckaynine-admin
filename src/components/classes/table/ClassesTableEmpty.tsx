
import { Card, CardContent } from "@/components/ui/card";

export function ClassesTableEmpty() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center text-muted-foreground">
          No classes found. Add a new class to get started.
        </div>
      </CardContent>
    </Card>
  );
}

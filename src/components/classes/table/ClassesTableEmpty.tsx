
import { Card, CardContent } from "@/components/ui/card";
import { useTermSelection } from "@/hooks/useTermSelection";

export function ClassesTableEmpty() {
  const { termData } = useTermSelection();

  return (
    <Card>
      <CardContent className="p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">
          {termData ? (
            `No classes found for Term ${termData.term_number}`
          ) : (
            "No classes found"
          )}
        </h3>
        <p className="text-gray-500">
          {termData ? (
            "Try selecting a different term or add new classes for this term."
          ) : (
            "Add your first class to get started."
          )}
        </p>
      </CardContent>
    </Card>
  );
}


import { Card, CardContent } from "@/components/ui/card";
import { useTerm } from "@/context/TermContext";
import { Calendar } from "lucide-react";

export function ClassesTableEmpty() {
  const { termData } = useTerm();

  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">
          {termData ? (
            `No classes found for Term ${termData.term_number}, ${termData.academic_years?.year}`
          ) : (
            "No classes found"
          )}
        </h3>
        <p className="text-gray-500">
          {termData ? (
            "No classes have been scheduled for this term yet. Try selecting a different term or add new classes for this term."
          ) : (
            "Select a term from above to view scheduled classes."
          )}
        </p>
      </CardContent>
    </Card>
  );
}

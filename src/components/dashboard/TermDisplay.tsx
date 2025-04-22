
import { format } from "date-fns";
import { useTermSelection } from "@/hooks/useTermSelection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TermDisplay() {
  const { termData, selectedYear, selectedTermNumber } = useTermSelection();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Term Information</CardTitle>
      </CardHeader>
      <CardContent>
        {termData && (
          <div className="space-y-2">
            <p className="text-2xl font-bold">
              Term {termData.term_number}, {selectedYear}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(termData.start_date), 'dd MMM yyyy')} - {format(new Date(termData.end_date), 'dd MMM yyyy')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

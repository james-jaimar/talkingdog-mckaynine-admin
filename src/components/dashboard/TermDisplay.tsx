
import { format } from "date-fns";
import { useTermSelection } from "@/hooks/useTermSelection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TermDisplay() {
  const {
    selectedYear,
    setSelectedYear,
    selectedTermNumber,
    setSelectedTermNumber,
    termData,
    years,
    terms
  } = useTermSelection();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Term Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="year-select" className="text-sm font-medium text-muted-foreground">
                Year
              </label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger id="year-select">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="term-select" className="text-sm font-medium text-muted-foreground">
                Term
              </label>
              <Select
                value={selectedTermNumber}
                onValueChange={(value) => setSelectedTermNumber(value)}
              >
                <SelectTrigger id="term-select">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term} value={term}>
                      Term {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
        </div>
      </CardContent>
    </Card>
  );
}

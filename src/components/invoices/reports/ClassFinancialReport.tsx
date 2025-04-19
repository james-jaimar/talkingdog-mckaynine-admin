
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useBranch } from "@/context/BranchContext";
import { useClassFinancialData } from "@/hooks/useClassFinancialData";
import { ClassFinancialTable } from "./ClassFinancialTable";

interface ClassFinancialReportProps {
  dateRange?: { from: Date; to: Date };
}

export function ClassFinancialReport({ dateRange }: ClassFinancialReportProps) {
  const { currentBranch } = useBranch();
  const fromDate = dateRange?.from?.toISOString();
  const toDate = dateRange?.to?.toISOString();

  const { classFinances, isLoading } = useClassFinancialData(
    currentBranch?.id,
    fromDate,
    toDate
  );

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Class Financial Report</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-36">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!classFinances || classFinances.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Class Financial Report</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground py-4">No financial data available for the selected date range</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Class Financial Report</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <ClassFinancialTable classFinances={classFinances} />
      </CardContent>
    </Card>
  );
}

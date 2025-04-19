
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useBranch } from "@/context/BranchContext";
import { useClassFinancialData } from "@/hooks/useClassFinancialData";
import { ClassFinancialTable } from "./ClassFinancialTable";
import { toast } from "sonner";

interface ClassFinancialReportProps {
  dateRange?: { from: Date; to: Date };
}

export function ClassFinancialReport({ dateRange }: ClassFinancialReportProps) {
  const { currentBranch } = useBranch();
  const [refreshing, setRefreshing] = useState(false);
  const fromDate = dateRange?.from?.toISOString();
  const toDate = dateRange?.to?.toISOString();

  const { classFinances, isLoading, refreshData } = useClassFinancialData(
    currentBranch?.id,
    fromDate,
    toDate
  );

  const handleRefresh = () => {
    setRefreshing(true);
    refreshData();
    toast.success("Refreshing financial data");
    
    // Reset refreshing state after animation
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Class Financial Report</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={true}
          >
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Class Financial Report</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground py-4">No financial data available for the selected date range</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Class Financial Report</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <ClassFinancialTable classFinances={classFinances} />
      </CardContent>
    </Card>
  );
}

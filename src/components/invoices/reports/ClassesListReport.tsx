
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClassesListData } from "@/hooks/useClassesListData";
import { Loader2, FileBarChart } from "lucide-react";
import { FranchiseReportModal } from "./FranchiseReportModal";
import { FranchiseClassesReport } from "./FranchiseClassesReport";

export function ClassesListReport() {
  const { data: classesData = [], isLoading } = useClassesListData();
  const [showFranchiseModal, setShowFranchiseModal] = useState(false);
  const [franchiseReportConfig, setFranchiseReportConfig] = useState<{
    termId: string;
    termLabel: string;
  } | null>(null);

  const handleGenerateFranchiseReport = (termId: string, reportType: string, termLabel: string) => {
    setFranchiseReportConfig({
      termId,
      termLabel
    });
  };

  if (franchiseReportConfig) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => setFranchiseReportConfig(null)}
          >
            ← Back to Classes List
          </Button>
        </div>
        <FranchiseClassesReport 
          termId={franchiseReportConfig.termId}
          termLabel={franchiseReportConfig.termLabel}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-36">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Classes List</CardTitle>
            <Button
              onClick={() => setShowFranchiseModal(true)}
              variant="mckaynine"
              size="sm"
            >
              <FileBarChart className="h-4 w-4 mr-2" />
              Generate Franchise Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {classesData.map((classGroup) => (
              <div key={classGroup.className} className="border rounded-lg">
                <div className="bg-muted p-4 rounded-t-lg">
                  <h3 className="text-lg font-bold">{classGroup.className}</h3>
                </div>
                <div className="divide-y">
                  {classGroup.handlers.map((handler) => (
                    <div key={`${handler.clientId}-${handler.dogId}`} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {handler.clientName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {handler.dogName} ({handler.dogBreed})
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm ${handler.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                            {handler.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Attendance: {handler.attendanceCount} / {handler.totalClasses}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <FranchiseReportModal
        open={showFranchiseModal}
        onOpenChange={setShowFranchiseModal}
        onGenerateReport={handleGenerateFranchiseReport}
      />
    </>
  );
}

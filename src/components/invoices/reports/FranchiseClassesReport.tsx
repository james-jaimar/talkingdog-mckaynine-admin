
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFranchiseClassesData } from "@/hooks/useFranchiseClassesData";
import { Loader2, Download } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { FranchiseReportPDFGenerator } from "./pdf/FranchiseReportPDFGenerator";
import { toast } from "sonner";
import { useState } from "react";

interface FranchiseClassesReportProps {
  termId: string;
  termLabel: string;
}

export function FranchiseClassesReport({ termId, termLabel }: FranchiseClassesReportProps) {
  const { data: franchiseData, isLoading, error } = useFranchiseClassesData(termId);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    if (!franchiseData) return;
    
    setIsGeneratingPDF(true);
    try {
      const pdfGenerator = new FranchiseReportPDFGenerator();
      const pdfBlob = await pdfGenerator.generateReport(franchiseData, termLabel);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Franchise-Classes-Report-${termLabel.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("PDF report downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading franchise report...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error loading franchise report</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Term ID: {termId}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!franchiseData?.classes || franchiseData.classes.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Franchise Classes Report - {termLabel}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground font-medium">No classes found for the selected term.</p>
            <p className="text-sm text-muted-foreground mt-2">
              This could mean:
            </p>
            <ul className="text-xs text-muted-foreground mt-2 list-disc list-inside">
              <li>No classes are scheduled for this term</li>
              <li>No bookings exist for scheduled classes</li>
              <li>Classes exist but have no enrolled handlers</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3 border-t pt-2">
              Debug Info - Term ID: {termId}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Franchise Classes Report - {termLabel}</CardTitle>
            <Button 
              onClick={handleDownloadPDF} 
              disabled={isGeneratingPDF}
              className="flex items-center gap-2"
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Course Fees</h3>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(franchiseData.reportTotals.totalCourseFees)}
              </p>
            </div>
            <div className="bg-cyan-50 p-4 rounded-lg">
              <h3 className="font-semibold text-cyan-900">Enrollment Fees</h3>
              <p className="text-xs text-cyan-700 mb-1">Starter Kits</p>
              <p className="text-2xl font-bold text-cyan-600">
                {formatCurrency(franchiseData.reportTotals.totalEnrollmentFees)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Franchise Fees</h3>
              <p className="text-xs text-green-700 mb-1">15% of course fees</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(franchiseData.reportTotals.totalFranchiseFees)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Total Due</h3>
              <p className="text-xs text-purple-700 mb-1">Enrollment + Franchise</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(franchiseData.reportTotals.totalAmount)}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {franchiseData.classes.map((classGroup, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader className="bg-blue-50 py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{classGroup.className}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {classGroup.classType} • {classGroup.handlers.length} handlers
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Class Total: {formatCurrency(classGroup.classTotals.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground">Franchise Fee: {formatCurrency(classGroup.classTotals.totalFranchiseFees)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Handler</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dog</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Course Fee</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Enrollment Fee</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Franchise Fee</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {classGroup.handlers.map((handler) => (
                          <tr key={`${handler.clientId}-${handler.dogId}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{handler.clientName}</td>
                            <td className="px-4 py-3 text-sm">
                              <div>
                                <p className="font-medium">{handler.dogName}</p>
                                <p className="text-xs text-gray-500">{handler.dogBreed}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {handler.clientEmail}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {formatCurrency(handler.courseFeeAmount)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {handler.enrollmentFeeAmount > 0 ? formatCurrency(handler.enrollmentFeeAmount) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                              {formatCurrency(handler.franchiseFee)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium">
                              {formatCurrency(handler.totalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-3 border-t">
                    <div className="flex justify-end text-sm font-medium space-x-6">
                      <span>Course Fees: {formatCurrency(classGroup.classTotals.totalCourseFees)}</span>
                      <span>Enrollment Fees: {formatCurrency(classGroup.classTotals.totalEnrollmentFees)}</span>
                      <span className="text-green-600">Franchise Fee: {formatCurrency(classGroup.classTotals.totalFranchiseFees)}</span>
                      <span className="text-purple-600">Total Due: {formatCurrency(classGroup.classTotals.totalAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

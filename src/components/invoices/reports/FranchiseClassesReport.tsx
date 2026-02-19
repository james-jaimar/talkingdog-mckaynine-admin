import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFranchiseMonthlyData, useFranchisePaymentMutation } from "@/hooks/useFranchiseMonthlyData";
import { Loader2, Download, CreditCard, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { FranchiseReportPDFGenerator } from "./pdf/FranchiseReportPDFGenerator";
import { toast } from "sonner";
import { MonthSelector } from "./MonthSelector";
import { FranchisePaymentDialog } from "./FranchisePaymentDialog";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useBranch } from "@/context/BranchContext";

export function FranchiseClassesReport() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  const { currentBranch } = useBranch();
  const queryClient = useQueryClient();
  const { data: franchiseData, isLoading, error } = useFranchiseMonthlyData({
    month: selectedMonth,
    year: selectedYear
  });
  const { upsertPayment } = useFranchisePaymentMutation();

  const handleDownloadPDF = async () => {
    if (!franchiseData) return;
    
    setIsGeneratingPDF(true);
    try {
      const pdfGenerator = new FranchiseReportPDFGenerator();
      const pdfBlob = await pdfGenerator.generateReport(
        franchiseData, 
        franchiseData.monthLabel,
        currentBranch?.name
      );
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Franchise-Report-${franchiseData.monthLabel.replace(/\s+/g, '-')}.pdf`;
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

  const handleSavePayment = async (payment: {
    amountPaid: number;
    paymentDate?: string;
    paymentReference?: string;
    paymentMethod?: string;
    notes?: string;
    status: 'pending' | 'partial' | 'paid';
  }) => {
    if (!franchiseData) return;
    
    try {
      await upsertPayment({
        month: selectedMonth,
        year: selectedYear,
        totalCourseFees: franchiseData.reportTotals.totalCourseFees,
        totalEnrollmentFees: franchiseData.reportTotals.totalEnrollmentFees,
        totalFranchiseFees: franchiseData.reportTotals.totalFranchiseFees,
        totalDue: franchiseData.reportTotals.totalAmount,
        ...payment
      });
      
      // Invalidate query to refresh data
      queryClient.invalidateQueries({ 
        queryKey: ['franchise-monthly-data', currentBranch?.id, selectedMonth, selectedYear] 
      });
      
      toast.success("Payment recorded successfully!");
    } catch (error) {
      console.error("Error saving payment:", error);
      toast.error("Failed to save payment");
      throw error;
    }
  };

  const getPaymentStatusBadge = () => {
    if (!franchiseData?.paymentStatus) {
      return (
        <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50">
          <Clock className="h-3 w-3" />
          Not Recorded
        </Badge>
      );
    }
    
    switch (franchiseData.paymentStatus.status) {
      case 'paid':
        return (
          <Badge className="gap-1 bg-green-100 text-green-700 border-green-300">
            <CheckCircle2 className="h-3 w-3" />
            Paid
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300 bg-blue-50">
            <AlertCircle className="h-3 w-3" />
            Partial ({formatCurrency(franchiseData.paymentStatus.amountPaid)})
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
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
          </div>
        </CardContent>
      </Card>
    );
  }

  const monthLabel = franchiseData?.monthLabel || '';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <CardTitle>Franchise Report - {monthLabel}</CardTitle>
              {getPaymentStatusBadge()}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <MonthSelector
                month={selectedMonth}
                year={selectedYear}
                onMonthChange={setSelectedMonth}
                onYearChange={setSelectedYear}
              />
              <Button 
                variant="outline"
                onClick={() => setShowPaymentDialog(true)} 
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Record Payment
              </Button>
              <Button 
                onClick={handleDownloadPDF} 
                disabled={isGeneratingPDF || !franchiseData?.classes?.length}
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
          </div>
        </CardHeader>
        <CardContent>
          {!franchiseData?.classes || franchiseData.classes.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <p className="text-muted-foreground font-medium">No invoices found for {monthLabel}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Invoices issued during this month will appear here.
                </p>
              </div>
            </div>
          ) : (
            <>
              {(() => {
                const totalDue = franchiseData.reportTotals.totalAmount;
                const amountPaid = franchiseData.paymentStatus?.amountPaid || 0;
                const balance = Math.max(0, totalDue - amountPaid);
                const isPaid = franchiseData.paymentStatus?.status === 'paid';
                const isPartial = franchiseData.paymentStatus?.status === 'partial';

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-900">Course Fees</h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(franchiseData.reportTotals.totalCourseFees)}
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
                      <p className="text-xs text-purple-700 mb-1">Franchise Fees</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(totalDue)}
                      </p>
                    </div>
                    {isPaid ? (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-1 mb-1">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <h3 className="font-semibold text-green-900">Paid in Full</h3>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(0)}
                        </p>
                        <p className="text-xs text-green-700 mt-1">Paid: {formatCurrency(amountPaid)}</p>
                      </div>
                    ) : isPartial ? (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-900">Balance Outstanding</h3>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(balance)}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">Paid: {formatCurrency(amountPaid)}</p>
                      </div>
                    ) : (
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <h3 className="font-semibold text-amber-900">Balance Outstanding</h3>
                        <p className="text-xs text-amber-700 mb-1">No payment recorded</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {formatCurrency(totalDue)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

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
                          <span className="text-green-600">Franchise Fee: {formatCurrency(classGroup.classTotals.totalFranchiseFees)}</span>
                          <span className="text-purple-600">Total Due: {formatCurrency(classGroup.classTotals.totalAmount)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <FranchisePaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        totalDue={franchiseData?.reportTotals.totalAmount || 0}
        currentPayment={franchiseData?.paymentStatus}
        onSave={handleSavePayment}
        monthLabel={monthLabel}
      />
    </div>
  );
}

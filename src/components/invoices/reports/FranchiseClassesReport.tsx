
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFranchiseClassesData } from "@/hooks/useFranchiseClassesData";
import { Loader2, Download, Mail, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { FranchiseReportPDF } from "./pdf/FranchiseReportPDF";
import { toast } from "sonner";

interface FranchiseClassesReportProps {
  termId: string;
  termLabel?: string;
}

export function FranchiseClassesReport({ termId, termLabel }: FranchiseClassesReportProps) {
  const { data: reportData, isLoading } = useFranchiseClassesData(termId);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const getPaymentStatusVariant = (status: string) => {
    switch(status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'refunded': return 'destructive';
      default: return 'outline';
    }
  };

  const handleGeneratePDF = async () => {
    if (!reportData) return;
    
    setIsGeneratingPDF(true);
    try {
      const pdfGenerator = new FranchiseReportPDF();
      const pdfBlob = await pdfGenerator.generateReport(reportData, termLabel || `Term ${termId}`);
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      toast.success("PDF generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `franchise-classes-report-${termLabel || termId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleViewPDF = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const handleEmailPDF = () => {
    // TODO: Implement email functionality
    toast.info("Email functionality will be implemented next");
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-36">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!reportData || reportData.classes.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Franchise Classes Report - {termLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">No classes found for the selected term.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Franchise Classes Report - {termLabel}</CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              variant="outline"
              size="sm"
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Generate PDF
            </Button>
            {pdfUrl && (
              <>
                <Button onClick={handleViewPDF} variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  View PDF
                </Button>
                <Button onClick={handleDownloadPDF} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={handleEmailPDF} variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {reportData.classes.map((classGroup, index) => (
            <div key={index} className="border rounded-lg">
              <div className="bg-muted p-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">{classGroup.className}</h3>
                  <div className="text-sm text-muted-foreground">
                    {classGroup.classType} • Course Fee: {formatCurrency(classGroup.courseFee)}
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Handler</TableHead>
                      <TableHead>Dog</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Franchise Fee</TableHead>
                      <TableHead className="text-right">Admin Fee</TableHead>
                      <TableHead className="text-right">McKaynine Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classGroup.handlers.map((handler, handlerIndex) => (
                      <TableRow key={handlerIndex}>
                        <TableCell className="font-medium">{handler.clientName}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{handler.dogName}</div>
                            <div className="text-sm text-muted-foreground">{handler.dogBreed}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {handler.attendanceCount} / {handler.totalClasses}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPaymentStatusVariant(handler.paymentStatus)}>
                            {handler.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(handler.invoiceAmount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(handler.franchiseFee)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(handler.adminFee)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(handler.mckaynineCommission)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Class Totals */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-end">
                    <div className="grid grid-cols-4 gap-4 text-sm font-medium">
                      <div className="text-right">
                        <div className="text-muted-foreground">Total Revenue</div>
                        <div>{formatCurrency(classGroup.classTotals.totalRevenue)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">Franchise Fees</div>
                        <div>{formatCurrency(classGroup.classTotals.totalFranchiseFees)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">Admin Fees</div>
                        <div>{formatCurrency(classGroup.classTotals.totalAdminFees)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">McKaynine Commission</div>
                        <div>{formatCurrency(classGroup.classTotals.totalMckaynineCommission)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Report Totals */}
          <div className="border-t-2 pt-6">
            <div className="bg-primary/5 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Report Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{reportData.reportTotals.totalHandlers}</div>
                  <div className="text-sm text-muted-foreground">Total Handlers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatCurrency(reportData.reportTotals.totalRevenue)}</div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatCurrency(reportData.reportTotals.totalFranchiseFees)}</div>
                  <div className="text-sm text-muted-foreground">Total Franchise Fees</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatCurrency(reportData.reportTotals.totalAdminFees)}</div>
                  <div className="text-sm text-muted-foreground">Total Admin Fees</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatCurrency(reportData.reportTotals.totalMckaynineCommission)}</div>
                  <div className="text-sm text-muted-foreground">McKaynine Commission</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

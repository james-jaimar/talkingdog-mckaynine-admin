import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import {
  generateTrainerStatementPDF,
  downloadTrainerStatementPDF,
} from "./pdf/TrainerStatementPDF";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ClassDetail {
  className: string;
  classDate: string;
  bookingsCount: number;
  commissionAmount: number;
  paymentStatus: "paid" | "unpaid" | "partial";
}

interface TrainerStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainer: {
    id: string;
    trainerName: string;
    email?: string;
    totalEarned: number;
    paid: number;
    pending: number;
    classDetails?: any[];
  };
  dateRange: { from: Date; to: Date };
  termInfo?: string;
  branchName?: string;
}

export function TrainerStatementDialog({
  open,
  onOpenChange,
  trainer,
  dateRange,
  termInfo = "Term Statement",
  branchName = "delta",
}: TrainerStatementDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Reset PDF when dialog closes
  useEffect(() => {
    if (!open) {
      setPdfPreviewUrl(null);
      setPdfDownloadUrl(null);
    }
  }, [open]);

  const prepareClassData = (): ClassDetail[] => {
    if (!trainer.classDetails || trainer.classDetails.length === 0) {
      return [];
    }

    return trainer.classDetails.map((cls: any) => {
      // Get the booking count - could be 'bookings' (number) or 'bookingsCount' or array length
      let bookingsCount = 0;
      if (typeof cls.bookings === 'number') {
        bookingsCount = cls.bookings;
      } else if (typeof cls.bookingsCount === 'number') {
        bookingsCount = cls.bookingsCount;
      } else if (Array.isArray(cls.bookings)) {
        bookingsCount = cls.bookings.length;
      } else if (Array.isArray(cls.bookingsDetails)) {
        bookingsCount = cls.bookingsDetails.length;
      }

      // Get commission amount - use potentialRevenue or revenue from formatTrainerData
      const commissionAmount = cls.potentialRevenue || cls.revenue || cls.commissionAmount || cls.trainerCommission || 0;

      // Get class date
      let classDate = "N/A";
      const dateSource = cls.classDate || cls.scheduleDate || cls.start_time;
      if (dateSource) {
        try {
          classDate = format(new Date(dateSource), "dd/MM/yyyy");
        } catch {
          classDate = "N/A";
        }
      }

      return {
        className: cls.className || cls.class_name || "Unknown Class",
        classDate,
        bookingsCount,
        commissionAmount,
        paymentStatus: cls.paymentStatus || (cls.isPaid ? "paid" : "unpaid"),
      };
    });
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const classes = prepareClassData();

      const dataUrl = await generateTrainerStatementPDF({
        trainerName: trainer.trainerName,
        trainerEmail: trainer.email || "No email on file",
        termInfo,
        dateRange,
        totalCommission: trainer.totalEarned,
        totalPaid: trainer.paid,
        outstanding: trainer.pending,
        classes,
        branchName,
      });

      // Use data URL for preview to avoid browser/extension blocking of blob: URLs
      setPdfPreviewUrl(dataUrl);
      setPdfDownloadUrl(dataUrl);

      toast({
        title: "Statement Generated",
        description: "Preview is ready. You can now download the PDF.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate statement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (pdfDownloadUrl) {
      // If we already have a blob URL, a simple anchor download works.
      // If it's a data URL, use existing helper (keeps filename behavior).
      if (pdfDownloadUrl.startsWith("blob:")) {
        const link = document.createElement("a");
        link.href = pdfDownloadUrl;
        link.download = `Statement_${trainer.trainerName.replace(/\s+/g, "_")}_${termInfo.replace(/\s+/g, "_")}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        downloadTrainerStatementPDF(pdfDownloadUrl, trainer.trainerName, termInfo);
      }
      toast({
        title: "Downloaded",
        description: "Statement PDF has been downloaded.",
      });
    }
  };

  const handleQuickDownload = async () => {
    setIsGenerating(true);
    try {
      const classes = prepareClassData();

      const dataUrl = await generateTrainerStatementPDF({
        trainerName: trainer.trainerName,
        trainerEmail: trainer.email || "No email on file",
        termInfo,
        dateRange,
        totalCommission: trainer.totalEarned,
        totalPaid: trainer.paid,
        outstanding: trainer.pending,
        classes,
        branchName,
      });

      // Download immediately (use same logic as handleDownload)
      if (dataUrl.startsWith("data:")) {
        downloadTrainerStatementPDF(dataUrl, trainer.trainerName, termInfo);
      }

      toast({
        title: "Downloaded",
        description: "Statement PDF has been downloaded.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate statement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Trainer Payment Statement
          </DialogTitle>
          <DialogDescription>
            Generate a payment statement for {trainer.trainerName} - {termInfo}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Summary Card */}
          <div className="bg-muted/50 rounded-lg p-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Commission</p>
              <p className="text-lg font-semibold">
                R {trainer.totalEarned.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Already Paid</p>
              <p className="text-lg font-semibold text-green-600">
                R {trainer.paid.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className={`text-lg font-semibold ${trainer.pending > 0 ? "text-red-600" : ""}`}>
                R {trainer.pending.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* PDF Preview */}
          {pdfPreviewUrl ? (
            <div className="border rounded-lg overflow-hidden bg-gray-100" style={{ height: "400px" }}>
              <object data={pdfPreviewUrl} type="application/pdf" className="w-full h-full" aria-label="Statement Preview">
                <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                  Preview blocked by your browser. Use “Open Preview” or download the PDF.
                </div>
              </object>
            </div>
          ) : (
            <div className="border rounded-lg flex items-center justify-center bg-muted/30" style={{ height: "400px" }}>
              <div className="text-center space-y-2">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">Click "Generate Preview" to see the statement</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!pdfPreviewUrl ? (
            <>
              <Button onClick={handleGeneratePDF} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Preview
                  </>
                )}
              </Button>
              <Button onClick={handleQuickDownload} disabled={isGenerating} variant="secondary">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Quick Download
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (pdfPreviewUrl) window.open(pdfPreviewUrl, "_blank", "noopener,noreferrer");
                }}
              >
                Open Preview
              </Button>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

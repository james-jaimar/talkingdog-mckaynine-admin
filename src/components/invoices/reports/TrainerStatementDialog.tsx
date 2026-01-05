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
import { generateTrainerStatementPDF, downloadTrainerStatementPDF } from "./pdf/TrainerStatementPDF";
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
}

export function TrainerStatementDialog({
  open,
  onOpenChange,
  trainer,
  dateRange,
  termInfo = "Term Statement",
}: TrainerStatementDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Reset PDF when dialog closes or trainer changes
  useEffect(() => {
    if (!open) {
      setPdfDataUrl(null);
    }
  }, [open]);

  const prepareClassData = (): ClassDetail[] => {
    if (!trainer.classDetails || trainer.classDetails.length === 0) {
      return [];
    }

    return trainer.classDetails.map((cls: any) => ({
      className: cls.className || cls.class_name || "Unknown Class",
      classDate: cls.classDate || cls.start_time 
        ? format(new Date(cls.classDate || cls.start_time), "dd/MM/yyyy")
        : "N/A",
      bookingsCount: cls.bookingsCount || cls.bookings?.length || 0,
      commissionAmount: cls.commissionAmount || cls.trainerCommission || 0,
      paymentStatus: cls.paymentStatus || (cls.isPaid ? "paid" : "unpaid"),
    }));
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
      });

      setPdfDataUrl(dataUrl);
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
    if (pdfDataUrl) {
      downloadTrainerStatementPDF(pdfDataUrl, trainer.trainerName, termInfo);
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
      });

      downloadTrainerStatementPDF(dataUrl, trainer.trainerName, termInfo);
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
          {pdfDataUrl ? (
            <div className="border rounded-lg overflow-hidden bg-gray-100" style={{ height: "400px" }}>
              <iframe
                src={pdfDataUrl}
                className="w-full h-full"
                title="Statement Preview"
              />
            </div>
          ) : (
            <div className="border rounded-lg flex items-center justify-center bg-muted/30" style={{ height: "400px" }}>
              <div className="text-center space-y-2">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Click "Generate Preview" to see the statement
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!pdfDataUrl ? (
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
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

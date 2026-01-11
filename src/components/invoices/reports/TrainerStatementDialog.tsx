import { useState } from "react";
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
import { TrainerStatementHTMLPreview } from "./TrainerStatementHTMLPreview";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

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

  const handleDownload = async () => {
    setIsDownloading(true);
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

      downloadTrainerStatementPDF(dataUrl, trainer.trainerName, termInfo);

      toast({
        title: "Downloaded",
        description: "Statement PDF has been downloaded.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate statement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const classes = prepareClassData();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Trainer Payment Statement
          </DialogTitle>
          <DialogDescription>
            Statement for {trainer.trainerName} - {termInfo}
          </DialogDescription>
        </DialogHeader>

        {/* HTML Preview - scrollable */}
        <ScrollArea className="flex-1 border rounded-lg max-h-[60vh]">
          <TrainerStatementHTMLPreview
            trainerName={trainer.trainerName}
            trainerEmail={trainer.email || "No email on file"}
            termInfo={termInfo}
            dateRange={dateRange}
            totalCommission={trainer.totalEarned}
            totalPaid={trainer.paid}
            outstanding={trainer.pending}
            classes={classes}
            branchName={branchName}
          />
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

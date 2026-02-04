import { useState, useMemo } from "react";
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

interface HandlerDetail {
  handlerName: string;
  handlerEmail?: string;
  dogName?: string;
  dogBreed?: string;
  courseFee?: number;
  commissionAmount: number;
  paymentStatus?: string;
}

interface ClassDetail {
  className: string;
  classDate: string;
  bookingsCount: number;
  commissionAmount: number;
  paymentStatus: "paid" | "unpaid" | "partial";
  handlers?: HandlerDetail[];
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
  selectedScheduleIds?: string[];
}

export function TrainerStatementDialog({
  open,
  onOpenChange,
  trainer,
  dateRange,
  termInfo = "Term Statement",
  branchName = "delta",
  selectedScheduleIds,
}: TrainerStatementDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  // Filter class details based on selection
  const filteredClassDetails = useMemo(() => {
    if (!trainer.classDetails || trainer.classDetails.length === 0) {
      return [];
    }
    
    // If no selection provided or empty, use all classes
    if (!selectedScheduleIds || selectedScheduleIds.length === 0) {
      return trainer.classDetails;
    }
    
    // Filter by selected schedule IDs
    return trainer.classDetails.filter((cls: any) => 
      selectedScheduleIds.includes(cls.scheduleId)
    );
  }, [trainer.classDetails, selectedScheduleIds]);

  // Recalculate totals based on filtered classes
  const recalculatedTotals = useMemo(() => {
    let totalEarned = 0;
    let paid = 0;
    let pending = 0;

    filteredClassDetails.forEach((cls: any) => {
      const commissionAmount = cls.potentialRevenue || cls.revenue || cls.commissionAmount || cls.trainerCommission || 0;
      totalEarned += commissionAmount;
      
      if (cls.isPaid) {
        paid += commissionAmount;
      } else {
        pending += commissionAmount;
      }
    });

    return { totalEarned, paid, pending };
  }, [filteredClassDetails]);

  const prepareClassData = (): ClassDetail[] => {
    if (filteredClassDetails.length === 0) {
      return [];
    }

    return filteredClassDetails.map((cls: any) => {
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

      // Extract handler details from bookingsDetails
      const handlers: HandlerDetail[] = (cls.bookingsDetails || []).map((booking: any) => ({
        handlerName: booking.handlerName || "Unknown Handler",
        handlerEmail: booking.handlerEmail || booking.clientEmail || "",
        dogName: booking.dogName || "",
        dogBreed: booking.dogBreed || "",
        courseFee: booking.courseFee || booking.amount || 0,
        commissionAmount: booking.commissionAmount || 0,
        paymentStatus: booking.paymentStatus || cls.paymentStatus || "unpaid"
      }));

      return {
        className: cls.className || cls.class_name || "Unknown Class",
        classDate,
        bookingsCount,
        commissionAmount,
        paymentStatus: cls.paymentStatus || (cls.isPaid ? "paid" : "unpaid"),
        handlers,
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
        totalCommission: recalculatedTotals.totalEarned,
        totalPaid: recalculatedTotals.paid,
        outstanding: recalculatedTotals.pending,
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
  const selectionInfo = selectedScheduleIds && selectedScheduleIds.length > 0 
    ? `${selectedScheduleIds.length} classes selected`
    : "All classes";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Trainer Payment Statement
          </DialogTitle>
          <DialogDescription>
            Statement for {trainer.trainerName} - {termInfo} ({selectionInfo})
          </DialogDescription>
        </DialogHeader>

        {/* HTML Preview - scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y border rounded-lg">
          <TrainerStatementHTMLPreview
            trainerName={trainer.trainerName}
            trainerEmail={trainer.email || "No email on file"}
            termInfo={termInfo}
            dateRange={dateRange}
            totalCommission={recalculatedTotals.totalEarned}
            totalPaid={recalculatedTotals.paid}
            outstanding={recalculatedTotals.pending}
            classes={classes}
            branchName={branchName}
          />
        </div>

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

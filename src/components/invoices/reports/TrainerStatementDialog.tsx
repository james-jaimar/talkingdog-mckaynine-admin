import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, Mail } from "lucide-react";
import {
  generateTrainerStatementPDF,
  downloadTrainerStatementPDF,
} from "./pdf/TrainerStatementPDF";
import { format, isSameMonth, startOfMonth, endOfMonth } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { TrainerStatementHTMLPreview } from "./TrainerStatementHTMLPreview";
import { TrainerStatementEmailDialog } from "./TrainerStatementEmailDialog";

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
  isSubstitute?: boolean;
  substituteDates?: number;
  totalDates?: number;
  originalTrainerName?: string;
  substituteTrainerName?: string;
}

interface TrainerStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainer: {
    id: string;
    trainerName: string;
    trainerEmail?: string;
    totalEarned: number;
    paid: number;
    pending: number;
    classDetails?: any[];
  };
  dateRange: { from: Date; to: Date };
  termInfo?: string;
  branchName?: string;
  branchId?: string;
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
  const [isGeneratingForEmail, setIsGeneratingForEmail] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
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

  // Derive sensible defaults for the statement period from the selected classes
  const derivedPeriod = useMemo(() => {
    const dates: Date[] = [];
    filteredClassDetails.forEach((cls: any) => {
      const src = cls.classDate || cls.scheduleDate || cls.start_time;
      if (!src) return;
      const d = new Date(src);
      if (!isNaN(d.getTime())) dates.push(d);
    });

    const hasSelection = !!selectedScheduleIds && selectedScheduleIds.length > 0;
    if (!hasSelection || dates.length === 0) {
      return { label: termInfo, from: dateRange.from, to: dateRange.to };
    }

    const from = new Date(Math.min(...dates.map((d) => d.getTime())));
    const to = new Date(Math.max(...dates.map((d) => d.getTime())));
    const label = isSameMonth(from, to)
      ? format(from, "MMMM yyyy")
      : `${format(from, "MMM")} - ${format(to, "MMM yyyy")}`;

    return { label, from, to };
  }, [filteredClassDetails, selectedScheduleIds, termInfo, dateRange.from, dateRange.to]);

  const [periodLabel, setPeriodLabel] = useState(derivedPeriod.label);
  const [periodFrom, setPeriodFrom] = useState<Date>(derivedPeriod.from);
  const [periodTo, setPeriodTo] = useState<Date>(derivedPeriod.to);

  // Re-seed each time the dialog opens
  useEffect(() => {
    if (open) {
      setPeriodLabel(derivedPeriod.label);
      setPeriodFrom(derivedPeriod.from);
      setPeriodTo(derivedPeriod.to);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const resetPeriod = () => {
    setPeriodLabel(derivedPeriod.label);
    setPeriodFrom(derivedPeriod.from);
    setPeriodTo(derivedPeriod.to);
  };

  const snapToMonth = (d: Date) => {
    setPeriodFrom(startOfMonth(d));
    setPeriodTo(endOfMonth(d));
    setPeriodLabel(format(d, "MMMM yyyy"));
  };

  const effectiveDateRange = useMemo(
    () => ({ from: periodFrom, to: periodTo }),
    [periodFrom, periodTo]
  );


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
        isSubstitute: cls.isSubstitute,
        substituteDates: cls.substituteDates,
        totalDates: cls.totalDates,
        originalTrainerName: cls.originalTrainerName,
        substituteTrainerName: cls.substituteTrainerName,
      };
    });
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const classes = prepareClassData();

      const dataUrl = await generateTrainerStatementPDF({
        trainerName: trainer.trainerName,
        trainerEmail: trainer.trainerEmail || "No email on file",
        termInfo: periodLabel,
        dateRange: effectiveDateRange,
        totalCommission: recalculatedTotals.totalEarned,
        totalPaid: recalculatedTotals.paid,
        outstanding: recalculatedTotals.pending,
        classes,
        branchName,
      });

      downloadTrainerStatementPDF(dataUrl, trainer.trainerName, periodLabel);

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

  const handleEmailStatement = async () => {
    setIsGeneratingForEmail(true);
    try {
      const classes = prepareClassData();

      const dataUrl = await generateTrainerStatementPDF({
        trainerName: trainer.trainerName,
        trainerEmail: trainer.trainerEmail || "No email on file",
        termInfo: periodLabel,
        dateRange: effectiveDateRange,
        totalCommission: recalculatedTotals.totalEarned,
        totalPaid: recalculatedTotals.paid,
        outstanding: recalculatedTotals.pending,
        classes,
        branchName,
      });

      // Convert data URL to base64 (remove prefix)
      const base64 = dataUrl.split(",")[1];
      setPdfBase64(base64);
      setEmailDialogOpen(true);
    } catch (error) {
      console.error("Error generating PDF for email:", error);
      toast({
        title: "Error",
        description: "Failed to generate statement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingForEmail(false);
    }
  };

  const classes = prepareClassData();
  const selectionInfo = selectedScheduleIds && selectedScheduleIds.length > 0 
    ? `${selectedScheduleIds.length} classes selected`
    : "All classes";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-full h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Trainer Payment Statement
            </DialogTitle>
            <DialogDescription>
              Statement for {trainer.trainerName} - {periodLabel} ({selectionInfo})
            </DialogDescription>
          </DialogHeader>

          {/* HTML Preview - scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y border rounded-lg">
            <TrainerStatementHTMLPreview
              trainerName={trainer.trainerName}
              trainerEmail={trainer.trainerEmail || "No email on file"}
              termInfo={periodLabel}
              dateRange={effectiveDateRange}
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
            <Button 
              variant="outline" 
              onClick={handleEmailStatement} 
              disabled={isGeneratingForEmail || isDownloading}
            >
              {isGeneratingForEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Email Statement
                </>
              )}
            </Button>
            <Button onClick={handleDownload} disabled={isDownloading || isGeneratingForEmail}>
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

      {/* Email composition dialog */}
      <TrainerStatementEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        trainerName={trainer.trainerName}
        trainerEmail={trainer.trainerEmail || ""}
        termInfo={periodLabel}
        dateRange={effectiveDateRange}
        totalCommission={recalculatedTotals.totalEarned}
        totalPaid={recalculatedTotals.paid}
        outstanding={recalculatedTotals.pending}
        classes={classes}
        branchName={branchName}
        pdfBase64={pdfBase64}
        onSuccess={() => {
          // Optionally close the main dialog too
        }}
      />
    </>
  );
}

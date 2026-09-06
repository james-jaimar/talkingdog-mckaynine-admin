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
import {
  buildStatementFromTrainerClasses,
  statementPeriodFromMonthKeys,
  statementPeriodMonthKeys,
} from "@/lib/financial/trainerStatement";

interface HandlerDetail {
  handlerName: string;
  handlerEmail?: string;
  dogName?: string;
  dogBreed?: string;
  courseFee?: number;
  commissionAmount: number;
  paymentStatus?: string;
  periodLabel?: string;
  periodInferred?: boolean;
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
  selectedScheduleIds?: string[];
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
  const [isGeneratingForEmail, setIsGeneratingForEmail] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const { toast } = useToast();

  // Default the period from the reporting months available in the already-loaded
  // class details (any term), falling back to the page's current selection.
  const initialPeriod = useMemo(() => {
    const monthKeys = Array.from(
      new Set(
        (trainer.classDetails || [])
          .flatMap((cls: any) => ((cls.periodKeys || []) as string[]).filter(Boolean))
      )
    ).sort();

    const derived = statementPeriodFromMonthKeys(monthKeys);
    if (derived) return derived;

    const dates: Date[] = [];
    (trainer.classDetails || []).forEach((cls: any) => {
      const src = cls.classDate || cls.scheduleDate || cls.start_time;
      if (!src) return;
      const d = new Date(src);
      if (!isNaN(d.getTime())) dates.push(d);
    });

    if (dates.length > 0) {
      const from = startOfMonth(new Date(Math.min(...dates.map((d) => d.getTime()))));
      const to = endOfMonth(new Date(Math.max(...dates.map((d) => d.getTime()))));
      const label = isSameMonth(from, to)
        ? format(from, "MMMM yyyy")
        : `${format(from, "MMM")} - ${format(to, "MMM yyyy")}`;
      return { label, from, to };
    }

    return { label: termInfo, from: dateRange.from, to: dateRange.to };
  }, [trainer.classDetails, termInfo, dateRange.from, dateRange.to]);

  const [periodLabel, setPeriodLabel] = useState(initialPeriod.label);
  const [periodFrom, setPeriodFrom] = useState<Date>(initialPeriod.from);
  const [periodTo, setPeriodTo] = useState<Date>(initialPeriod.to);

  // Re-seed each time the dialog opens
  useEffect(() => {
    if (open) {
      setPeriodLabel(initialPeriod.label);
      setPeriodFrom(initialPeriod.from);
      setPeriodTo(initialPeriod.to);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const resetPeriod = () => {
    setPeriodLabel(initialPeriod.label);
    setPeriodFrom(initialPeriod.from);
    setPeriodTo(initialPeriod.to);
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

  const statement = useMemo(
    () => buildStatementFromTrainerClasses(
      trainer.classDetails || [],
      statementPeriodMonthKeys(periodFrom, periodTo)
    ),
    [trainer.classDetails, periodFrom, periodTo]
  );

  const prepareClassData = (): ClassDetail[] =>
    statement.classes.map((cls) => ({
      className: cls.className,
      classDate: cls.classDate,
      bookingsCount: cls.bookingsCount,
      commissionAmount: cls.commissionAmount,
      paymentStatus: cls.paymentStatus,
      handlers: cls.handlers.map((handler) => ({
        handlerName: handler.handlerName,
        handlerEmail: handler.handlerEmail,
        dogName: handler.dogName,
        dogBreed: handler.dogBreed,
        courseFee: handler.courseFee,
        commissionAmount: handler.commissionAmount,
        paymentStatus: handler.paymentStatus,
        periodLabel: handler.periodLabel,
        periodInferred: handler.periodInferred,
      })),
      isSubstitute: cls.isSubstitute,
      substituteDates: cls.substituteDates,
      totalDates: cls.totalDates,
      originalTrainerName: cls.originalTrainerName,
      substituteTrainerName: cls.substituteTrainerName,
    }));

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const classes = prepareClassData();

      const dataUrl = await generateTrainerStatementPDF({
        trainerName: trainer.trainerName,
        trainerEmail: trainer.trainerEmail || "No email on file",
        termInfo: periodLabel,
        dateRange: effectiveDateRange,
        totalCommission: statement.totalCommission,
        totalPaid: statement.totalPaid,
        outstanding: statement.outstanding,
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
        totalCommission: statement.totalCommission,
        totalPaid: statement.totalPaid,
        outstanding: statement.outstanding,
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
              Statement for {trainer.trainerName} - {periodLabel}
            </DialogDescription>
          </DialogHeader>

          {/* Statement period editor — controls which invoice months are loaded */}
          <div className="flex-shrink-0 rounded-lg border bg-muted/40 p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1 space-y-1">
                <Label htmlFor="statement-period-label" className="text-xs">
                  Statement period label
                </Label>
                <Input
                  id="statement-period-label"
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value)}
                  placeholder="e.g. August 2026"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-[150px] justify-start text-left font-normal")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(periodFrom, "dd MMM yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={periodFrom}
                      onSelect={(d) => d && setPeriodFrom(d)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-[150px] justify-start text-left font-normal")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(periodTo, "dd MMM yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={periodTo}
                      onSelect={(d) => d && setPeriodTo(d)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => snapToMonth(periodFrom)}
                  title="Snap the period to the whole calendar month"
                >
                  Whole month
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={resetPeriod}
                  title="Reset to initial period"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
               Only invoices reported in this period from the selected term are included.
              Invoices without a report month fall back to their invoice date.
            </p>
          </div>

          {/* HTML Preview - scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y border rounded-lg relative">
            <TrainerStatementHTMLPreview
                trainerName={trainer.trainerName}
                trainerEmail={trainer.trainerEmail || "No email on file"}
                termInfo={periodLabel}
                dateRange={effectiveDateRange}
                totalCommission={statement.totalCommission}
                totalPaid={statement.totalPaid}
                outstanding={statement.outstanding}
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
              disabled={isGeneratingForEmail || isDownloading || classes.length === 0}
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
            <Button
              onClick={handleDownload}
              disabled={isDownloading || isGeneratingForEmail || classes.length === 0}
            >
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
        totalCommission={statement.totalCommission}
        totalPaid={statement.totalPaid}
        outstanding={statement.outstanding}
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

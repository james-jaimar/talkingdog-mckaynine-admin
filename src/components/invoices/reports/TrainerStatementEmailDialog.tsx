import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, Paperclip, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEmailQueue } from "@/hooks/useEmailQueue";
import { useBranch } from "@/context/BranchContext";
import {
  generateTrainerStatementEmailSubject,
  generateTrainerStatementEmailHtml,
} from "@/lib/email/generateTrainerStatementEmail";
import { format } from "date-fns";

interface ClassDetail {
  className: string;
  classDate: string;
  bookingsCount: number;
  commissionAmount: number;
  paymentStatus: "paid" | "unpaid" | "partial";
}

interface TrainerStatementEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainerName: string;
  trainerEmail: string;
  termInfo: string;
  dateRange: { from: Date; to: Date };
  totalCommission: number;
  totalPaid: number;
  outstanding: number;
  classes: ClassDetail[];
  branchName?: string;
  pdfBase64: string | null;
  onSuccess?: () => void;
}

export function TrainerStatementEmailDialog({
  open,
  onOpenChange,
  trainerName,
  trainerEmail,
  termInfo,
  dateRange,
  totalCommission,
  totalPaid,
  outstanding,
  classes,
  branchName = "delta",
  pdfBase64,
  onSuccess,
}: TrainerStatementEmailDialogProps) {
  const { currentBranch } = useBranch();
  const { addToQueue } = useEmailQueue();

  // Email form state
  const defaultSubject = generateTrainerStatementEmailSubject(trainerName, termInfo);
  const [toEmail, setToEmail] = useState(trainerEmail);
  const [subject, setSubject] = useState(defaultSubject);
  const [isQueuing, setIsQueuing] = useState(false);

  // Reset form when dialog opens
  useMemo(() => {
    if (open) {
      setToEmail(trainerEmail);
      setSubject(generateTrainerStatementEmailSubject(trainerName, termInfo));
    }
  }, [open, trainerEmail, trainerName, termInfo]);

  // Generate HTML preview
  const htmlContent = useMemo(() => {
    return generateTrainerStatementEmailHtml({
      trainerName,
      trainerEmail,
      termInfo,
      dateRange,
      totalCommission,
      totalPaid,
      outstanding,
      classes,
      branchName,
    });
  }, [trainerName, trainerEmail, termInfo, dateRange, totalCommission, totalPaid, outstanding, classes, branchName]);

  const hasValidEmail = toEmail && toEmail.includes("@");
  const hasPdf = !!pdfBase64;

  // Generate PDF filename
  const pdfFilename = `Statement_${trainerName.replace(/\s+/g, "_")}_${termInfo.replace(/\s+/g, "_")}.pdf`;

  const handleQueueEmail = async () => {
    if (!hasValidEmail) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!currentBranch?.id) {
      toast.error("No branch selected");
      return;
    }

    setIsQueuing(true);
    try {
      // Prepare attachment if PDF is available
      const attachments = hasPdf
        ? [
            {
              filename: pdfFilename,
              content: pdfBase64,
              encoding: "base64",
              contentType: "application/pdf",
            },
          ]
        : [];

      await addToQueue.mutateAsync({
        to_email: toEmail,
        subject,
        html_content: htmlContent,
        attachments,
        from_name: `McKaynine ${branchName.charAt(0).toUpperCase() + branchName.slice(1)}`,
      });

      toast.success("Statement email added to queue");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error queuing email:", error);
      toast.error("Failed to queue email");
    } finally {
      setIsQueuing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] sm:w-full max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Statement to {trainerName}
          </DialogTitle>
          <DialogDescription>
            Review and send the commission statement via email
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 py-4">
          {/* Email form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="to_email">To</Label>
                <Input
                  id="to_email"
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="trainer@email.com"
                />
                {!hasValidEmail && toEmail && (
                  <p className="text-xs text-destructive">Please enter a valid email address</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>
            </div>

            {/* Attachment indicator */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {hasPdf ? (
                  <>
                    <span className="font-medium">{pdfFilename}</span>
                    <span className="text-muted-foreground"> (PDF attached)</span>
                  </>
                ) : (
                  <span className="text-amber-600">PDF will be generated when you click send</span>
                )}
              </span>
            </div>

            {/* Summary */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Statement Summary</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Period:</span>
                  <p className="font-medium">{format(dateRange.from, "d MMM")} - {format(dateRange.to, "d MMM yyyy")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <p className="font-medium">R {totalCommission.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Paid:</span>
                  <p className="font-medium text-green-600">R {totalPaid.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Outstanding:</span>
                  <p className="font-medium text-orange-600">R {outstanding.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{classes.length} class(es) included</p>
            </div>

            {/* HTML Preview */}
            <div className="space-y-2">
              <Label>Email Preview</Label>
              <div className="border rounded-lg overflow-hidden bg-white max-h-[300px] overflow-y-auto">
                <iframe
                  srcDoc={htmlContent}
                  title="Email Preview"
                  className="w-full h-[300px] border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>

          {!trainerEmail && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No email address on file for this trainer. Please enter an email address manually.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleQueueEmail} disabled={isQueuing || !hasValidEmail}>
            {isQueuing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Queuing...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Queue Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

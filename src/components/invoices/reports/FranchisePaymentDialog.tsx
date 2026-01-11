import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters";
import { FranchisePaymentStatus } from "@/hooks/useFranchiseMonthlyData";

interface FranchisePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalDue: number;
  currentPayment?: FranchisePaymentStatus;
  onSave: (payment: {
    amountPaid: number;
    paymentDate?: string;
    paymentReference?: string;
    paymentMethod?: string;
    notes?: string;
    status: 'pending' | 'partial' | 'paid';
  }) => Promise<void>;
  monthLabel: string;
}

export function FranchisePaymentDialog({
  open,
  onOpenChange,
  totalDue,
  currentPayment,
  onSave,
  monthLabel
}: FranchisePaymentDialogProps) {
  const [amountPaid, setAmountPaid] = useState(currentPayment?.amountPaid?.toString() || '');
  const [paymentDate, setPaymentDate] = useState(
    currentPayment?.paymentDate ? currentPayment.paymentDate.split('T')[0] : ''
  );
  const [paymentReference, setPaymentReference] = useState(currentPayment?.paymentReference || '');
  const [paymentMethod, setPaymentMethod] = useState(currentPayment?.paymentMethod || '');
  const [notes, setNotes] = useState(currentPayment?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const amount = parseFloat(amountPaid) || 0;
      let status: 'pending' | 'partial' | 'paid' = 'pending';
      
      if (amount >= totalDue) {
        status = 'paid';
      } else if (amount > 0) {
        status = 'partial';
      }

      await onSave({
        amountPaid: amount,
        paymentDate: paymentDate || undefined,
        paymentReference: paymentReference || undefined,
        paymentMethod: paymentMethod || undefined,
        notes: notes || undefined,
        status
      });
      
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAsPaid = () => {
    setAmountPaid(totalDue.toString());
    setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Franchise Payment - {monthLabel}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Due to Franchise</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalDue)}</p>
          </div>

          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="amountPaid">Amount Paid</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleMarkAsPaid}
              >
                Mark as Paid in Full
              </Button>
            </div>
            <Input
              id="amountPaid"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="paymentDate">Payment Date</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eft">EFT</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="paymentReference">Reference Number</Label>
            <Input
              id="paymentReference"
              placeholder="e.g. Bank reference"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

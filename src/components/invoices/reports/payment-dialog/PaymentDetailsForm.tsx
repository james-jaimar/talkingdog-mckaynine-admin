import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PaymentFileUploader } from "./PaymentFileUploader";

export interface PaymentDetailsFormValues {
  paymentMethod?: 'bank_transfer' | 'cash' | 'check' | 'other';
  transactionId?: string;
  paymentNotes?: string;
  sendEmail?: boolean;
  documentUrl?: string;
  documentName?: string;
  totalAmount?: number; // Optional total amount for display purposes
}

// Keep backwards compatibility
export type PaymentDetailsValues = PaymentDetailsFormValues;

export interface PaymentDetailsFormProps {
  values: PaymentDetailsFormValues;
  onChange?: (values: PaymentDetailsFormValues) => void;
  onSubmit?: (values: PaymentDetailsFormValues) => void;
  isDisabled?: boolean;
  includeEmailOption?: boolean;
  isPending?: boolean;
  trainerEmail?: string;
}

export function PaymentDetailsForm({
  values,
  onChange,
  onSubmit,
  isDisabled = false,
  includeEmailOption = true,
  isPending = false,
  trainerEmail
}: PaymentDetailsFormProps) {
  const [file, setFile] = useState<{url: string; name: string} | null>(
    values.documentUrl ? { url: values.documentUrl, name: values.documentName || 'Payment document' } : null
  );

  const handlePaymentMethodChange = (method: string) => {
    if (onChange) {
      onChange({
        ...values,
        paymentMethod: method as 'bank_transfer' | 'cash' | 'check' | 'other'
      });
    }
  };

  const handleTransactionIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange({
        ...values,
        transactionId: e.target.value
      });
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange({
        ...values,
        paymentNotes: e.target.value
      });
    }
  };

  const handleSendEmailChange = (checked: boolean) => {
    if (onChange) {
      onChange({
        ...values,
        sendEmail: checked
      });
    }
  };

  const handleFileUpload = (url: string, name: string) => {
    setFile({ url, name });
    if (onChange) {
      onChange({
        ...values,
        documentUrl: url,
        documentName: name
      });
    }
  };

  const handleFileRemove = () => {
    setFile(null);
    if (onChange) {
      onChange({
        ...values,
        documentUrl: undefined,
        documentName: undefined
      });
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(values);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="payment-method">Payment Method</Label>
        <Select
          value={values.paymentMethod}
          onValueChange={handlePaymentMethodChange}
          disabled={isDisabled || isPending}
        >
          <SelectTrigger id="payment-method" className="w-full">
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="check">Check</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction-id">Transaction Reference</Label>
        <Input
          id="transaction-id"
          placeholder="Enter transaction ID, reference, or check number"
          value={values.transactionId || ''}
          onChange={handleTransactionIdChange}
          disabled={isDisabled || isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment-notes">Payment Notes</Label>
        <Textarea
          id="payment-notes"
          placeholder="Any additional payment information"
          value={values.paymentNotes || ''}
          onChange={handleNotesChange}
          rows={3}
          disabled={isDisabled || isPending}
        />
      </div>

      <div className="space-y-2">
        <Label>Payment Documentation</Label>
        <PaymentFileUploader
          onFileUpload={handleFileUpload}
          onFileRemove={handleFileRemove}
          existingFile={file}
          disabled={isDisabled || isPending}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Optional: Upload proof of payment or payment confirmation
        </p>
      </div>

      {includeEmailOption && (
        <div className="flex items-center space-x-2 pt-2">
          <Switch
            id="send-email"
            checked={!!values.sendEmail}
            onCheckedChange={handleSendEmailChange}
            disabled={isDisabled || isPending}
          />
          <Label htmlFor="send-email" className="cursor-pointer">
            Send payment confirmation by email
            {trainerEmail && <span className="text-xs text-muted-foreground ml-2">({trainerEmail})</span>}
          </Label>
        </div>
      )}
      
      {onSubmit && (
        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary/90 disabled:opacity-50"
            disabled={isDisabled || isPending || !values.paymentMethod}
          >
            {isPending ? "Processing..." : `Process Payment${values.totalAmount ? ` (R ${values.totalAmount.toFixed(2)})` : ''}`}
          </button>
        </div>
      )}
    </form>
  );
}

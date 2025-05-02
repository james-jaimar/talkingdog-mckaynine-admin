
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

export interface PaymentDetailsValues {
  paymentMethod?: 'bank_transfer' | 'cash' | 'check' | 'other';
  transactionId?: string;
  paymentNotes?: string;
  sendEmail?: boolean;
  documentUrl?: string;
  documentName?: string;
}

export interface PaymentDetailsFormProps {
  values: PaymentDetailsValues;
  onChange: (values: PaymentDetailsValues) => void;
  isDisabled?: boolean;
  includeEmailOption?: boolean;
}

export function PaymentDetailsForm({
  values,
  onChange,
  isDisabled = false,
  includeEmailOption = true
}: PaymentDetailsFormProps) {
  const [file, setFile] = useState<{url: string; name: string} | null>(
    values.documentUrl ? { url: values.documentUrl, name: values.documentName || 'Payment document' } : null
  );

  const handlePaymentMethodChange = (method: string) => {
    onChange({
      ...values,
      paymentMethod: method as 'bank_transfer' | 'cash' | 'check' | 'other'
    });
  };

  const handleTransactionIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...values,
      transactionId: e.target.value
    });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...values,
      paymentNotes: e.target.value
    });
  };

  const handleSendEmailChange = (checked: boolean) => {
    onChange({
      ...values,
      sendEmail: checked
    });
  };

  const handleFileUpload = (url: string, name: string) => {
    setFile({ url, name });
    onChange({
      ...values,
      documentUrl: url,
      documentName: name
    });
  };

  const handleFileRemove = () => {
    setFile(null);
    onChange({
      ...values,
      documentUrl: undefined,
      documentName: undefined
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="payment-method">Payment Method</Label>
        <Select
          value={values.paymentMethod}
          onValueChange={handlePaymentMethodChange}
          disabled={isDisabled}
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
          disabled={isDisabled}
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
          disabled={isDisabled}
        />
      </div>

      <div className="space-y-2">
        <Label>Payment Documentation</Label>
        <PaymentFileUploader
          onFileUpload={handleFileUpload}
          onFileRemove={handleFileRemove}
          existingFile={file}
          disabled={isDisabled}
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
            disabled={isDisabled}
          />
          <Label htmlFor="send-email" className="cursor-pointer">
            Send payment confirmation by email
          </Label>
        </div>
      )}
    </div>
  );
}

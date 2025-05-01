
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const paymentDetailsSchema = z.object({
  paymentMethod: z.enum(['bank_transfer', 'cash', 'check', 'other'], {
    required_error: "Payment method is required",
  }),
  transactionId: z.string().optional(),
  paymentNotes: z.string().optional(),
  sendEmail: z.boolean().default(false),
});

export type PaymentDetailsFormValues = z.infer<typeof paymentDetailsSchema>;

interface PaymentDetailsFormProps {
  onSubmit: (data: PaymentDetailsFormValues) => void;
  isPending: boolean;
  trainerEmail?: string;
}

export function PaymentDetailsForm({ onSubmit, isPending, trainerEmail }: PaymentDetailsFormProps) {
  const [showEmailWarning, setShowEmailWarning] = useState(false);
  
  const form = useForm<PaymentDetailsFormValues>({
    resolver: zodResolver(paymentDetailsSchema),
    defaultValues: {
      paymentMethod: 'bank_transfer',
      transactionId: '',
      paymentNotes: '',
      sendEmail: false,
    },
  });

  const handleSubmit = (data: PaymentDetailsFormValues) => {
    if (data.sendEmail && (!trainerEmail || trainerEmail.trim() === '')) {
      setShowEmailWarning(true);
      return;
    }
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="transactionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction ID (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Transaction reference number" {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="paymentNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Notes (optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional payment details or notes" 
                  {...field} 
                  disabled={isPending}
                  className="h-20"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sendEmail"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-4">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isPending || !trainerEmail}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Send email confirmation</FormLabel>
                <FormDescription>
                  {trainerEmail ? 
                    `An email with payment details and PDF will be sent to ${trainerEmail}` : 
                    'No email available for this trainer'}
                </FormDescription>
                {showEmailWarning && !trainerEmail && (
                  <p className="text-sm text-red-500">
                    Cannot send email - no email address is available for this trainer
                  </p>
                )}
              </div>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

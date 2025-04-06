
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";
import { FormValues } from "./InvoiceFormProvider";

export function InvoiceNotes() {
  const form = useFormContext<FormValues>();
  
  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Invoice Notes</FormLabel>
          <FormControl>
            <Textarea placeholder="Add any additional notes..." {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}


import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormValues } from "./InvoiceFormProvider";

export function InvoiceTaxRate() {
  const form = useFormContext<FormValues>();
  
  return (
    <FormField
      control={form.control}
      name="tax_rate"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tax Rate (%)</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              min={0} 
              max={100} 
              step={0.01} 
              {...field} 
              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
              className="max-w-[100px]"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

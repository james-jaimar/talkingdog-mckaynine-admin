
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { InvoiceFormValues } from "@/types/invoice";

interface DiscountFieldsProps {
  form: UseFormReturn<InvoiceFormValues>;
}

export function DiscountFields({ form }: DiscountFieldsProps) {
  const discountType = form.watch("discount_type");
  
  const handleDiscountChange = (value: number) => {
    if (discountType === "percentage") {
      // For percentage, clamp between 0-100
      const clampedValue = Math.min(Math.max(value, 0), 100);
      form.setValue("discount_amount", clampedValue);
    } else {
      // For fixed amount, ensure it's not negative
      form.setValue("discount_amount", Math.max(0, value));
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="discount_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount Type</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  // Reset discount amount when changing type
                  form.setValue("discount_amount", 0);
                }} 
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="discount_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Discount {discountType === "percentage" ? "(%) " : "(ZAR) "}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={discountType === "percentage" ? "0.1" : "0.01"}
                  max={discountType === "percentage" ? "100" : undefined}
                  {...field}
                  value={field.value || 0}
                  onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="discount_reason"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Discount Reason (Optional)</FormLabel>
            <FormControl>
              <Textarea rows={2} {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

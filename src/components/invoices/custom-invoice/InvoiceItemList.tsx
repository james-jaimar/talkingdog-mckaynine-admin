
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, Trash } from "lucide-react";
import { FormValues } from "./InvoiceFormProvider";

export function InvoiceItemList() {
  const form = useFormContext<FormValues>();

  // Add a new invoice item to the form
  const addItem = () => {
    const currentItems = form.getValues("items");
    form.setValue("items", [...currentItems, { description: "", quantity: 1, unit_price: 0 }]);
  };

  // Remove an invoice item from the form
  const removeItem = (index: number) => {
    const currentItems = form.getValues("items");
    if (currentItems.length === 1) return; // Don't remove the last item
    form.setValue("items", currentItems.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Invoice Items</h3>
        <Button type="button" size="sm" onClick={addItem} variant="outline">
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>
      
      {form.getValues("items").map((_, index) => (
        <div key={index} className="grid grid-cols-[1fr,100px,100px,40px] gap-2 items-end">
          <FormField
            control={form.control}
            name={`items.${index}.description`}
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className={index !== 0 ? "sr-only" : undefined}>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Item description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name={`items.${index}.quantity`}
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className={index !== 0 ? "sr-only" : undefined}>Qty</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={1} 
                    step={1} 
                    {...field} 
                    onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name={`items.${index}.unit_price`}
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className={index !== 0 ? "sr-only" : undefined}>Price</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0} 
                    step={0.01} 
                    placeholder="0.00"
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeItem(index)}
            disabled={form.getValues("items").length === 1}
            className="h-8 w-8 p-0 self-end"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

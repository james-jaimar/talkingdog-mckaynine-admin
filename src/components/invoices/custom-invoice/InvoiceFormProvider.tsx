
import { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";

// Form schema
export const customInvoiceSchema = z.object({
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().int().positive("Quantity must be a positive number"),
    unit_price: z.number().positive("Price must be a positive number"),
  })).min(1, "At least one item is required"),
  tax_rate: z.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100%"),
});

export type FormValues = z.infer<typeof customInvoiceSchema>;

interface InvoiceFormProviderProps {
  children: ReactNode;
  onSubmit: (values: FormValues) => Promise<void>;
  defaultValues?: Partial<FormValues>;
}

export function InvoiceFormProvider({ 
  children, 
  onSubmit,
  defaultValues = {
    notes: "",
    items: [{ description: "", quantity: 1, unit_price: 0 }],
    tax_rate: 15,
  }
}: InvoiceFormProviderProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(customInvoiceSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {children}
      </form>
    </Form>
  );
}

export function useInvoiceForm() {
  return useForm<FormValues>({
    resolver: zodResolver(customInvoiceSchema),
    defaultValues: {
      notes: "",
      items: [{ description: "", quantity: 1, unit_price: 0 }],
      tax_rate: 15,
    },
  });
}

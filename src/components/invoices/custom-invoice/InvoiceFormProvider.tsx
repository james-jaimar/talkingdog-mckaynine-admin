
import React from "react";
import { useForm, FormProvider } from "react-hook-form";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface FormValues {
  notes?: string;
  items: InvoiceItem[];
  tax_rate: number;
  discount_type: 'fixed' | 'percentage';
  discount_amount: number;
  discount_reason?: string;
}

interface InvoiceFormProviderProps {
  children: React.ReactNode;
  onSubmit: (values: FormValues) => void;
  defaultTaxRate?: number;
}

export function InvoiceFormProvider({ 
  children, 
  onSubmit,
  defaultTaxRate = 0 // Ensuring default is 0%
}: InvoiceFormProviderProps) {
  const methods = useForm<FormValues>({
    defaultValues: {
      notes: "",
      tax_rate: defaultTaxRate,
      items: [{ description: "", quantity: 1, unit_price: 0 }],
      discount_type: 'fixed',
      discount_amount: 0,
      discount_reason: ""
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-6">
        {children}
      </form>
    </FormProvider>
  );
}

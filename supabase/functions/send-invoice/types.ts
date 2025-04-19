
export interface InvoiceRequest {
  invoice: Invoice;
  email: string;
  pdfBase64?: string; // Add this field for base64 encoded PDF
}

export interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  client: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
  };
  issued_date: string;
  due_date: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes?: string;
  discount_amount: number;
  discount_type: 'fixed' | 'percentage';
  discount_reason?: string;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

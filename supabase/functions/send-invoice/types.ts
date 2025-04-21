
export interface Invoice {
  id: string;
  invoice_number: string;
  issued_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  tax_rate: number;
  discount_amount: number;
  total: number;
  notes?: string;
  client_id: string;
  client: {
    id: string;
    first_name: string;
    last_name?: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
  };
  items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
}

export interface InvoiceRequest {
  invoice: Invoice;
  email: string;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

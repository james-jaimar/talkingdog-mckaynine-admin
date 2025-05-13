
// Invoice type definitions
export interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issued_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_type: 'fixed' | 'percentage';
  discount_amount: number;
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    branch_id?: string;
  };
  items?: InvoiceItem[];
  // Additional fields for discount calculations
  monetary_discount?: number;
  original_discount_amount?: number;
  original_discount_type?: 'fixed' | 'percentage';
  discount_reason?: string;
  // Fee breakdown fields
  trainer_fee?: number;
  admin_fee?: number;
  franchise_fee?: number;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  booking_id?: string | null;
  created_at: string;
  updated_at: string;
  bookings?: BookingWithDetails;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'invalid';

export interface InvoiceFormValues {
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issued_date: Date;
  due_date: Date;
  notes?: string;
  tax_rate: number;
  items: {
    description: string;
    quantity: number;
    unit_price: number;
    booking_id?: string | null;
  }[];
  discount_type: 'fixed' | 'percentage';
  discount_amount: number;
  discount_reason?: string;
}

// Define the BookingWithDetails type
export interface BookingWithDetails {
  id: string;
  dogs?: {
    name: string;
    breed: string;
  };
  class_schedules?: {
    id: string;
    start_time?: string;
    class_id?: string;
    classes?: {
      name: string;
      description?: string;
      id?: string;
    };
  };
}

// Update InvoiceStatusBadge component to support 'invalid' status
<lov-write file_path="src/components/invoices/detail/InvoiceStatusBadge.tsx">
import { InvoiceStatus } from "@/hooks/invoices/types";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const statusColors: { [key in InvoiceStatus]: string } = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    cancelled: "bg-gray-400 text-gray-900",
    invalid: "bg-yellow-100 text-yellow-700"
  };

  return (
    <div
      className={`px-2 py-1 rounded-full text-sm font-medium ${
        statusColors[status]
      }`}
    >
      {status}
    </div>
  );
}

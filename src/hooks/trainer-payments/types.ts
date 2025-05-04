
// Define the necessary types for trainer payment data
export interface TrainerPaymentData {
  id: string;
  trainerName: string;
  trainerEmail?: string | null;
  totalEarned: number;
  paid: number;
  pending: number;
  potentialEarnings: number;
  classesCount: number;
  clients: number;
  lastPaymentDate?: string;
  classDetails: TrainerClassDetail[];
  hasUnpaidCommission: boolean;
  hasZeroCommissionClasses: boolean;
}

export interface TrainerClassDetail {
  scheduleId: string;
  className: string;
  classDate: string;
  scheduleDate: Date;
  bookings: number;
  revenue: number;
  potentialRevenue: number;
  isPaid: boolean;
  hasZeroAmountPayment?: boolean;
  hasZeroCommission?: boolean;
  bookingsDetails?: BookingDetail[];
}

export interface BookingDetail {
  bookingId: string;
  clientId: string;
  handlerName: string;
  commissionAmount: number;
}

export interface Schedule {
  id: string;
  start_time: string;
  end_time: string;
  classes?: {
    id: string;
    name: string;
    trainer_fee_type: 'percentage' | 'fixed';
    trainer_fee_value: number;
    course_fee?: number;
  };
  bookings?: Booking[];
}

export interface Booking {
  id: string;
  client_id?: string;
  class_schedule_id: string;
  payment_status?: string;
  clients?: {
    id: string;
    first_name?: string;
    last_name?: string;
  };
  client?: {
    id?: string;
    first_name?: string;
    last_name?: string;
  };
  invoice_items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  amount: number;
  booking_id?: string;
  invoice_id?: string;
  invoices?: {
    id: string;
    status: string;
    total?: number;
    payment_date?: string;
  };
}

// Add the TrainerPaymentHistoryItem type that was missing
export interface TrainerPaymentHistoryItem {
  id: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  documentUrl?: string;
  documentName?: string;
  scheduleId: string;
  className: string;
  classDate: string;
  trainerName: string;
}

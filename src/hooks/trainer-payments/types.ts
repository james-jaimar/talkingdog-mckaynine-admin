
export interface Schedule {
  id: string;
  start_time: string;
  end_time: string;
  class_id: string;
  trainer_id: string;
  classes: {
    id: string;
    name: string;
    trainer_fee_type?: string;
    trainer_fee_value?: number;
    mckaynine_commission_type?: string;
    mckaynine_commission_value?: number;
    admin_fee_type?: string;
    admin_fee_value?: number;
    course_fee?: number;
  };
}

export interface Booking {
  id: string;
  class_schedule_id?: string;
  client_id?: string;
  dog_id?: string;
  is_enrolled: boolean;
  status: string;
  payment_status: string;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  dog?: {
    id: string;
    name: string;
    breed: string;
  };
  // For backward compatibility with code using clients instead of client
  clients?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  computed_payment_status?: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  booking_id?: string;
  invoices?: {
    id: string;
    status: string;
    payment_date?: string;
  };
}

export interface BookingDetail {
  bookingId: string;
  clientId: string;
  handlerName: string;
  commissionAmount: number;
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

export interface TrainerPaymentData {
  id: string;
  trainerName: string;
  trainerEmail?: string;
  totalEarned: number;
  paid: number;
  pending: number;
  potentialEarnings: number;
  classesCount: number;
  clients: number;
  lastPaymentDate?: string;
  scheduleIds?: string[];
  hasZeroCommissionClasses?: boolean;
  classDetails: TrainerClassDetail[];
}

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
}

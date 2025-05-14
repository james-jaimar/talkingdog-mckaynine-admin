
// If this file doesn't exist yet, we'll create it
export interface Schedule {
  id: string;
  class_id: string;
  trainer_id: string;
  start_time: string;
  end_time: string;
  recurring: boolean;
  recurrence_pattern?: string;
  selected_dates?: string[];
  created_at: string;
  updated_at: string;
  term_id?: string;
  classes: {
    id: string;
    name: string;
    trainer_fee_type: string;
    trainer_fee_value: number;
    mckaynine_commission_type: string;
    mckaynine_commission_value: number;
    admin_fee_type: string;
    admin_fee_value: number;
    course_fee: number;
    enrollment_fee: number;
    branch_id: string; // Add branch_id field
  }
}

export interface Booking {
  id: string;
  client_id?: string;
  class_schedule_id: string;
  payment_status: string;
  status: string;
  is_enrolled: boolean;
  dog_id?: string;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    branch_id: string; // Add branch_id field
  };
  clients?: {
    id: string;
    first_name: string;
    last_name: string;
    branch_id: string; // Add branch_id field
  };
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  booking_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  branch_id?: string; // Add branch_id field
  invoices?: {
    id: string;
    status: string;
    payment_date?: string;
    client_id?: string;
    client?: {
      branch_id: string; // Add branch_id field
    };
  };
  // Add bookings property to match what's being used in code
  bookings?: {
    id: string;
    dogs?: {
      name: string;
      breed: string;
    };
    class_schedules?: {
      id: string;
      start_time: string;
      class_id: string;
      classes: {
        id: string;
        name: string;
        price?: number;
        description?: string;
      };
    };
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
  revenue: number;
  potentialRevenue: number;
  bookings: number;
  isPaid: boolean;
  hasZeroAmountPayment?: boolean;
  hasZeroCommission?: boolean;
  branchId?: string; // Add branch_id field
  bookingsDetails: BookingDetail[];
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
  scheduleIds: string[];
  hasUnpaidCommission: boolean;
  hasZeroCommissionClasses?: boolean;
  hasZeroAmountPayments?: boolean;
  classDetails: TrainerClassDetail[];
}

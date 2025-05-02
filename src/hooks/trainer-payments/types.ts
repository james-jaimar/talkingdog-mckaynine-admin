
export interface TrainerPaymentData {
  id: string;
  trainerName: string;
  trainerEmail?: string;
  totalEarned: number;
  paid: number;
  pending: number;
  potentialEarnings?: number;
  classesCount: number;
  clients: number;
  lastPaymentDate?: string;
  scheduleIds?: string[];
  classDetails?: TrainerClassDetail[];
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
  bookingsDetails?: {
    bookingId: string;
    clientId: string;
    handlerName: string;
    commissionAmount: number;
  }[];
}

export interface Schedule {
  id: string;
  start_time: string;
  classes?: {
    id: string;
    name: string;
    trainer_fee_type?: string;
    trainer_fee_value?: number;
    course_fee?: number;
    mckaynine_commission_type?: string;
    mckaynine_commission_value?: number;
    admin_fee_type?: string;
    admin_fee_value?: number;
  };
}

export interface Booking {
  id: string;
  class_schedule_id: string;
  client_id?: string;
  clients?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface InvoiceItem {
  id: string;
  booking_id?: string;
  amount: number;
  invoices?: {
    id: string;
    status: string;
  };
}

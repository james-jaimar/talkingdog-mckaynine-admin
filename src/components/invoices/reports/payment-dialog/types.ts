
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";

export interface TrainerPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainerId: string;
  branchId?: string;
  dateRange: { from: Date; to: Date };
  scheduleIds?: string[];
}

export interface PaymentClassData {
  classDetails: TrainerClassDetail[];
  selectedClasses: string[];
  trainerName: string;
}

// Add these extended properties to the TrainerClassDetail interface used in the dialog
export interface DialogTrainerClassDetail extends TrainerClassDetail {
  trainerFeeType?: string;
  trainerFeeValue?: number;
  paymentDate?: string | null;
  paidAmount?: number;
  totalRevenue?: number;
}

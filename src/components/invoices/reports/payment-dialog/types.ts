
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

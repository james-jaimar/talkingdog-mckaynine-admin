
export interface TrainerPaymentData {
  id: string;
  trainerName: string;
  totalEarned: number;
  allocatedAmount: number;
  paidAmount: number;
  pendingAmount: number;
  classesCount: number;
  clients: number;
  lastPaymentDate?: string;
}

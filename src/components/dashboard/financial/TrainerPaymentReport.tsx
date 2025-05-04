
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useTrainerPaymentData } from "./trainer-payment/useTrainerPaymentData";
import { TrainerPaymentHeader } from "./trainer-payment/TrainerPaymentHeader";
import { TrainerPaymentLoading } from "./trainer-payment/TrainerPaymentLoading";
import { TrainerPaymentEmpty } from "./trainer-payment/TrainerPaymentEmpty";
import { TrainerPaymentTable } from "./trainer-payment/TrainerPaymentTable";

interface TrainerPaymentReportProps {
  branchId?: string;
  dateRange: { from: Date; to?: Date };
  isLoading: boolean;
}

export function TrainerPaymentReport({ 
  branchId, 
  dateRange, 
  isLoading: externalLoading 
}: TrainerPaymentReportProps) {
  // Use React Query to fetch trainer payment data
  const { data: trainers = [], isLoading: isLoadingTrainers } = useTrainerPaymentData(branchId, dateRange);
  
  // Determine if we're in a loading state
  const isLoading = externalLoading || isLoadingTrainers;

  if (isLoading) {
    return (
      <Card className="w-full">
        <TrainerPaymentHeader />
        <TrainerPaymentLoading />
      </Card>
    );
  }

  if (!trainers || trainers.length === 0) {
    return (
      <Card className="w-full">
        <TrainerPaymentHeader />
        <TrainerPaymentEmpty />
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <TrainerPaymentHeader />
      <CardContent>
        <TrainerPaymentTable trainers={trainers} />
      </CardContent>
    </Card>
  );
}

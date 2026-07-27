
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { ExtendedBadge } from "@/components/ui/badge-variants";
import { formatCurrency } from "@/lib/formatters";
import { Loader2 } from "lucide-react";
import { useTrainerPaymentData } from "@/hooks/useTrainerPaymentData";

interface TrainerPaymentReportProps {
  branchId?: string;
  dateRange: { from: Date; to?: Date };
  isLoading: boolean;
}

export function TrainerPaymentReport({ branchId, dateRange, isLoading }: TrainerPaymentReportProps) {
  const normalizedRange = { from: dateRange.from, to: dateRange.to || dateRange.from };
  const { data: trainers = [], isLoading: isLoadingTrainers } = useTrainerPaymentData(branchId, normalizedRange);

  if (isLoading || isLoadingTrainers) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Trainer Payment Report</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-36">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!trainers || trainers.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Trainer Payment Report</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground py-4">No trainer payment data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Trainer Payment Report</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trainer</TableHead>
              <TableHead className="text-right">Total Commission</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Pending</TableHead>
              <TableHead className="text-center">Classes</TableHead>
              <TableHead className="text-center">Clients</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainers.map((trainer) => (
              <TableRow key={trainer.id}>
                <TableCell className="font-medium">{trainer.trainerName}</TableCell>
                <TableCell className="text-right">{formatCurrency(trainer.totalEarned)}</TableCell>
                <TableCell className="text-right">{formatCurrency(trainer.paid)}</TableCell>
                <TableCell className="text-right">{formatCurrency(trainer.pending)}</TableCell>
                <TableCell className="text-center">{trainer.classesCount}</TableCell>
                <TableCell className="text-center">{trainer.clients}</TableCell>
                <TableCell className="text-right">
                  {trainer.pending > 0 ? (
                    <ExtendedBadge variant="amber">Payment Due</ExtendedBadge>
                  ) : (
                    <ExtendedBadge variant="green">Paid</ExtendedBadge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

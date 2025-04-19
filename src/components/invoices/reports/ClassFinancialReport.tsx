
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";

interface ClassFinance {
  className: string;
  totalRevenue: number;
  bookingsCount: number;
  franchiseFee: number;
  adminFee: number;
  instructorFee: number;
  profit: number;
}

interface ClassFinancialReportProps {
  dateRange?: { from: Date; to: Date };
}

export function ClassFinancialReport({ dateRange }: ClassFinancialReportProps) {
  const { currentBranch } = useBranch();
  const [classFinances, setClassFinances] = useState<ClassFinance[]>([]);
  
  const fromDate = dateRange?.from?.toISOString();
  const toDate = dateRange?.to?.toISOString();

  // Get financial data for confirmed bookings
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['financial-bookings', currentBranch?.id, fromDate, toDate],
    queryFn: async () => {
      if (!currentBranch?.id) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          class_schedules:class_schedule_id (
            classes:class_id (
              id,
              name,
              course_fee,
              mckaynine_commission_value,
              mckaynine_commission_type,
              admin_fee_value,
              admin_fee_type,
              trainer_fee_value,
              trainer_fee_type
            )
          )
        `)
        .eq('class_schedules.classes.branch_id', currentBranch.id)
        .eq('status', 'confirmed')
        .gte('created_at', fromDate)
        .lte('created_at', toDate);

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentBranch?.id && !!fromDate && !!toDate
  });

  // Process booking data into financial summaries
  useEffect(() => {
    if (!bookingsData) {
      setClassFinances([]);
      return;
    }

    const classSummaries = new Map<string, ClassFinance>();

    bookingsData.forEach(booking => {
      const classData = booking.class_schedules?.classes;
      if (!classData) return;

      const className = classData.name;
      const courseFee = classData.course_fee || 0;

      // Get or create class summary
      const summary = classSummaries.get(className) || {
        className,
        totalRevenue: 0,
        bookingsCount: 0,
        franchiseFee: 0,
        adminFee: 0,
        instructorFee: 0,
        profit: 0
      };

      // Update summary
      summary.bookingsCount++;
      summary.totalRevenue += courseFee;

      // Calculate fees
      if (classData.mckaynine_commission_type === 'percentage') {
        summary.franchiseFee += courseFee * (classData.mckaynine_commission_value / 100);
      } else {
        summary.franchiseFee += classData.mckaynine_commission_value;
      }

      if (classData.admin_fee_type === 'percentage') {
        summary.adminFee += courseFee * (classData.admin_fee_value / 100);
      } else {
        summary.adminFee += classData.admin_fee_value;
      }

      if (classData.trainer_fee_type === 'percentage') {
        summary.instructorFee += courseFee * (classData.trainer_fee_value / 100);
      } else {
        summary.instructorFee += classData.trainer_fee_value;
      }

      // Calculate profit
      summary.profit = summary.totalRevenue - summary.franchiseFee - summary.adminFee - summary.instructorFee;

      classSummaries.set(className, summary);
    });

    setClassFinances(Array.from(classSummaries.values()));
  }, [bookingsData]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Class Financial Report</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-36">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!classFinances || classFinances.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Class Financial Report</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground py-4">No financial data available for the selected date range</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totals = classFinances.reduce((acc, curr) => ({
    totalRevenue: acc.totalRevenue + curr.totalRevenue,
    bookingsCount: acc.bookingsCount + curr.bookingsCount,
    franchiseFee: acc.franchiseFee + curr.franchiseFee,
    adminFee: acc.adminFee + curr.adminFee,
    instructorFee: acc.instructorFee + curr.instructorFee,
    profit: acc.profit + curr.profit
  }), {
    totalRevenue: 0,
    bookingsCount: 0,
    franchiseFee: 0,
    adminFee: 0,
    instructorFee: 0,
    profit: 0
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Class Financial Report</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead className="text-right">Total Revenue</TableHead>
              <TableHead className="text-right">Franchise Fee</TableHead>
              <TableHead className="text-right">Admin Fee</TableHead>
              <TableHead className="text-right">Instructor Fee</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead className="text-right">Bookings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classFinances.map((finance, index) => (
              <TableRow key={index}>
                <TableCell>{finance.className}</TableCell>
                <TableCell className="text-right">{formatCurrency(finance.totalRevenue)}</TableCell>
                <TableCell className="text-right">{formatCurrency(finance.franchiseFee)}</TableCell>
                <TableCell className="text-right">{formatCurrency(finance.adminFee)}</TableCell>
                <TableCell className="text-right">{formatCurrency(finance.instructorFee)}</TableCell>
                <TableCell className="text-right">{formatCurrency(finance.profit)}</TableCell>
                <TableCell className="text-right">{finance.bookingsCount}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.totalRevenue)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.franchiseFee)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.adminFee)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.instructorFee)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.profit)}</TableCell>
              <TableCell className="text-right">{totals.bookingsCount}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

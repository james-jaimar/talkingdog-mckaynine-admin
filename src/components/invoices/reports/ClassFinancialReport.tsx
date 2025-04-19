
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
import { toast } from "sonner";

interface ClassFinance {
  className: string;
  courseFee: number;
  enrollmentFee: number;
  franchiseFee: number;
  totalOwingToFranchisor: number;
  adminFee: number;
  instructorFee: number;
  profit: number;
  bookingsCount: number;
}

export function ClassFinancialReport() {
  const { data: classFinances, isLoading } = useQuery({
    queryKey: ['class-finances'],
    queryFn: async () => {
      try {
        // First fetch all the classes with their financial settings
        const { data: classes, error: classesError } = await supabase
          .from('classes')
          .select(`
            id,
            name,
            course_fee,
            enrollment_fee,
            mckaynine_commission_value,
            mckaynine_commission_type,
            admin_fee_value,
            admin_fee_type,
            trainer_fee_value,
            trainer_fee_type
          `);

        if (classesError) throw classesError;
        if (!classes) return [];

        // For each class, fetch associated bookings separately
        const classFinances = await Promise.all(classes.map(async (classData) => {
          // Get paid bookings for this class
          const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
              id,
              payment_status,
              class_schedule_id,
              class_schedules:class_schedule_id(class_id)
            `)
            .eq('payment_status', 'paid');
          
          if (bookingsError) {
            console.error(`Error fetching bookings for class ${classData.id}:`, bookingsError);
            return null;
          }

          // Filter bookings that belong to this class
          const classBookings = bookings ? bookings.filter(booking => 
            booking.class_schedules && booking.class_schedules.class_id === classData.id
          ) : [];
          
          const activeBookingsCount = classBookings.length;

          // Calculate financial metrics
          const totalCourseFees = activeBookingsCount * classData.course_fee;
          const totalEnrollmentFees = activeBookingsCount * classData.enrollment_fee;

          // Calculate franchise fee (mckaynine commission)
          const franchiseFee = classData.mckaynine_commission_type === 'percentage'
            ? (totalCourseFees + totalEnrollmentFees) * (classData.mckaynine_commission_value / 100)
            : activeBookingsCount * classData.mckaynine_commission_value;

          // Calculate admin fee
          const adminFee = classData.admin_fee_type === 'percentage'
            ? (totalCourseFees + totalEnrollmentFees) * (classData.admin_fee_value / 100)
            : activeBookingsCount * classData.admin_fee_value;

          // Calculate instructor fee
          const instructorFee = classData.trainer_fee_type === 'percentage'
            ? (totalCourseFees + totalEnrollmentFees) * (classData.trainer_fee_value / 100)
            : activeBookingsCount * classData.trainer_fee_value;

          // Calculate total revenue and profit
          const totalRevenue = totalCourseFees + totalEnrollmentFees;
          const profit = totalRevenue - franchiseFee - adminFee - instructorFee;

          return {
            className: classData.name,
            courseFee: totalCourseFees,
            enrollmentFee: totalEnrollmentFees,
            franchiseFee,
            totalOwingToFranchisor: franchiseFee,
            adminFee,
            instructorFee,
            profit,
            bookingsCount: activeBookingsCount
          };
        }));

        // Filter out null entries (classes that had errors)
        return classFinances.filter(Boolean) as ClassFinance[];
      } catch (error) {
        console.error('Error fetching class finances:', error);
        toast.error('Failed to load financial data');
        throw error;
      }
    }
  });

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
          <p className="text-muted-foreground py-4">No class financial data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals for the footer
  const totals = classFinances.reduce((acc, curr) => ({
    courseFee: acc.courseFee + curr.courseFee,
    enrollmentFee: acc.enrollmentFee + curr.enrollmentFee,
    franchiseFee: acc.franchiseFee + curr.franchiseFee,
    totalOwingToFranchisor: acc.totalOwingToFranchisor + curr.totalOwingToFranchisor,
    adminFee: acc.adminFee + curr.adminFee,
    instructorFee: acc.instructorFee + curr.instructorFee,
    profit: acc.profit + curr.profit,
    bookingsCount: acc.bookingsCount + curr.bookingsCount
  }), {
    courseFee: 0,
    enrollmentFee: 0,
    franchiseFee: 0,
    totalOwingToFranchisor: 0,
    adminFee: 0,
    instructorFee: 0,
    profit: 0,
    bookingsCount: 0
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Class Financial Report</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead className="text-right">Course Fee</TableHead>
              <TableHead className="text-right">Enrollment Fee</TableHead>
              <TableHead className="text-right">Franchise Fee</TableHead>
              <TableHead className="text-right">Total Owing to Franchisor</TableHead>
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
                <TableCell className="text-right">{formatCurrency(finance.courseFee)}</TableCell>
                <TableCell className="text-right">{formatCurrency(finance.enrollmentFee)}</TableCell>
                <TableCell className="text-right">{formatCurrency(finance.franchiseFee)}</TableCell>
                <TableCell className="text-right">{formatCurrency(finance.totalOwingToFranchisor)}</TableCell>
                <TableCell className="text-right">{formatCurrency(finance.adminFee)}</TableCell>
                <TableCell className="text-right">{formatCurrency(finance.instructorFee)}</TableCell>
                <TableCell className="text-right">{formatCurrency(finance.profit)}</TableCell>
                <TableCell className="text-right">{finance.bookingsCount}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold">
              <TableCell>Monthly Total</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.courseFee)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.enrollmentFee)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.franchiseFee)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.totalOwingToFranchisor)}</TableCell>
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

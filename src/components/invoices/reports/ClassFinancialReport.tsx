
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
import { useBranch } from "@/context/BranchContext";

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
  const { currentBranch } = useBranch();
  
  const { data: classFinances, isLoading } = useQuery({
    queryKey: ['class-finances', currentBranch?.id],
    queryFn: async () => {
      try {
        if (!currentBranch?.id) {
          console.log("No branch selected");
          return [];
        }
        
        console.log(`Fetching financial data for branch: ${currentBranch.name} (${currentBranch.id})`);
        
        // Step 1: Get classes for the current branch
        const { data: classes, error: classesError } = await supabase
          .from("classes")
          .select("id, name, course_fee, enrollment_fee, mckaynine_commission_value, mckaynine_commission_type, admin_fee_value, admin_fee_type, trainer_fee_value, trainer_fee_type")
          .eq("branch_id", currentBranch.id);
          
        if (classesError) {
          console.error("Error fetching classes:", classesError);
          throw new Error(`Error fetching classes: ${classesError.message}`);
        }
        
        if (!classes || classes.length === 0) {
          console.log(`No classes found for branch: ${currentBranch.name}`);
          return [];
        }
        
        console.log(`Found ${classes.length} classes for branch ${currentBranch.name}`);
        
        // Step 2: For each class, find all its schedules and then find paid bookings for those schedules
        const classFinances = await Promise.all(classes.map(async (classItem) => {
          try {
            // Get class schedules for this class
            const { data: schedules, error: schedulesError } = await supabase
              .from("class_schedules")
              .select("id")
              .eq("class_id", classItem.id);
              
            if (schedulesError) {
              console.error(`Error fetching schedules for class ${classItem.id}:`, schedulesError);
              return null;
            }
            
            if (!schedules || schedules.length === 0) {
              console.log(`No schedules found for class: ${classItem.name}`);
              // Return class with zero bookings
              return {
                className: classItem.name,
                courseFee: 0,
                enrollmentFee: 0,
                franchiseFee: 0,
                totalOwingToFranchisor: 0,
                adminFee: 0,
                instructorFee: 0,
                profit: 0,
                bookingsCount: 0
              };
            }
            
            const scheduleIds = schedules.map(schedule => schedule.id);
            
            // Get paid bookings for these schedules
            const { data: bookings, error: bookingsError } = await supabase
              .from("bookings")
              .select("id")
              .in("class_schedule_id", scheduleIds)
              .eq("payment_status", "paid");
              
            if (bookingsError) {
              console.error(`Error fetching bookings for class ${classItem.id}:`, bookingsError);
              return null;
            }
            
            const activeBookingsCount = bookings ? bookings.length : 0;
            
            // Calculate financial metrics
            const totalCourseFees = activeBookingsCount * classItem.course_fee;
            const totalEnrollmentFees = activeBookingsCount * classItem.enrollment_fee;
            
            // Calculate franchise fee (mckaynine commission)
            const franchiseFee = classItem.mckaynine_commission_type === 'percentage'
              ? (totalCourseFees + totalEnrollmentFees) * (classItem.mckaynine_commission_value / 100)
              : activeBookingsCount * classItem.mckaynine_commission_value;
            
            // Calculate admin fee
            const adminFee = classItem.admin_fee_type === 'percentage'
              ? (totalCourseFees + totalEnrollmentFees) * (classItem.admin_fee_value / 100)
              : activeBookingsCount * classItem.admin_fee_value;
            
            // Calculate instructor fee
            const instructorFee = classItem.trainer_fee_type === 'percentage'
              ? (totalCourseFees + totalEnrollmentFees) * (classItem.trainer_fee_value / 100)
              : activeBookingsCount * classItem.trainer_fee_value;
            
            // Calculate total revenue and profit
            const totalRevenue = totalCourseFees + totalEnrollmentFees;
            const profit = totalRevenue - franchiseFee - adminFee - instructorFee;
            
            return {
              className: classItem.name,
              courseFee: totalCourseFees,
              enrollmentFee: totalEnrollmentFees,
              franchiseFee,
              totalOwingToFranchisor: franchiseFee,
              adminFee,
              instructorFee,
              profit,
              bookingsCount: activeBookingsCount
            };
          } catch (error) {
            console.error(`Error processing class ${classItem.id}:`, error);
            return null;
          }
        }));
        
        // Filter out null entries (classes that had errors)
        return classFinances.filter(Boolean) as ClassFinance[];
      } catch (error) {
        console.error("Error fetching class finances:", error);
        toast.error("Failed to load financial data");
        throw error;
      }
    },
    enabled: !!currentBranch?.id,
    retry: 1, // Only retry once to avoid excessive console errors
    staleTime: 5 * 60 * 1000, // 5 minutes cache
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


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
import { useState, useEffect } from "react";

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
  const [classFinances, setClassFinances] = useState<ClassFinance[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // 1. Fetch classes for the current branch
  const { data: classes, isLoading: isLoadingClasses, error: classesError } = useQuery({
    queryKey: ['financial-classes', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) {
        return [];
      }
      
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, course_fee, enrollment_fee, mckaynine_commission_value, mckaynine_commission_type, admin_fee_value, admin_fee_type, trainer_fee_value, trainer_fee_type")
        .eq("branch_id", currentBranch.id);
        
      if (error) {
        console.error("Error fetching classes:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!currentBranch?.id,
  });

  // 2. Fetch bookings with payment status for these classes
  const { data: bookingData, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['financial-bookings', currentBranch?.id, classes?.map(c => c.id).join(',')],
    queryFn: async () => {
      if (!classes || classes.length === 0) return {};
      
      // Get all schedules for all classes
      const { data: schedules, error: schedulesError } = await supabase
        .from("class_schedules")
        .select("id, class_id")
        .in("class_id", classes.map(c => c.id));
        
      if (schedulesError) {
        console.error("Error fetching schedules:", schedulesError);
        throw schedulesError;
      }
      
      if (!schedules || schedules.length === 0) {
        return {};
      }
      
      // Create a mapping of class IDs to schedule IDs
      const classSchedules: Record<string, string[]> = {};
      schedules.forEach(schedule => {
        if (!classSchedules[schedule.class_id]) {
          classSchedules[schedule.class_id] = [];
        }
        classSchedules[schedule.class_id].push(schedule.id);
      });
      
      // Fetch bookings for each class separately
      const bookingsByClass: Record<string, any[]> = {};
      
      // Process each class in batches to prevent excessive database load
      for (const classItem of classes) {
        const scheduleIds = classSchedules[classItem.id] || [];
        
        if (scheduleIds.length === 0) {
          bookingsByClass[classItem.id] = [];
          continue;
        }
        
        try {
          const { data: bookings, error: bookingsError } = await supabase
            .from("bookings")
            .select(`
              id, 
              payment_status,
              proof_of_payment,
              class_schedule_id
            `)
            .in("class_schedule_id", scheduleIds)
            .eq("status", "confirmed");
            
          if (bookingsError) {
            console.error(`Error fetching bookings for class ${classItem.id}:`, bookingsError);
            bookingsByClass[classItem.id] = [];
            continue;
          }
          
          bookingsByClass[classItem.id] = bookings || [];
        } catch (err) {
          console.error(`Error processing bookings for class ${classItem.id}:`, err);
          bookingsByClass[classItem.id] = [];
        }
      }
      
      return bookingsByClass;
    },
    enabled: !!classes && classes.length > 0,
  });

  // Calculate financial metrics when data is available
  useEffect(() => {
    if (!classes || classes.length === 0 || !bookingData || isLoadingClasses || isLoadingBookings) {
      return;
    }
    
    setIsCalculating(true);
    
    try {
      const finances: ClassFinance[] = classes.map(classItem => {
        // Get bookings for this class
        const classBookings = bookingData[classItem.id] || [];
        const paidBookings = classBookings.filter(b => 
          b.payment_status === 'paid' || 
          (b.proof_of_payment && b.proof_of_payment.trim() !== '')
        );
        
        const bookingsCount = paidBookings.length;
        
        // Calculate fees based on number of paid bookings
        const totalCourseFees = bookingsCount * (classItem.course_fee || 0);
        const totalEnrollmentFees = bookingsCount * (classItem.enrollment_fee || 0);
        const totalRevenue = totalCourseFees + totalEnrollmentFees;
        
        // Calculate franchise fee
        const franchiseFee = classItem.mckaynine_commission_type === 'percentage'
          ? (totalRevenue * (classItem.mckaynine_commission_value / 100))
          : bookingsCount * classItem.mckaynine_commission_value;
        
        // Calculate admin fee
        const adminFee = classItem.admin_fee_type === 'percentage'
          ? (totalRevenue * (classItem.admin_fee_value / 100))
          : bookingsCount * classItem.admin_fee_value;
        
        // Calculate instructor fee
        const instructorFee = classItem.trainer_fee_type === 'percentage'
          ? (totalRevenue * (classItem.trainer_fee_value / 100))
          : bookingsCount * classItem.trainer_fee_value;
        
        // Calculate profit
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
          bookingsCount
        };
      });
      
      setClassFinances(finances);
    } catch (error) {
      console.error("Error calculating financial data:", error);
      toast.error("Error processing financial data");
    } finally {
      setIsCalculating(false);
    }
  }, [classes, bookingData, isLoadingClasses, isLoadingBookings]);

  // Show loading state
  if (isLoadingClasses || isLoadingBookings || isCalculating) {
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

  // Show error state
  if (classesError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Class Financial Report</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-red-500">
          <p>Failed to load financial data. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  // Show empty state
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
      <CardContent className="overflow-x-auto">
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

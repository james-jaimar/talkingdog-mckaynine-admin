
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

interface ClassFinancialReportProps {
  dateRange?: { from: Date; to: Date };
}

export function ClassFinancialReport({ dateRange }: ClassFinancialReportProps) {
  const { currentBranch } = useBranch();
  const [classFinances, setClassFinances] = useState<ClassFinance[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Format dates for logging
  const fromDateStr = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : 'not set';
  const toDateStr = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : 'not set';
  
  // Fetch all classes for the current branch
  const { data: classes, isLoading: isLoadingClasses, error: classesError } = useQuery({
    queryKey: ['financial-classes', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) {
        return [];
      }
      
      console.log("Fetching classes for branch:", currentBranch.name);
      
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, course_fee, enrollment_fee, mckaynine_commission_value, mckaynine_commission_type, admin_fee_value, admin_fee_type, trainer_fee_value, trainer_fee_type")
        .eq("branch_id", currentBranch.id);
        
      if (error) {
        console.error("Error fetching classes:", error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} classes for branch ${currentBranch.name}`);
      return data || [];
    },
    enabled: !!currentBranch?.id,
  });

  // Modified approach to fetch all needed data in a single function
  const { data: financialData, isLoading: isLoadingFinancialData } = useQuery({
    queryKey: ['financial-data', currentBranch?.id, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      if (!classes || classes.length === 0 || !currentBranch?.id) {
        console.log("Unable to fetch financial data - missing classes or branch", {
          classesCount: classes?.length,
          branchId: currentBranch?.id,
          dateRange: { from: fromDateStr, to: toDateStr }
        });
        return { schedules: [], bookings: [] };
      }
      
      console.log("Fetching financial data for date range:", { from: fromDateStr, to: toDateStr });

      try {
        // 1. Get all class schedules for the classes in this branch
        const { data: schedules, error: schedulesError } = await supabase
          .from("class_schedules")
          .select("id, class_id")
          .in("class_id", classes.map(c => c.id));
          
        if (schedulesError) {
          console.error("Error fetching schedules:", schedulesError);
          throw schedulesError;
        }
        
        console.log(`Found ${schedules?.length || 0} schedules for classes`);
        
        if (!schedules || schedules.length === 0) {
          console.log("No schedules found for classes");
          return { schedules: [], bookings: [] };
        }

        // 2. Get all bookings for these schedules, applying date filter if available
        let bookingsQuery = supabase
          .from("bookings")
          .select(`
            id, 
            payment_status,
            proof_of_payment,
            class_schedule_id,
            created_at
          `)
          .in("class_schedule_id", schedules.map(s => s.id))
          .eq("status", "confirmed");
          
        // Apply date filter if provided
        if (dateRange?.from) {
          bookingsQuery = bookingsQuery.gte('created_at', dateRange.from.toISOString());
          console.log("Applying from date filter:", dateRange.from.toISOString());
        }
        
        if (dateRange?.to) {
          bookingsQuery = bookingsQuery.lte('created_at', dateRange.to.toISOString());
          console.log("Applying to date filter:", dateRange.to.toISOString());
        }
        
        const { data: bookings, error: bookingsError } = await bookingsQuery;
          
        if (bookingsError) {
          console.error("Error fetching bookings:", bookingsError);
          throw bookingsError;
        }
        
        console.log(`Found ${bookings?.length || 0} total bookings${dateRange ? " in date range" : ""}`);
        
        // Log the payment statuses for debugging
        const paymentStatusCounts = bookings?.reduce((acc, booking) => {
          const status = booking.payment_status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const proofOfPaymentCount = bookings?.filter(b => b.proof_of_payment && b.proof_of_payment.trim() !== '').length || 0;
        
        console.log("Payment status breakdown:", paymentStatusCounts);
        console.log("Bookings with proof of payment:", proofOfPaymentCount);
        
        return { 
          schedules: schedules || [],
          bookings: bookings || []
        };
      } catch (err) {
        console.error("Error fetching financial data:", err);
        throw err;
      }
    },
    enabled: !!classes && classes.length > 0 && !!currentBranch?.id,
  });

  // Calculate financial metrics when data is available
  useEffect(() => {
    if (!classes || classes.length === 0 || !financialData || isLoadingClasses || isLoadingFinancialData) {
      return;
    }
    
    console.log("Calculating financial metrics with:", { 
      classesCount: classes.length,
      schedulesCount: financialData.schedules.length,
      bookingsCount: financialData.bookings.length
    });
    
    setIsCalculating(true);
    
    try {
      // Create a mapping of schedules to their class IDs for faster lookup
      const scheduleToClassMap = new Map<string, string>();
      financialData.schedules.forEach(schedule => {
        scheduleToClassMap.set(schedule.id, schedule.class_id);
      });
      
      // Group bookings by class
      const bookingsByClass: Record<string, any[]> = {};
      
      // Initialize with all classes
      classes.forEach(cls => {
        bookingsByClass[cls.id] = [];
      });
      
      // Populate bookings by class using the mapping
      financialData.bookings.forEach(booking => {
        const scheduleId = booking.class_schedule_id;
        const classId = scheduleToClassMap.get(scheduleId);
        
        if (classId && bookingsByClass[classId]) {
          bookingsByClass[classId].push(booking);
        }
      });
      
      // Now calculate financial data for each class
      const finances: ClassFinance[] = classes.map(classItem => {
        // Get bookings for this class
        const classBookingsArr = bookingsByClass[classItem.id] || [];
        
        // IMPORTANT: Consider a booking as "paid" if it has EITHER:
        // 1. payment_status = 'paid'
        // 2. proof_of_payment is not empty
        const paidBookings = classBookingsArr.filter(booking => 
          booking.payment_status === 'paid' || 
          (booking.proof_of_payment && booking.proof_of_payment.trim() !== '')
        );
        
        console.log(`Class ${classItem.name}: ${paidBookings.length} paid bookings out of ${classBookingsArr.length} total`);
        
        const bookingsCount = paidBookings.length;
        
        // Calculate fees based on number of paid bookings
        const totalCourseFees = bookingsCount * (classItem.course_fee || 0);
        const totalEnrollmentFees = bookingsCount * (classItem.enrollment_fee || 0);
        const totalRevenue = totalCourseFees + totalEnrollmentFees;
        
        // Calculate franchise fee
        let franchiseFee = 0;
        if (classItem.mckaynine_commission_type === 'percentage') {
          franchiseFee = totalRevenue * (classItem.mckaynine_commission_value / 100);
        } else {
          franchiseFee = bookingsCount * classItem.mckaynine_commission_value;
        }
        
        // Calculate admin fee
        let adminFee = 0;
        if (classItem.admin_fee_type === 'percentage') {
          adminFee = totalRevenue * (classItem.admin_fee_value / 100);
        } else {
          adminFee = bookingsCount * classItem.admin_fee_value;
        }
        
        // Calculate instructor fee
        let instructorFee = 0;
        if (classItem.trainer_fee_type === 'percentage') {
          instructorFee = totalRevenue * (classItem.trainer_fee_value / 100);
        } else {
          instructorFee = bookingsCount * classItem.trainer_fee_value;
        }
        
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
      
      console.log("Calculated finances:", finances);
      setClassFinances(finances);
    } catch (error) {
      console.error("Error calculating financial data:", error);
      toast.error("Error processing financial data");
    } finally {
      setIsCalculating(false);
    }
  }, [classes, financialData, isLoadingClasses, isLoadingFinancialData]);

  // Show loading state
  if (isLoadingClasses || isLoadingFinancialData || isCalculating) {
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
          <p className="text-muted-foreground py-4">No class financial data available for the selected date range</p>
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

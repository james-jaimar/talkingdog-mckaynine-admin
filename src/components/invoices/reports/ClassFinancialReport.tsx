
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
  
  // Format dates for logging and querying
  const fromDate = dateRange?.from;
  const toDate = dateRange?.to;
  
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

  // Direct query to get all bookings with their related class_schedules and classes
  const { data: bookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['financial-bookings', currentBranch?.id, fromDate?.toISOString(), toDate?.toISOString()],
    queryFn: async () => {
      if (!currentBranch?.id) {
        console.log("No branch ID available");
        return [];
      }
      
      console.log("Fetching bookings for financial report with date range:", 
        fromDate ? fromDate.toISOString().split('T')[0] : 'not set',
        "to",
        toDate ? toDate.toISOString().split('T')[0] : 'not set'
      );

      try {
        // Build the query to get bookings with all related data in a single query
        let query = supabase
          .from('bookings')
          .select(`
            id, 
            payment_status,
            proof_of_payment,
            class_schedule_id,
            created_at,
            class_schedules!inner (
              id,
              class_id,
              classes!inner (
                id,
                name,
                course_fee,
                enrollment_fee,
                mckaynine_commission_value,
                mckaynine_commission_type,
                admin_fee_value,
                admin_fee_type,
                trainer_fee_value,
                trainer_fee_type,
                branch_id
              )
            )
          `)
          .eq("class_schedules.classes.branch_id", currentBranch.id)
          .eq("status", "confirmed");
          
        // Apply date filters if provided
        if (fromDate) {
          query = query.gte('created_at', fromDate.toISOString());
          console.log("Filtering bookings from:", fromDate.toISOString());
        }
        
        if (toDate) {
          query = query.lte('created_at', toDate.toISOString());
          console.log("Filtering bookings to:", toDate.toISOString());
        }
        
        const { data: bookings, error } = await query;
        
        if (error) {
          console.error("Error fetching bookings:", error);
          throw error;
        }
        
        // Log the results for debugging
        console.log(`Found ${bookings?.length || 0} total bookings for financial report`);
        
        // Count bookings by payment status
        const paymentStatusCounts = bookings?.reduce((acc, booking) => {
          const status = booking.payment_status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const proofOfPaymentCount = bookings?.filter(b => b.proof_of_payment && b.proof_of_payment.trim() !== '').length || 0;
        
        console.log("Payment status breakdown:", paymentStatusCounts);
        console.log("Bookings with proof of payment:", proofOfPaymentCount);
        
        return bookings || [];
      } catch (err) {
        console.error("Error in bookings query:", err);
        throw err;
      }
    },
    enabled: !!currentBranch?.id,
  });

  // Calculate financial metrics directly from the bookings data
  useEffect(() => {
    if (isLoadingBookings || !bookingsData || bookingsData.length === 0) {
      console.log("No booking data available for calculations");
      return;
    }
    
    console.log(`Processing ${bookingsData.length} bookings for financial calculations`);
    
    setIsCalculating(true);
    
    try {
      // Group bookings by class ID
      const bookingsByClassId: Record<string, any[]> = {};
      
      bookingsData.forEach(booking => {
        const classId = booking.class_schedules?.classes?.id;
        if (classId) {
          if (!bookingsByClassId[classId]) {
            bookingsByClassId[classId] = [];
          }
          bookingsByClassId[classId].push(booking);
        }
      });
      
      console.log(`Grouped bookings into ${Object.keys(bookingsByClassId).length} class groups`);
      
      // Create financial records for each class
      const finances: ClassFinance[] = [];
      
      Object.entries(bookingsByClassId).forEach(([classId, classBookings]) => {
        if (!classBookings || classBookings.length === 0) return;
        
        const classData = classBookings[0].class_schedules.classes;
        
        // Count only paid bookings or those with proof of payment
        const paidBookings = classBookings.filter(booking => 
          booking.payment_status === 'paid' || 
          (booking.proof_of_payment && booking.proof_of_payment.trim() !== '')
        );
        
        const bookingsCount = paidBookings.length;
        console.log(`Class ${classData.name}: ${bookingsCount} paid/proof-of-payment bookings out of ${classBookings.length} total`);
        
        if (bookingsCount === 0) {
          console.log(`Skipping class ${classData.name} as it has no paid bookings`);
          return; // Skip classes with no paid bookings
        }

        // Calculate fees based on number of paid bookings
        const totalCourseFees = bookingsCount * (classData.course_fee || 0);
        const totalEnrollmentFees = bookingsCount * (classData.enrollment_fee || 0);
        const totalRevenue = totalCourseFees + totalEnrollmentFees;
        
        // Calculate franchise fee
        let franchiseFee = 0;
        if (classData.mckaynine_commission_type === 'percentage') {
          franchiseFee = totalRevenue * (classData.mckaynine_commission_value / 100);
        } else {
          franchiseFee = bookingsCount * classData.mckaynine_commission_value;
        }
        
        // Calculate admin fee
        let adminFee = 0;
        if (classData.admin_fee_type === 'percentage') {
          adminFee = totalRevenue * (classData.admin_fee_value / 100);
        } else {
          adminFee = bookingsCount * classData.admin_fee_value;
        }
        
        // Calculate instructor fee
        let instructorFee = 0;
        if (classData.trainer_fee_type === 'percentage') {
          instructorFee = totalRevenue * (classData.trainer_fee_value / 100);
        } else {
          instructorFee = bookingsCount * classData.trainer_fee_value;
        }
        
        // Calculate profit
        const profit = totalRevenue - franchiseFee - adminFee - instructorFee;
        
        finances.push({
          className: classData.name,
          courseFee: totalCourseFees,
          enrollmentFee: totalEnrollmentFees,
          franchiseFee,
          totalOwingToFranchisor: franchiseFee,
          adminFee,
          instructorFee,
          profit,
          bookingsCount
        });
      });
      
      console.log("Calculated financial data for classes:", finances);
      setClassFinances(finances);
    } catch (error) {
      console.error("Error calculating financial data:", error);
      toast.error("Error processing financial data");
    } finally {
      setIsCalculating(false);
    }
  }, [bookingsData, isLoadingBookings]);

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

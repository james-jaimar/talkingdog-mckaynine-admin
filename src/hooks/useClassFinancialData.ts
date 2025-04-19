
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClassFinance {
  className: string;
  totalRevenue: number;
  bookingsCount: number;
  franchiseFee: number;
  adminFee: number;
  instructorFee: number;
  profit: number;
}

export function useClassFinancialData(branchId?: string, fromDate?: string, toDate?: string) {
  const [classFinances, setClassFinances] = useState<ClassFinance[]>([]);
  const queryClient = useQueryClient();
  
  // Track invoices data to trigger refetch when invoices change
  const invoicesKey = ['invoices', branchId];
  const invoicesData = queryClient.getQueryData(invoicesKey);

  // Get financial data that combines bookings and invoice information
  const { data: financialData, isLoading } = useQuery({
    queryKey: ['financial-bookings', branchId, fromDate, toDate, invoicesData],
    queryFn: async () => {
      if (!branchId) return [];

      console.log(`Fetching financial data for branch ${branchId} from ${fromDate} to ${toDate}`);
      
      // First get all confirmed bookings in the date range
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          payment_status,
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
        .eq('class_schedules.classes.branch_id', branchId)
        .eq('status', 'confirmed')
        .gte('created_at', fromDate)
        .lte('created_at', toDate);

      if (bookingsError) {
        console.error("Error fetching booking data for financial report:", bookingsError);
        throw bookingsError;
      }
      
      // Get all invoice items linked to these bookings to check their payment status
      const bookingIds = bookings?.map(b => b.id) || [];
      let invoiceItems: any[] = [];
      
      if (bookingIds.length > 0) {
        const { data: items, error: itemsError } = await supabase
          .from('invoice_items')
          .select(`
            booking_id,
            invoice_id,
            invoices:invoice_id (
              status,
              payment_received,
              total
            )
          `)
          .in('booking_id', bookingIds);
        
        if (itemsError) {
          console.error("Error fetching invoice items:", itemsError);
        } else {
          invoiceItems = items || [];
        }
      }
      
      // Create a map of booking id to invoice payment status
      const bookingPaymentMap = new Map();
      invoiceItems.forEach(item => {
        if (item.booking_id && item.invoices) {
          bookingPaymentMap.set(item.booking_id, {
            isPaid: item.invoices.payment_received === true || item.invoices.status === 'paid',
            invoiceTotal: item.invoices.total || 0
          });
        }
      });
      
      console.log(`Retrieved ${bookings?.length || 0} bookings and ${invoiceItems.length} invoice items`);
      
      // Return data with payment info
      return bookings?.map(booking => ({
        ...booking,
        invoiceInfo: bookingPaymentMap.get(booking.id) || { isPaid: false, invoiceTotal: 0 }
      })) || [];
    },
    enabled: !!branchId && !!fromDate && !!toDate,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Process booking data into financial summaries
  useEffect(() => {
    if (!financialData) {
      setClassFinances([]);
      return;
    }

    const classSummaries = new Map<string, ClassFinance>();

    financialData.forEach(booking => {
      const classData = booking.class_schedules?.classes;
      if (!classData) return;

      const className = classData.name;
      // Use invoice amount if available, otherwise use course fee from class
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

      // Calculate fees based on course fee
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

    // Convert to array and sort by class name
    const sortedFinances = Array.from(classSummaries.values())
      .sort((a, b) => a.className.localeCompare(b.className));
      
    console.log(`Processed ${sortedFinances.length} class financial summaries`);
    console.log(`Total revenue across classes: ${sortedFinances.reduce((sum, curr) => sum + curr.totalRevenue, 0)}`);
    setClassFinances(sortedFinances);
  }, [financialData]);

  // Function to manually refresh the data
  const refreshData = () => {
    console.log("Manually refreshing financial data");
    queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
  };

  return { classFinances, isLoading, refreshData };
}

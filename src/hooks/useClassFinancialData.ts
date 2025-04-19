
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
      
      // First get all confirmed bookings with their class information
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
      
      // Also fetch invoice items to get accurate revenue data
      const { data: invoiceItems, error: invoiceItemsError } = await supabase
        .from('invoice_items')
        .select(`
          id,
          invoice_id,
          booking_id,
          amount,
          unit_price,
          quantity,
          invoices:invoice_id (
            id,
            status,
            payment_received,
            total,
            client_id,
            issued_date
          )
        `)
        .gte('invoices.issued_date', fromDate)
        .lte('invoices.issued_date', toDate)
        .neq('invoices.status', 'cancelled');
        
      if (invoiceItemsError) {
        console.error("Error fetching invoice items:", invoiceItemsError);
        throw invoiceItemsError;
      }
        
      // Map invoices to bookings for financial calculations
      const bookingInvoiceMap = new Map();
      
      if (invoiceItems && invoiceItems.length > 0) {
        invoiceItems.forEach(item => {
          if (item.booking_id) {
            bookingInvoiceMap.set(item.booking_id, {
              amount: item.amount || (item.unit_price * item.quantity),
              invoiceStatus: item.invoices?.status || 'unknown',
              isPaid: item.invoices?.payment_received || item.invoices?.status === 'paid'
            });
          }
        });
      }
      
      console.log(`Retrieved ${bookings?.length || 0} bookings and ${invoiceItems?.length || 0} invoice items`);
      console.log(`Mapped ${bookingInvoiceMap.size} bookings to invoices`);
      
      // Enhance bookings with invoice data
      return bookings?.map(booking => {
        // Get invoice data if available
        const invoiceData = bookingInvoiceMap.get(booking.id);
        
        // Use invoice amount if available, otherwise use class fee
        const courseFromClass = booking.class_schedules?.classes?.course_fee || 0;
        const invoiceAmount = invoiceData?.amount;
        
        // Prioritize invoice amount over class fee for revenue calculation
        const actualRevenue = invoiceAmount !== undefined ? invoiceAmount : courseFromClass;
        
        return {
          ...booking,
          actualRevenue,
          invoiceInfo: invoiceData || { isPaid: false, amount: 0, invoiceStatus: 'not_invoiced' },
          calculatedFee: courseFromClass // Keep the class fee for percentage calculations
        };
      }) || [];
    },
    enabled: !!branchId && !!fromDate && !!toDate,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    gcTime: 10 * 60 * 1000, // 10 minutes - changed from cacheTime to gcTime
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
      // Use actual revenue from invoice or course fee
      const courseRevenue = booking.actualRevenue || classData.course_fee || 0;

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
      summary.totalRevenue += courseRevenue;

      // For fee calculations, use the class's defined percentages
      // but apply them to the actual revenue collected (from invoice if available)
      const feeBaseAmount = booking.calculatedFee || courseRevenue;

      // Calculate fees based on course fee
      if (classData.mckaynine_commission_type === 'percentage') {
        summary.franchiseFee += feeBaseAmount * (classData.mckaynine_commission_value / 100);
      } else {
        summary.franchiseFee += classData.mckaynine_commission_value;
      }

      if (classData.admin_fee_type === 'percentage') {
        summary.adminFee += feeBaseAmount * (classData.admin_fee_value / 100);
      } else {
        summary.adminFee += classData.admin_fee_value;
      }

      if (classData.trainer_fee_type === 'percentage') {
        summary.instructorFee += feeBaseAmount * (classData.trainer_fee_value / 100);
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

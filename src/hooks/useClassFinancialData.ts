
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
  invoiceCount: number;
  sourceType?: 'class' | 'general';
  invoiceIds?: string[];
}

export function useClassFinancialData(branchId?: string, fromDate?: string, toDate?: string) {
  const [classFinances, setClassFinances] = useState<ClassFinance[]>([]);
  const [totalInvoiceCount, setTotalInvoiceCount] = useState<number>(0);
  const [invalidInvoicesCount, setInvalidInvoicesCount] = useState<number>(0);
  const queryClient = useQueryClient();
  
  // Track invoices data to trigger refetch when invoices change
  const invoicesKey = ['invoices', branchId];
  const invoicesData = queryClient.getQueryData(invoicesKey);

  // Get financial data that combines bookings and invoice information
  const { data: financialData, isLoading } = useQuery({
    queryKey: ['financial-bookings', branchId, fromDate, toDate, invoicesData],
    queryFn: async () => {
      if (!branchId) return { 
        bookingsWithInvoices: [], 
        allInvoicesCount: 0,
        invalidInvoicesCount: 0,
        totalRevenue: 0,
        invoiceRevenue: []
      };

      console.log(`Fetching financial data for branch ${branchId} from ${fromDate} to ${toDate}`);
      
      // Get all valid invoices for this branch
      let totalRevenueQuery = supabase
        .from('invoices')
        .select('id, total, status, subtotal, monetary_discount, client:client_id (branch_id)')
        .eq('client.branch_id', branchId)
        .in('status', ['sent', 'paid', 'overdue']);
        
      // Apply date filtering if dates are provided
      if (fromDate && toDate) {
        totalRevenueQuery = totalRevenueQuery.gte('issued_date', fromDate).lte('issued_date', toDate);
      }
      
      const { data: invoicesTotal, error: invoiceTotalError } = await totalRevenueQuery;
      
      if (invoiceTotalError) {
        console.error("Error fetching invoice totals:", invoiceTotalError);
      }
      
      // Calculate the total revenue from all active invoices (after discounts)
      const totalRevenueFromInvoices = invoicesTotal?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
      // Calculate the total gross revenue before discounts
      const totalGrossRevenue = invoicesTotal?.reduce((sum, inv) => sum + (inv.subtotal || 0), 0) || 0;
      // Calculate total discounts
      const totalDiscounts = invoicesTotal?.reduce((sum, inv) => sum + (inv.monetary_discount || 0), 0) || 0;
      
      console.log(`Total gross revenue before discounts: ${totalGrossRevenue}`);
      console.log(`Total discounts: ${totalDiscounts}`);
      console.log(`Total net revenue from all invoices after discounts: ${totalRevenueFromInvoices}`);
      
      // Set up query for confirmed bookings with their class information
      let query = supabase
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
        .eq('status', 'confirmed');
        
      // Apply date filtering if dates are provided
      if (fromDate && toDate) {
        query = query.gte('created_at', fromDate).lte('created_at', toDate);
      }
      
      const { data: bookings, error: bookingsError } = await query;

      if (bookingsError) {
        console.error("Error fetching booking data for financial report:", bookingsError);
        throw bookingsError;
      }
      
      // Get a count of all non-cancelled invoices for the branch within date range
      let countQuery = supabase
        .from('invoices')
        .select(`
          id,
          client:client_id (
            branch_id
          )
        `, { count: 'exact' })
        .eq('client.branch_id', branchId)
        .in('status', ['sent', 'paid', 'overdue']);
        
      // Apply date filtering if dates are provided
      if (fromDate && toDate) {
        countQuery = countQuery.gte('issued_date', fromDate).lte('issued_date', toDate);
      }
      
      const { count: allInvoicesCount, error: countError } = await countQuery;
      
      if (countError) {
        console.error("Error counting invoices:", countError);
      }
      
      console.log(`Total invoice count for branch ${branchId}: ${allInvoicesCount}`);

      // Extended query to get ALL invoice items with full invoice details
      let invoiceQuery = supabase
        .from('invoice_items')
        .select(`
          id,
          invoice_id,
          booking_id,
          amount,
          unit_price,
          quantity,
          description,
          invoices:invoice_id (
            id,
            status,
            payment_received,
            total,
            subtotal,
            tax_amount,
            discount_amount,
            discount_type,
            monetary_discount,
            client_id,
            issued_date,
            invoice_number,
            client:client_id (
              branch_id
            )
          )
        `)
        .in('invoices.status', ['sent', 'paid', 'overdue']);
        
      // Apply date filtering if dates are provided
      if (fromDate && toDate) {
        invoiceQuery = invoiceQuery.gte('invoices.issued_date', fromDate)
                                   .lte('invoices.issued_date', toDate);
      }
        
      const { data: invoiceItems, error: invoiceItemsError } = await invoiceQuery;
      
      if (invoiceItemsError) {
        console.error("Error fetching invoice items:", invoiceItemsError);
        throw invoiceItemsError;
      }

      // Filter invoice items by the specified branch
      const branchInvoiceItems = invoiceItems?.filter(item => 
        item.invoices?.client?.branch_id === branchId
      ) || [];
      
      console.log(`Filtered to ${branchInvoiceItems.length} invoice items for branch ${branchId}`);
      
      // Create a map to accumulate revenues from all items per booking
      const bookingRevenueMap = new Map();
      
      // Track unique invoices per class
      const classInvoiceMap = new Map();
      
      // Track discounts per invoice
      const invoiceDiscountMap = new Map();
      
      // First, collect all invoice discounts
      branchInvoiceItems.forEach(item => {
        if (!item.invoices) return;
        
        const invoiceId = item.invoice_id;
        const monetaryDiscount = item.invoices.monetary_discount || 0;
        
        // Save discount info for each invoice
        invoiceDiscountMap.set(invoiceId, {
          discountAmount: monetaryDiscount,
          subtotal: item.invoices.subtotal || 0,
          total: item.invoices.total || 0
        });
      });
      
      // Now process all items and apply discount proportionally
      branchInvoiceItems.forEach(item => {
        if (!item.booking_id || !item.invoices) return;
        
        // Get invoice level data
        const invoiceId = item.invoice_id;
        const invoiceData = invoiceDiscountMap.get(invoiceId);
        const invoiceSubtotal = invoiceData?.subtotal || 0;
        const invoiceDiscountAmount = invoiceData?.discountAmount || 0;
        
        // Calculate discount proportion for this item
        const itemAmount = item.amount || 0;
        let itemDiscount = 0;
        
        if (invoiceSubtotal > 0 && invoiceDiscountAmount > 0) {
          // Apply discount proportionally based on this item's contribution to the invoice
          const proportion = itemAmount / invoiceSubtotal;
          itemDiscount = proportion * invoiceDiscountAmount;
        }
        
        // Actual revenue after applying proportional discount
        const actualItemRevenue = Math.max(0, itemAmount - itemDiscount);
        
        console.log(`Item ${item.id} for booking ${item.booking_id}: Amount=${itemAmount}, Discount=${itemDiscount.toFixed(2)}, Net=${actualItemRevenue.toFixed(2)}`);
        
        // Initialize booking revenue entry if it doesn't exist
        if (!bookingRevenueMap.has(item.booking_id)) {
          bookingRevenueMap.set(item.booking_id, {
            totalRevenue: 0,
            invoiceIds: new Set()
          });
        }
        
        const bookingRevenue = bookingRevenueMap.get(item.booking_id);
        bookingRevenue.totalRevenue += actualItemRevenue;
        bookingRevenue.invoiceIds.add(item.invoice_id);
      });
      
      console.log(`Mapped revenue for ${bookingRevenueMap.size} bookings`);

      // Process bookings with their complete revenue information
      const processedBookings = bookings?.map(booking => {
        const bookingRevenue = bookingRevenueMap.get(booking.id) || { 
          totalRevenue: 0, 
          invoiceIds: new Set() 
        };
        
        const className = booking.class_schedules?.classes?.name;
        if (className && bookingRevenue.invoiceIds.size > 0) {
          if (!classInvoiceMap.has(className)) {
            classInvoiceMap.set(className, new Set());
          }
          bookingRevenue.invoiceIds.forEach(id => 
            classInvoiceMap.get(className).add(id)
          );
        }
        
        return {
          ...booking,
          actualRevenue: bookingRevenue.totalRevenue,
          invoiceIds: Array.from(bookingRevenue.invoiceIds),
          calculatedFee: booking.class_schedules?.classes?.course_fee || 0
        };
      }) || [];
      
      // Get invalid invoices count
      let invalidQuery = supabase
        .from('invoices')
        .select('*', { count: 'exact' })
        .eq('status', 'invalid')
        .eq('client.branch_id', branchId);
        
      // Apply date filtering if dates are provided
      if (fromDate && toDate) {
        invalidQuery = invalidQuery.gte('issued_date', fromDate).lte('issued_date', toDate);
      }
        
      const { count: invalidCount, error: invalidError } = await invalidQuery;
      
      if (invalidError) {
        console.error("Error counting invalid invoices:", invalidError);
      }

      return { 
        bookingsWithInvoices: processedBookings, 
        allInvoicesCount: allInvoicesCount || 0,
        invalidInvoicesCount: invalidCount || 0,
        totalRevenue: totalRevenueFromInvoices,
        totalDiscounts: totalDiscounts,
        classInvoiceMap: Array.from(classInvoiceMap.entries()).map(([className, invoiceIds]) => ({
          className,
          invoiceIds: Array.from(invoiceIds) as string[]  // Fix: Explicitly cast to string[]
        }))
      };
    },
    enabled: !!branchId,
    staleTime: 30000,
    refetchOnWindowFocus: true,
    gcTime: 10 * 60 * 1000,
  });

  // Process booking data into financial summaries
  useEffect(() => {
    if (!financialData) {
      setClassFinances([]);
      setTotalInvoiceCount(0);
      setInvalidInvoicesCount(0);
      return;
    }

    const { 
      bookingsWithInvoices, 
      allInvoicesCount,
      invalidInvoicesCount,
      totalRevenue,
      totalDiscounts,
      classInvoiceMap
    } = financialData;
    
    setTotalInvoiceCount(allInvoicesCount);
    setInvalidInvoicesCount(invalidInvoicesCount);
    
    // Process the class finances with complete revenue tracking
    const classSummaries = new Map<string, ClassFinance>();
    
    // Process all bookings and their associated revenue
    bookingsWithInvoices.forEach(booking => {
      const classData = booking.class_schedules?.classes;
      if (!classData) return;

      const className = classData.name;
      const totalRevenue = booking.actualRevenue || 0;
      
      // Get or create class summary
      const summary = classSummaries.get(className) || {
        className,
        totalRevenue: 0,
        bookingsCount: 0,
        franchiseFee: 0,
        adminFee: 0,
        instructorFee: 0,
        profit: 0,
        invoiceCount: 0,
        sourceType: 'class',
        invoiceIds: []
      };

      // Update summary with complete revenue information
      summary.bookingsCount++;
      summary.totalRevenue += totalRevenue;

      // Calculate fees based on actual revenue (after discount)
      if (classData.mckaynine_commission_type === 'percentage') {
        summary.franchiseFee += (totalRevenue * (classData.mckaynine_commission_value / 100));
      } else {
        summary.franchiseFee += classData.mckaynine_commission_value;
      }

      if (classData.admin_fee_type === 'percentage') {
        summary.adminFee += (totalRevenue * (classData.admin_fee_value / 100));
      } else {
        summary.adminFee += classData.admin_fee_value;
      }

      if (classData.trainer_fee_type === 'percentage') {
        summary.instructorFee += (totalRevenue * (classData.trainer_fee_value / 100));
      } else {
        summary.instructorFee += classData.trainer_fee_value;
      }

      classSummaries.set(className, summary);
    });

    // Update invoice counts from the classInvoiceMap
    classInvoiceMap.forEach(({ className, invoiceIds }) => {
      const summary = classSummaries.get(className);
      if (summary) {
        summary.invoiceCount = invoiceIds.length;
        summary.invoiceIds = invoiceIds;
      }
    });

    // Calculate profits after all fees are computed
    classSummaries.forEach(summary => {
      summary.profit = summary.totalRevenue - summary.franchiseFee - summary.adminFee - summary.instructorFee;
    });

    // Convert to array and sort by class name
    const sortedFinances = Array.from(classSummaries.values())
      .sort((a, b) => a.className.localeCompare(b.className));
      
    console.log(`Processed ${sortedFinances.length} class financial summaries`);
    console.log(`Total revenue across classes: ${sortedFinances.reduce((sum, curr) => sum + curr.totalRevenue, 0)}`);
    console.log(`Total invoice revenue: ${totalRevenue}`);
    console.log(`Total discounts: ${totalDiscounts}`);
    
    setClassFinances(sortedFinances);
  }, [financialData]);

  const refreshData = () => {
    console.log("Manually refreshing financial data");
    queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
  };
  
  return { 
    classFinances, 
    isLoading, 
    refreshData,
    totalInvoiceCount,
    invalidInvoicesCount,
    totalRevenue: financialData?.totalRevenue || 0,
    totalDiscounts: financialData?.totalDiscounts || 0
  };
}

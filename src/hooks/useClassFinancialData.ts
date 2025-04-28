
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
        .select('id, total, status, client:client_id (branch_id)')
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
      
      // Calculate the total revenue from all active invoices
      const totalRevenueFromInvoices = invoicesTotal?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
      console.log(`Total revenue from all invoices: ${totalRevenueFromInvoices}`);
      
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
      
      // Extended query to get invoice items with full invoice details
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
        
      // Map invoices to bookings for financial calculations
      const bookingInvoiceMap = new Map();
      
      // Track all unique invoice IDs to verify our total count
      const allInvoiceIds = new Set<string>();
      
      // Prepare data structure for revenue tracking by invoice
      const invoiceRevenueMap = new Map<string, {
        invoiceId: string,
        invoiceNumber: string,
        total: number,
        bookingIds: string[],
        classIds: string[],
        classNames: string[]
      }>();
      
      if (branchInvoiceItems && branchInvoiceItems.length > 0) {
        branchInvoiceItems.forEach(item => {
          if (item.invoices?.id) {
            allInvoiceIds.add(item.invoices.id);
            
            // Track invoice revenue
            const invoiceId = item.invoices.id;
            
            if (!invoiceRevenueMap.has(invoiceId)) {
              invoiceRevenueMap.set(invoiceId, {
                invoiceId,
                invoiceNumber: item.invoices.invoice_number || 'Unknown',
                total: item.invoices.total || 0,
                bookingIds: [],
                classIds: [],
                classNames: []
              });
            }
            
            // Add booking relationship if exists
            if (item.booking_id) {
              const invoiceRevenue = invoiceRevenueMap.get(invoiceId);
              if (invoiceRevenue) {
                invoiceRevenue.bookingIds.push(item.booking_id);
              }
              
              // Also update booking invoice map
              bookingInvoiceMap.set(item.booking_id, {
                amount: item.amount || (item.unit_price * item.quantity),
                description: item.description,
                invoiceStatus: item.invoices?.status || 'unknown',
                isPaid: item.invoices?.payment_received || item.invoices?.status === 'paid',
                invoiceId: item.invoice_id
              });
            }
          }
        });
      }
      
      console.log(`Retrieved ${bookings?.length || 0} bookings and ${branchInvoiceItems?.length || 0} invoice items`);
      console.log(`Mapped ${bookingInvoiceMap.size} bookings to invoices`);
      console.log(`Unique invoice IDs found: ${allInvoiceIds.size}`);
      
      // Convert invoice revenue map to array
      const invoiceRevenue = Array.from(invoiceRevenueMap.values());
      
      // Enhance bookings with invoice data
      const bookingsWithInvoices = bookings?.map(booking => {
        // Get invoice data if available
        const invoiceData = bookingInvoiceMap.get(booking.id);
        
        // Use invoice amount if available, otherwise use class fee
        const courseFromClass = booking.class_schedules?.classes?.course_fee || 0;
        const invoiceAmount = invoiceData?.amount;
        
        // For revenue calculation: prioritize invoice amount, fallback to class fee
        const actualRevenue = invoiceAmount !== undefined ? invoiceAmount : courseFromClass;
        
        // Update invoice revenue map with class info
        if (invoiceData?.invoiceId && booking.class_schedules?.classes) {
          const classId = booking.class_schedules.classes.id;
          const className = booking.class_schedules.classes.name;
          
          const invoiceRevenue = invoiceRevenueMap.get(invoiceData.invoiceId);
          if (invoiceRevenue && !invoiceRevenue.classIds.includes(classId)) {
            invoiceRevenue.classIds.push(classId);
            invoiceRevenue.classNames.push(className);
          }
        }
        
        return {
          ...booking,
          actualRevenue,
          invoiceInfo: invoiceData || { isPaid: false, amount: 0, invoiceStatus: 'not_invoiced' },
          calculatedFee: courseFromClass // Keep the class fee for percentage calculations
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
        bookingsWithInvoices, 
        allInvoicesCount: allInvoicesCount || allInvoiceIds.size,
        invalidInvoicesCount: invalidCount || 0,
        totalRevenue: totalRevenueFromInvoices,
        invoiceRevenue
      };
    },
    enabled: !!branchId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    gcTime: 10 * 60 * 1000, // 10 minutes
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
      invoiceRevenue
    } = financialData;
    
    // Update the total invoice count state
    setTotalInvoiceCount(allInvoicesCount);
    setInvalidInvoicesCount(invalidInvoicesCount);
    
    // Process the class finances
    const classSummaries = new Map<string, ClassFinance>();
    
    // Track unique invoice IDs for accurate invoice counting
    const invoicesCountByClass = new Map<string, Set<string>>();
    
    // Initialize invoice counting mechanism
    bookingsWithInvoices.forEach(booking => {
      const classData = booking.class_schedules?.classes;
      if (!classData) return;
      
      const className = classData.name;
      
      // Initialize the set for this class if it doesn't exist
      if (!invoicesCountByClass.has(className)) {
        invoicesCountByClass.set(className, new Set<string>());
      }
      
      // Add the invoice ID to the set if it exists
      if (booking.invoiceInfo && booking.invoiceInfo.invoiceId) {
        const invoiceSet = invoicesCountByClass.get(className);
        if (invoiceSet) {
          invoiceSet.add(booking.invoiceInfo.invoiceId);
        }
      }
    });

    // Now process financial data with accurate invoice counting
    bookingsWithInvoices.forEach(booking => {
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
        profit: 0,
        invoiceCount: 0,
        sourceType: 'class',
        invoiceIds: []
      };

      // Update summary
      summary.bookingsCount++;
      summary.totalRevenue += courseRevenue;
      
      // Set invoice count based on unique invoice IDs
      const invoiceSet = invoicesCountByClass.get(className);
      if (invoiceSet) {
        summary.invoiceCount = invoiceSet.size;
        summary.invoiceIds = Array.from(invoiceSet);
      }

      // Calculate fees based on actual revenue, not just the class fee
      if (classData.mckaynine_commission_type === 'percentage') {
        summary.franchiseFee += (courseRevenue * (classData.mckaynine_commission_value / 100));
      } else {
        summary.franchiseFee += classData.mckaynine_commission_value;
      }

      if (classData.admin_fee_type === 'percentage') {
        summary.adminFee += (courseRevenue * (classData.admin_fee_value / 100));
      } else {
        summary.adminFee += classData.admin_fee_value;
      }

      if (classData.trainer_fee_type === 'percentage') {
        summary.instructorFee += (courseRevenue * (classData.trainer_fee_value / 100));
      } else {
        summary.instructorFee += classData.trainer_fee_value;
      }

      classSummaries.set(className, summary);
    });

    // Calculate profits after all fees are computed
    classSummaries.forEach(summary => {
      summary.profit = summary.totalRevenue - summary.franchiseFee - summary.adminFee - summary.instructorFee;
    });

    // Now add general revenue category for invoices without class associations
    // This handles revenue from invoices with discounts or without booking links
    const classRevenueTotal = Array.from(classSummaries.values()).reduce(
      (sum, curr) => sum + curr.totalRevenue, 0
    );
    
    // Calculate difference between total invoice revenue and allocated class revenue
    const unallocatedRevenue = totalRevenue - classRevenueTotal;
    
    if (unallocatedRevenue > 1) { // Only add if there's a material difference
      const generalTraining: ClassFinance = {
        className: "General Training Services",
        totalRevenue: unallocatedRevenue,
        bookingsCount: 0,
        franchiseFee: 0,
        adminFee: 0,
        instructorFee: 0,
        profit: unallocatedRevenue, // All is profit since we don't know the breakdown
        invoiceCount: 0,
        sourceType: 'general',
        invoiceIds: []
      };
      
      classSummaries.set(generalTraining.className, generalTraining);
    }

    // Convert to array and sort by class name
    const sortedFinances = Array.from(classSummaries.values())
      .sort((a, b) => a.className.localeCompare(b.className));
      
    console.log(`Processed ${sortedFinances.length} class financial summaries`);
    console.log(`Total revenue across classes: ${sortedFinances.reduce((sum, curr) => sum + curr.totalRevenue, 0)}`);
    console.log(`Total invoice revenue: ${totalRevenue}`);
    
    setClassFinances(sortedFinances);
  }, [financialData]);

  // Function to manually refresh the data
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
    totalRevenue: financialData?.totalRevenue || 0
  };
}

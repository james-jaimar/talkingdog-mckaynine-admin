
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
  sourceType?: 'class' | 'unallocated' | 'general'; // Added to track revenue source
  invoiceIds?: string[]; // Added to track associated invoices
}

export function useClassFinancialData(branchId?: string, fromDate?: string, toDate?: string) {
  const [classFinances, setClassFinances] = useState<ClassFinance[]>([]);
  const [unassociatedRevenue, setUnassociatedRevenue] = useState<number>(0);
  const [totalInvoiceCount, setTotalInvoiceCount] = useState<number>(0);
  const [invalidInvoicesCount, setInvalidInvoicesCount] = useState<number>(0);
  const [unallocatedDetails, setUnallocatedDetails] = useState<any[]>([]);
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
        unassociatedInvoices: [], 
        allInvoicesCount: 0,
        invalidInvoicesCount: 0,
        totalRevenue: 0,
        unallocatedInvoices: []
      };

      console.log(`Fetching financial data for branch ${branchId} from ${fromDate} to ${toDate}`);
      
      // Get all valid invoices for this branch regardless of booking associations
      // This ensures we capture ALL revenue, even those not linked to classes
      let totalRevenueQuery = supabase
        .from('invoices')
        .select('total, status, client:client_id (branch_id)')
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
      
      // Also fetch invoice items to get accurate revenue data
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
            client_id,
            issued_date,
            invoice_number,
            client:client_id (
              branch_id,
              first_name,
              last_name,
              email
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
      
      // Track invoice items without booking associations
      const unassociatedInvoiceItems: any[] = [];
      
      // Track all unique invoice IDs to verify our total count
      const allInvoiceIds = new Set<string>();
      
      if (branchInvoiceItems && branchInvoiceItems.length > 0) {
        branchInvoiceItems.forEach(item => {
          if (item.invoices?.id) {
            allInvoiceIds.add(item.invoices.id);
          }
          
          if (item.booking_id) {
            bookingInvoiceMap.set(item.booking_id, {
              amount: item.amount || (item.unit_price * item.quantity),
              description: item.description,
              invoiceStatus: item.invoices?.status || 'unknown',
              isPaid: item.invoices?.payment_received || item.invoices?.status === 'paid',
              invoiceId: item.invoice_id
            });
          } else {
            // Track invoice items without booking associations
            unassociatedInvoiceItems.push({
              ...item,
              amount: item.amount || (item.unit_price * item.quantity)
            });
          }
        });
      }
      
      console.log(`Retrieved ${bookings?.length || 0} bookings and ${branchInvoiceItems?.length || 0} invoice items`);
      console.log(`Mapped ${bookingInvoiceMap.size} bookings to invoices`);
      console.log(`Found ${unassociatedInvoiceItems.length} invoice items without booking associations`);
      console.log(`Unique invoice IDs found: ${allInvoiceIds.size}`);
      
      // Enhance bookings with invoice data
      const bookingsWithInvoices = bookings?.map(booking => {
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
      
      // Directly query all invoices to double-check the total
      let directRevenueQuery = supabase
        .from('invoices')
        .select(`
          id, 
          total, 
          status, 
          invoice_number,
          client_id,
          clients:client_id (
            first_name, 
            last_name, 
            email, 
            branch_id
          ),
          items:invoice_items (
            id, 
            description, 
            booking_id,
            amount, 
            unit_price, 
            quantity
          )
        `)
        .in('status', ['sent', 'paid', 'overdue']);
        
      // Apply branch filtering through client
      directRevenueQuery = directRevenueQuery.eq('clients.branch_id', branchId);
      
      // Apply date filtering if dates are provided
      if (fromDate && toDate) {
        directRevenueQuery = directRevenueQuery.gte('issued_date', fromDate).lte('issued_date', toDate);
      }
      
      const { data: directRevenueData, error: directRevenueError } = await directRevenueQuery;
      
      if (directRevenueError) {
        console.error("Error fetching direct revenue data:", directRevenueError);
      } else {
        console.log(`Direct revenue query found ${directRevenueData?.length || 0} invoices`);
      }

      // Find invoices with no booking associations for further analysis
      const unallocatedInvoices = directRevenueData?.filter(invoice => {
        const hasBookingAssociation = invoice.items?.some(item => item.booking_id);
        return !hasBookingAssociation;
      }) || [];
      
      console.log(`Found ${unallocatedInvoices.length} invoices with no booking associations`);

      return { 
        bookingsWithInvoices, 
        unassociatedInvoices: unassociatedInvoiceItems,
        allInvoicesCount: allInvoicesCount || allInvoiceIds.size,
        invalidInvoicesCount: invalidCount || 0,
        totalRevenue: totalRevenueFromInvoices,
        unallocatedInvoices
      };
    },
    enabled: !!branchId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    gcTime: 10 * 60 * 1000, // 10 minutes - using gcTime instead of cacheTime
  });

  // Process booking data into financial summaries
  useEffect(() => {
    if (!financialData) {
      setClassFinances([]);
      setUnassociatedRevenue(0);
      setTotalInvoiceCount(0);
      setInvalidInvoicesCount(0);
      setUnallocatedDetails([]);
      return;
    }

    const { 
      bookingsWithInvoices, 
      unassociatedInvoices, 
      allInvoicesCount,
      invalidInvoicesCount,
      totalRevenue,
      unallocatedInvoices
    } = financialData;
    
    // Update the total invoice count state
    setTotalInvoiceCount(allInvoicesCount);
    setInvalidInvoicesCount(invalidInvoicesCount);
    
    // Save unallocated invoice details for inspection
    setUnallocatedDetails(unallocatedInvoices || []);
    
    // Calculate total revenue from unassociated invoice items
    const unassociatedTotal = unassociatedInvoices.reduce((sum, item) => sum + (item.amount || 0), 0);
    setUnassociatedRevenue(unassociatedTotal);
    
    // Process the class finances
    const classSummaries = new Map<string, ClassFinance>();
    
    // Track unique invoice IDs for accurate invoice counting
    const invoicesCountByClass = new Map<string, Set<string>>();
    
    // Track mapped invoices to detect unallocated ones
    const mappedInvoiceIds = new Set<string>();

    // Create a "General Training" entry for unassociated revenue if it exists
    if (unassociatedTotal > 0) {
      // Create a set of unique invoice IDs for general training
      const generalTrainingInvoiceIds = new Set<string>();
      unassociatedInvoices.forEach(item => {
        if (item.invoice_id) {
          generalTrainingInvoiceIds.add(item.invoice_id);
          mappedInvoiceIds.add(item.invoice_id);
        }
      });
      
      const generalTraining: ClassFinance = {
        className: "General Training Services",
        totalRevenue: unassociatedTotal,
        bookingsCount: 0,
        franchiseFee: unassociatedTotal * 0.1, // Default commission rate (10%)
        adminFee: unassociatedTotal * 0.1,     // Default admin fee (10%)
        instructorFee: unassociatedTotal * 0.6, // Default trainer fee (60%)
        profit: unassociatedTotal * 0.2, // Remaining 20% profit
        invoiceCount: generalTrainingInvoiceIds.size, // Count unique invoices
        sourceType: 'general',
        invoiceIds: Array.from(generalTrainingInvoiceIds)
      };
      
      classSummaries.set("General Training Services", generalTraining);
    }

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
          mappedInvoiceIds.add(booking.invoiceInfo.invoiceId);
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

      // For fee calculations, use the actual revenue collected
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
      // Use actual revenue for profit calculation
      summary.profit = summary.totalRevenue - summary.franchiseFee - summary.adminFee - summary.instructorFee;
    });

    // Process unallocated invoices - invoices with no booking associations
    // Group them by patterns in descriptions to create better categories
    const unallocatedByCategory = new Map<string, {
      totalRevenue: number, 
      invoiceIds: string[],
      invoices: any[]
    }>();
    
    // Process unallocated invoices to find patterns
    unallocatedInvoices.forEach(invoice => {
      // Skip if this invoice is already mapped somewhere
      if (Array.from(mappedInvoiceIds).includes(invoice.id)) {
        return;
      }
      
      // Try to determine a category based on invoice items descriptions
      let category = "Unallocated Revenue";
      const descriptions = invoice.items?.map((item: any) => item.description?.toLowerCase() || "") || [];
      
      // Look for class-related keywords
      if (descriptions.some(desc => desc.includes("puppy") || desc.includes("puppy class"))) {
        category = "Puppy Class Revenue";
      } else if (descriptions.some(desc => desc.includes("bronze") || desc.includes("cgc"))) {
        category = "Bronze CGC Revenue";
      } else if (descriptions.some(desc => desc.includes("eo3") || desc.includes("eo"))) {
        category = "EO Class Revenue";
      } else if (descriptions.some(desc => desc.includes("yoga"))) {
        category = "Yoga Class Revenue";
      }
      
      // Get or create category entry
      const categoryData = unallocatedByCategory.get(category) || {
        totalRevenue: 0, 
        invoiceIds: [],
        invoices: []
      };
      
      // Add this invoice's revenue
      categoryData.totalRevenue += invoice.total || 0;
      categoryData.invoiceIds.push(invoice.id);
      categoryData.invoices.push(invoice);
      
      unallocatedByCategory.set(category, categoryData);
    });
    
    // Add categorized unallocated revenue to class summaries
    unallocatedByCategory.forEach((data, category) => {
      // Skip empty categories
      if (data.totalRevenue <= 0) return;
      
      // Default fee percentages
      const franchiseRate = 0.10; // 10%
      const adminRate = 0.10;     // 10%
      const instructorRate = category === "Unallocated Revenue" ? 0 : 0.60; // 60% for classes, 0% for general
      
      const revenue = data.totalRevenue;
      const franchiseFee = revenue * franchiseRate;
      const adminFee = revenue * adminRate;
      const instructorFee = revenue * instructorRate;
      const profit = revenue - franchiseFee - adminFee - instructorFee;
      
      const unallocatedEntry: ClassFinance = {
        className: category,
        totalRevenue: revenue,
        bookingsCount: 0,
        franchiseFee: franchiseFee,
        adminFee: adminFee,
        instructorFee: instructorFee,
        profit: profit,
        invoiceCount: data.invoiceIds.length,
        sourceType: 'unallocated',
        invoiceIds: data.invoiceIds
      };
      
      // Only add if there's revenue
      if (revenue > 0) {
        classSummaries.set(category, unallocatedEntry);
      }
    });

    // Convert to array and sort by class name
    const sortedFinances = Array.from(classSummaries.values())
      .sort((a, b) => a.className.localeCompare(b.className));
      
    console.log(`Processed ${sortedFinances.length} class financial summaries`);
    console.log(`Total revenue across classes: ${sortedFinances.reduce((sum, curr) => sum + curr.totalRevenue, 0)}`);
    console.log(`Total invoices across classes: ${sortedFinances.reduce((sum, curr) => sum + curr.invoiceCount, 0)}`);
    console.log(`Expected total invoices: ${allInvoicesCount}`);
    console.log(`Unassociated revenue: ${unassociatedTotal}`);
    console.log(`Total revenue from invoices: ${totalRevenue}`);
    
    // Check if we need to add a general revenue entry to account for missing revenue
    const classesTotalRevenue = sortedFinances.reduce((sum, curr) => sum + curr.totalRevenue, 0);
    if (totalRevenue > classesTotalRevenue + 1) { // Adding 1 to account for rounding errors
      const unaccountedRevenue = totalRevenue - classesTotalRevenue;
      console.log(`Found unaccounted revenue: ${unaccountedRevenue}`);
      
      // Add or update the unaccounted revenue entry
      const unaccountedEntry: ClassFinance = {
        className: "Remaining Unallocated Revenue",
        totalRevenue: unaccountedRevenue,
        bookingsCount: 0,
        franchiseFee: unaccountedRevenue * 0.1, // Default franchise fee (10%)
        adminFee: unaccountedRevenue * 0.1,     // Default admin fee (10%)
        instructorFee: 0,                      // No instructor fee for unallocated revenue
        profit: unaccountedRevenue * 0.8,       // Default profit (80%)
        invoiceCount: allInvoicesCount - sortedFinances.reduce((sum, curr) => sum + curr.invoiceCount, 0),
        sourceType: 'unallocated'
      };
      
      // Only add if there's a significant amount of unaccounted revenue
      if (unaccountedRevenue > 1) {
        sortedFinances.push(unaccountedEntry);
      }
    }
    
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
    unassociatedRevenue,
    isLoading, 
    refreshData,
    totalInvoiceCount,
    invalidInvoicesCount,
    totalRevenue: financialData?.totalRevenue || 0,
    unallocatedDetails // Return the unallocated invoice details
  };
}


import { useState, useEffect } from "react";
import { FinancialData, ClassFinance, BookingRevenue } from "./types";

export function useFinancialProcessor(financialData: FinancialData | undefined) {
  const [classFinances, setClassFinances] = useState<ClassFinance[]>([]);
  const [totalInvoiceCount, setTotalInvoiceCount] = useState<number>(0);
  const [invalidInvoicesCount, setInvalidInvoicesCount] = useState<number>(0);

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
      invalidInvoicesCount: invalidCount,
      totalRevenue,
      invoices
    } = financialData;
    
    // Use branch ID from the first booking or invoice for validation
    const branchId = 
      bookingsWithInvoices[0]?.clients?.branch_id || 
      invoices[0]?.client?.branch_id || 
      financialData.branchId;
    
    // Log the branch ID we're processing data for
    console.log(`Financial processor using branch ID: ${branchId || 'unknown'}`);
    
    // Use optional chaining for possibly undefined invoice items
    const invoiceItems = financialData.invoiceItems || [];
    
    // Filter invoiceItems to ensure they belong to the correct branch
    const branchFilteredInvoiceItems = branchId 
      ? invoiceItems.filter(item => !item.invoices?.client?.branch_id || item.invoices?.client?.branch_id === branchId)
      : invoiceItems;
      
    console.log(`Filtered ${invoiceItems.length - branchFilteredInvoiceItems.length} invoice items that don't match branch ${branchId}`);

    setTotalInvoiceCount(allInvoicesCount);
    setInvalidInvoicesCount(invalidCount);

    // Process the class finances with complete revenue tracking
    const classSummaries = new Map<string, ClassFinance>();
    const bookingRevenueMap = new Map<string, BookingRevenue>();
    const classInvoiceMap = new Map<string, Set<string>>();
    // Create a map to track unique booking IDs per class
    const classBookingMap = new Map<string, Set<string>>();

    // First map invoices to bookings using invoice items as a connector
    // Use Set to avoid duplicate booking IDs per invoice (e.g., when invoice has course + enrollment fee items)
    const invoiceToBookingMap = new Map<string, Set<string>>();
    const bookingToInvoiceMap = new Map<string, Set<string>>();
    
    branchFilteredInvoiceItems.forEach(item => {
      if (item.booking_id && item.invoice_id) {
        // Map invoice to booking (using Set to avoid duplicates)
        if (!invoiceToBookingMap.has(item.invoice_id)) {
          invoiceToBookingMap.set(item.invoice_id, new Set());
        }
        invoiceToBookingMap.get(item.invoice_id)!.add(item.booking_id);
        
        // Map booking to invoice
        if (!bookingToInvoiceMap.has(item.booking_id)) {
          bookingToInvoiceMap.set(item.booking_id, new Set());
        }
        bookingToInvoiceMap.get(item.booking_id)!.add(item.invoice_id);
      }
    });

    // Filter bookings to only use those from the correct branch
    const branchFilteredBookings = branchId 
      ? bookingsWithInvoices.filter(booking => !booking.clients?.branch_id || booking.clients?.branch_id === branchId)
      : bookingsWithInvoices;
    
    console.log(`Filtered ${bookingsWithInvoices.length - branchFilteredBookings.length} bookings that don't match branch ${branchId}`);

    // Now work directly with invoices and distribute revenue proportionally
    const processedInvoices = new Set<string>();
    
    // Filter invoices to only use those from the correct branch
    const branchFilteredInvoices = branchId
      ? invoices.filter(invoice => !invoice.client?.branch_id || invoice.client?.branch_id === branchId)
      : invoices;
      
    console.log(`Filtered ${invoices.length - branchFilteredInvoices.length} invoices that don't match branch ${branchId}`);
    
    // First handle invoices that can be mapped to specific classes through bookings
    branchFilteredInvoices.forEach(invoice => {
      const bookingIdsSet = invoiceToBookingMap.get(invoice.id);
      
      // Skip if this invoice has no associated bookings or already processed
      if (!bookingIdsSet || bookingIdsSet.size === 0 || processedInvoices.has(invoice.id)) return;
      
      // Convert Set to array for iteration
      const bookingIds = Array.from(bookingIdsSet);
      
      // Distribute the invoice total evenly among associated unique bookings
      const invoiceAmountPerBooking = invoice.total / bookingIds.length;
      
      bookingIds.forEach(bookingId => {
        const booking = branchFilteredBookings.find(b => b.id === bookingId);
        if (!booking || !booking.class_schedules?.classes) return;
        
        // Additional branch check
        if (branchId && booking.clients?.branch_id && booking.clients.branch_id !== branchId) {
          console.warn(`Skipping booking ${bookingId} due to branch mismatch. Expected ${branchId}, got ${booking.clients.branch_id}`);
          return;
        }
        
        const classData = booking.class_schedules.classes;
        const className = classData.name;
        
        // Skip if class is not from this branch
        if (branchId && classData.branch_id && classData.branch_id !== branchId) {
          console.warn(`Skipping class ${className} (${classData.id}) due to branch mismatch. Expected ${branchId}, got ${classData.branch_id}`);
          return;
        }
        
        // Track this invoice for this class
        if (!classInvoiceMap.has(className)) {
          classInvoiceMap.set(className, new Set());
        }
        classInvoiceMap.get(className)!.add(invoice.id);
        
        // Track unique booking IDs for each class
        if (!classBookingMap.has(className)) {
          classBookingMap.set(className, new Set());
        }
        classBookingMap.get(className)!.add(bookingId);
        
        // Get or create class summary
        const summary = classSummaries.get(className) || {
          className,
          totalRevenue: 0,
          bookingsCount: 0, // This will be set based on unique bookings later
          franchiseFee: 0,
          adminFee: 0,
          instructorFee: 0,
          profit: 0,
          invoiceCount: 0,
          sourceType: 'class',
          invoiceIds: []
        };
        
        // Update summary with invoice amount
        // Do NOT increment bookingsCount here as we'll set it based on unique bookings later
        summary.totalRevenue += invoiceAmountPerBooking;
        
        // Calculate fees based on invoice amount
        if (classData.mckaynine_commission_type === 'percentage') {
          summary.franchiseFee += (invoiceAmountPerBooking * (classData.mckaynine_commission_value / 100));
        } else {
          summary.franchiseFee += classData.mckaynine_commission_value;
        }
        
        if (classData.admin_fee_type === 'percentage') {
          summary.adminFee += (invoiceAmountPerBooking * (classData.admin_fee_value / 100));
        } else {
          summary.adminFee += classData.admin_fee_value;
        }
        
        if (classData.trainer_fee_type === 'percentage') {
          summary.instructorFee += (invoiceAmountPerBooking * (classData.trainer_fee_value / 100));
        } else {
          summary.instructorFee += classData.trainer_fee_value;
        }
        
        classSummaries.set(className, summary);
      });
      
      processedInvoices.add(invoice.id);
    });
    
    // Handle unprocessed invoices (not linked to specific classes)
    const unprocessedInvoices = branchFilteredInvoices
      .filter(inv => !processedInvoices.has(inv.id));
    
    const unprocessedInvoicesTotal = unprocessedInvoices
      .reduce((sum, inv) => sum + inv.total, 0);
    
    if (unprocessedInvoicesTotal > 0) {
      const generalClassName = "General Training Services";
      const unprocessedInvoiceIds = unprocessedInvoices.map(inv => inv.id);
      
      // Create a general entry for unprocessed invoices
      const generalSummary = classSummaries.get(generalClassName) || {
        className: generalClassName,
        totalRevenue: 0,
        bookingsCount: 0,
        franchiseFee: 0,
        adminFee: 0,
        instructorFee: 0,
        profit: 0,
        invoiceCount: unprocessedInvoiceIds.length,
        sourceType: 'general',
        invoiceIds: unprocessedInvoiceIds
      };
      
      // Use average fee percentages from other classes or default values
      let avgAdminPercent = 10;
      let avgTrainerPercent = 30;
      let avgFranchisePercent = 15;
      
      // Calculate averages if we have processed classes
      if (classSummaries.size > 0) {
        let totalAdmin = 0;
        let totalTrainer = 0;
        let totalFranchise = 0;
        let totalRevenue = 0;
        
        classSummaries.forEach(summary => {
          if (summary.totalRevenue > 0) {
            totalAdmin += summary.adminFee;
            totalTrainer += summary.instructorFee;
            totalFranchise += summary.franchiseFee;
            totalRevenue += summary.totalRevenue;
          }
        });
        
        if (totalRevenue > 0) {
          avgAdminPercent = (totalAdmin / totalRevenue) * 100;
          avgTrainerPercent = (totalTrainer / totalRevenue) * 100;
          avgFranchisePercent = (totalFranchise / totalRevenue) * 100;
        }
      }
      
      // Apply average percentages to unprocessed revenue
      generalSummary.totalRevenue = unprocessedInvoicesTotal;
      generalSummary.adminFee = unprocessedInvoicesTotal * (avgAdminPercent / 100);
      generalSummary.instructorFee = unprocessedInvoicesTotal * (avgTrainerPercent / 100);
      generalSummary.franchiseFee = unprocessedInvoicesTotal * (avgFranchisePercent / 100);
      
      // Calculate profit
      generalSummary.profit = generalSummary.totalRevenue - 
                             generalSummary.adminFee - 
                             generalSummary.instructorFee - 
                             generalSummary.franchiseFee;
      
      classSummaries.set(generalClassName, generalSummary);
    }

    // Update invoice counts, set bookingsCount based on unique bookings, and calculate profits for all classes
    Array.from(classInvoiceMap.entries()).forEach(([className, invoiceIds]) => {
      const summary = classSummaries.get(className);
      if (summary) {
        summary.invoiceCount = invoiceIds.size;
        summary.invoiceIds = Array.from(invoiceIds);
        
        // Set bookingsCount based on unique booking IDs
        const uniqueBookings = classBookingMap.get(className);
        if (uniqueBookings) {
          summary.bookingsCount = uniqueBookings.size;
        }
        
        // Calculate profit as total revenue minus all fees
        summary.profit = summary.totalRevenue - summary.franchiseFee - summary.adminFee - summary.instructorFee;
      }
    });

    // Make sure to set bookingCount for unprocessed/general entries too
    classSummaries.forEach(summary => {
      if (summary.sourceType === 'general' && !summary.bookingsCount) {
        // For general entries, set bookingsCount to match invoiceCount as a reasonable estimate
        summary.bookingsCount = summary.invoiceCount;
      }
    });

    // Convert to array and sort by class name
    const sortedFinances = Array.from(classSummaries.values())
      .sort((a, b) => a.className.localeCompare(b.className));

    // Log the total number of unique bookings across all classes for debugging
    const totalUniqueBookings = new Set<string>();
    classBookingMap.forEach((bookings) => {
      bookings.forEach(id => totalUniqueBookings.add(id));
    });
    
    console.log("Financial processor - total unique bookings:", totalUniqueBookings.size);
    console.log("Financial processor - total invoices:", allInvoicesCount);
    console.log("Financial processor - final class finances count:", sortedFinances.length);

    setClassFinances(sortedFinances);
  }, [financialData]);

  return {
    classFinances,
    totalInvoiceCount,
    invalidInvoicesCount
  };
}

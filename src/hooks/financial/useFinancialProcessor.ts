
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

    // Use optional chaining for possibly undefined invoice items
    const invoiceItems = financialData.invoiceItems || [];

    setTotalInvoiceCount(allInvoicesCount);
    setInvalidInvoicesCount(invalidCount);

    // Process the class finances with complete revenue tracking
    const classSummaries = new Map<string, ClassFinance>();
    const bookingRevenueMap = new Map<string, BookingRevenue>();
    const classInvoiceMap = new Map<string, Set<string>>();
    // Create a map to track unique booking IDs per class
    const classBookingMap = new Map<string, Set<string>>();
    // Track already processed booking-invoice pairs to prevent double counting
    const processedBookingInvoices = new Set<string>();

    // First map invoices to bookings using invoice items as a connector
    const invoiceToBookingMap = new Map<string, string[]>();
    const bookingToInvoiceMap = new Map<string, Set<string>>();
    
    invoiceItems.forEach(item => {
      if (item.booking_id && item.invoice_id) {
        // Map invoice to booking
        if (!invoiceToBookingMap.has(item.invoice_id)) {
          invoiceToBookingMap.set(item.invoice_id, []);
        }
        invoiceToBookingMap.get(item.invoice_id)!.push(item.booking_id);
        
        // Map booking to invoice
        if (!bookingToInvoiceMap.has(item.booking_id)) {
          bookingToInvoiceMap.set(item.booking_id, new Set());
        }
        bookingToInvoiceMap.get(item.booking_id)!.add(item.invoice_id);
      }
    });

    // Now work directly with invoices and distribute revenue proportionally
    const processedInvoices = new Set<string>();
    
    // First handle invoices that can be mapped to specific classes through bookings
    invoices.forEach(invoice => {
      const bookingIds = invoiceToBookingMap.get(invoice.id);
      
      // Skip if this invoice has no associated bookings or already processed
      if (!bookingIds || bookingIds.length === 0 || processedInvoices.has(invoice.id)) return;
      
      // Distribute the invoice total evenly among associated bookings
      const invoiceAmountPerBooking = invoice.total / bookingIds.length;
      
      bookingIds.forEach(bookingId => {
        const booking = bookingsWithInvoices.find(b => b.id === bookingId);
        if (!booking || !booking.class_schedules?.classes) return;
        
        const classData = booking.class_schedules.classes;
        const className = classData.name;
        
        // Create a unique key for this booking-invoice pair to prevent double counting
        const bookingInvoiceKey = `${bookingId}-${invoice.id}`;
        if (processedBookingInvoices.has(bookingInvoiceKey)) {
          // Skip if we've already counted this booking-invoice pair
          return;
        }
        
        processedBookingInvoices.add(bookingInvoiceKey);
        
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
        summary.totalRevenue += invoiceAmountPerBooking;
        
        // Apply fee percentages from the class data
        // Admin fee
        if (classData.admin_fee_type === 'percentage') {
          summary.adminFee += invoiceAmountPerBooking * (classData.admin_fee_value / 100);
        } else {
          summary.adminFee += classData.admin_fee_value;
        }

        // Franchise fee
        if (classData.mckaynine_commission_type === 'percentage') {
          summary.franchiseFee += invoiceAmountPerBooking * (classData.mckaynine_commission_value / 100);
        } else {
          summary.franchiseFee += classData.mckaynine_commission_value;
        }
        
        // Instructor fee
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
    const unprocessedInvoicesTotal = invoices
      .filter(inv => !processedInvoices.has(inv.id))
      .reduce((sum, inv) => sum + inv.total, 0);
    
    if (unprocessedInvoicesTotal > 0) {
      const generalClassName = "General Training Services";
      const unprocessedInvoiceIds = invoices
        .filter(inv => !processedInvoices.has(inv.id))
        .map(inv => inv.id);
      
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
      
      // For general entries, use the average fee percentages from the other classes
      generalSummary.totalRevenue = unprocessedInvoicesTotal;
      
      // Calculate average fee percentages from processed classes
      let avgAdminPercent = 10; // Default to 10% if no other data
      let avgFranchisePercent = 15; // Default to 15% if no other data
      let avgTrainerPercent = 30; // Default to 30% if no other data
      
      if (classSummaries.size > 0) {
        let totalAdmin = 0;
        let totalFranchise = 0;
        let totalTrainer = 0;
        let totalRevenue = 0;
        let classCount = 0;
        
        classSummaries.forEach(summary => {
          if (summary.totalRevenue > 0) {
            totalAdmin += summary.adminFee;
            totalFranchise += summary.franchiseFee;
            totalTrainer += summary.instructorFee;
            totalRevenue += summary.totalRevenue;
            classCount++;
          }
        });
        
        if (totalRevenue > 0) {
          avgAdminPercent = (totalAdmin / totalRevenue) * 100;
          avgFranchisePercent = (totalFranchise / totalRevenue) * 100;
          avgTrainerPercent = (totalTrainer / totalRevenue) * 100;
        }
      }
      
      // Apply the average percentages to general invoices
      generalSummary.adminFee = unprocessedInvoicesTotal * (avgAdminPercent / 100);
      generalSummary.franchiseFee = unprocessedInvoicesTotal * (avgFranchisePercent / 100);
      generalSummary.instructorFee = unprocessedInvoicesTotal * (avgTrainerPercent / 100);
      
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

    // Debug the fee calculations for each class
    sortedFinances.forEach(classItem => {
      console.log(`Financial details for ${classItem.className}:`, {
        totalRevenue: classItem.totalRevenue,
        adminFee: classItem.adminFee,
        adminPercent: (classItem.adminFee / classItem.totalRevenue * 100).toFixed(1) + '%',
        franchiseFee: classItem.franchiseFee,
        franchisePercent: (classItem.franchiseFee / classItem.totalRevenue * 100).toFixed(1) + '%',
        instructorFee: classItem.instructorFee,
        instructorPercent: (classItem.instructorFee / classItem.totalRevenue * 100).toFixed(1) + '%',
        profit: classItem.profit,
        profitPercent: (classItem.profit / classItem.totalRevenue * 100).toFixed(1) + '%',
      });
    });

    setClassFinances(sortedFinances);
  }, [financialData]);

  return {
    classFinances,
    totalInvoiceCount,
    invalidInvoicesCount
  };
}

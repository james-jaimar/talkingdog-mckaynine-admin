
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
      
      // Calculate the invoice amount per booking
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
        
        // Apply fee percentages from the class data with explicit type checking
        // Admin fee calculation
        if (classData.admin_fee_type === 'percentage') {
          const adminFeeAmount = invoiceAmountPerBooking * (classData.admin_fee_value / 100);
          summary.adminFee += adminFeeAmount;
          console.log(`Class ${className}: Admin fee calculation: ${invoiceAmountPerBooking} * ${classData.admin_fee_value}% = ${adminFeeAmount}`);
        } else {
          // For fixed fee, we add a proportional amount based on the number of bookings
          // This ensures fixed fees are distributed fairly across all bookings
          const adminFixedFeePerBooking = classData.admin_fee_value / Math.max(classBookingMap.get(className)?.size || 1, 1);
          summary.adminFee += adminFixedFeePerBooking;
          console.log(`Class ${className}: Admin fixed fee per booking: ${classData.admin_fee_value} / ${classBookingMap.get(className)?.size} = ${adminFixedFeePerBooking}`);
        }

        // Franchise fee calculation
        if (classData.mckaynine_commission_type === 'percentage') {
          const franchiseFeeAmount = invoiceAmountPerBooking * (classData.mckaynine_commission_value / 100);
          summary.franchiseFee += franchiseFeeAmount;
          console.log(`Class ${className}: Franchise fee calculation: ${invoiceAmountPerBooking} * ${classData.mckaynine_commission_value}% = ${franchiseFeeAmount}`);
        } else {
          // For fixed fee, distribute it proportionally
          const franchiseFixedFeePerBooking = classData.mckaynine_commission_value / Math.max(classBookingMap.get(className)?.size || 1, 1);
          summary.franchiseFee += franchiseFixedFeePerBooking;
          console.log(`Class ${className}: Franchise fixed fee per booking: ${classData.mckaynine_commission_value} / ${classBookingMap.get(className)?.size} = ${franchiseFixedFeePerBooking}`);
        }
        
        // Instructor fee calculation
        if (classData.trainer_fee_type === 'percentage') {
          const instructorFeeAmount = invoiceAmountPerBooking * (classData.trainer_fee_value / 100);
          summary.instructorFee += instructorFeeAmount;
          console.log(`Class ${className}: Instructor fee calculation: ${invoiceAmountPerBooking} * ${classData.trainer_fee_value}% = ${instructorFeeAmount}`);
        } else {
          // For fixed fee, distribute it proportionally
          const instructorFixedFeePerBooking = classData.trainer_fee_value / Math.max(classBookingMap.get(className)?.size || 1, 1);
          summary.instructorFee += instructorFixedFeePerBooking;
          console.log(`Class ${className}: Instructor fixed fee per booking: ${classData.trainer_fee_value} / ${classBookingMap.get(className)?.size} = ${instructorFixedFeePerBooking}`);
        }
        
        classSummaries.set(className, summary);
      });
      
      processedInvoices.add(invoice.id);
    });
    
    // Handle unprocessed invoices (not linked to specific classes)
    const unprocessedInvoices = invoices.filter(inv => !processedInvoices.has(inv.id));
    const unprocessedInvoicesTotal = unprocessedInvoices.reduce((sum, inv) => sum + inv.total, 0);
    
    console.log(`Unprocessed invoices: ${unprocessedInvoices.length}, Total: ${unprocessedInvoicesTotal}`);
    
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
      
      // For general entries, use standard default rates
      generalSummary.totalRevenue = unprocessedInvoicesTotal;
      
      // Standard rates for general invoices
      const defaultAdminPercent = 10; // 10%
      const defaultFranchisePercent = 15; // 15%
      const defaultTrainerPercent = 30; // 30%
      
      // Apply standard rates directly for general invoices
      generalSummary.adminFee = unprocessedInvoicesTotal * (defaultAdminPercent / 100);
      generalSummary.franchiseFee = unprocessedInvoicesTotal * (defaultFranchisePercent / 100);
      generalSummary.instructorFee = unprocessedInvoicesTotal * (defaultTrainerPercent / 100);
      
      console.log(`General Training Services calculations:`);
      console.log(`- Admin fee: ${unprocessedInvoicesTotal} * ${defaultAdminPercent}% = ${generalSummary.adminFee}`);
      console.log(`- Franchise fee: ${unprocessedInvoicesTotal} * ${defaultFranchisePercent}% = ${generalSummary.franchiseFee}`);
      console.log(`- Instructor fee: ${unprocessedInvoicesTotal} * ${defaultTrainerPercent}% = ${generalSummary.instructorFee}`);
      
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
        
        // Calculate profit as total revenue minus all fees, ensuring there are no rounding errors
        summary.profit = parseFloat((summary.totalRevenue - summary.franchiseFee - summary.adminFee - summary.instructorFee).toFixed(2));
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
      .sort((a, b) => a.className.localeCompare(b.className))
      // Apply rounding for all monetary values to avoid floating point issues
      .map(summary => ({
        ...summary,
        totalRevenue: parseFloat(summary.totalRevenue.toFixed(2)),
        adminFee: parseFloat(summary.adminFee.toFixed(2)),
        franchiseFee: parseFloat(summary.franchiseFee.toFixed(2)),
        instructorFee: parseFloat(summary.instructorFee.toFixed(2)),
        profit: parseFloat(summary.profit.toFixed(2))
      }));

    // Log the total number of unique bookings across all classes for debugging
    const totalUniqueBookings = new Set<string>();
    classBookingMap.forEach((bookings) => {
      bookings.forEach(id => totalUniqueBookings.add(id));
    });
    
    console.log("Financial processor - total unique bookings:", totalUniqueBookings.size);
    console.log("Financial processor - total invoices:", allInvoicesCount);

    // Debug the fee calculations for each class
    sortedFinances.forEach(classItem => {
      // Calculate percentages correctly based on the totalRevenue
      const adminPercent = classItem.adminFee / classItem.totalRevenue * 100;
      const franchisePercent = classItem.franchiseFee / classItem.totalRevenue * 100;
      const instructorPercent = classItem.instructorFee / classItem.totalRevenue * 100;
      const profitPercent = classItem.profit / classItem.totalRevenue * 100;
      
      // Verify that percentages add up to 100% (with small margin for rounding)
      const totalPercent = adminPercent + franchisePercent + instructorPercent + profitPercent;
      const percentDiff = Math.abs(100 - totalPercent);
      
      if (percentDiff > 0.1) {
        console.warn(`Financial calculation warning for ${classItem.className}: Total percent = ${totalPercent.toFixed(2)}%, Difference = ${percentDiff.toFixed(2)}%`);
      }
      
      console.log(`Financial details for ${classItem.className}:`, {
        totalRevenue: classItem.totalRevenue,
        adminFee: classItem.adminFee,
        adminPercent: adminPercent.toFixed(1) + '%',
        franchiseFee: classItem.franchiseFee,
        franchisePercent: franchisePercent.toFixed(1) + '%',
        instructorFee: classItem.instructorFee,
        instructorPercent: instructorPercent.toFixed(1) + '%',
        profit: classItem.profit,
        profitPercent: profitPercent.toFixed(1) + '%',
        totalPercent: totalPercent.toFixed(1) + '%'
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

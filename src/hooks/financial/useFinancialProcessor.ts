
import { useMemo } from "react";
import { ClassFinance, FinancialData } from "./types";

/**
 * Hook to process raw financial data into structured class financial information
 */
export function useFinancialProcessor(data: FinancialData | null) {
  // Process the financial data into class-based financial metrics
  const classFinances: ClassFinance[] = useMemo(() => {
    if (!data) return [];
    
    // Track processed classes to prevent duplicates
    const processedClasses = new Map<string, ClassFinance>();
    let totalInvoiceItems = 0;
    
    // Process each booking with its invoice
    data.bookingsWithInvoices.forEach(booking => {
      const classSchedule = booking.class_schedules;
      if (!classSchedule || !classSchedule.classes) return;
      
      const classInfo = classSchedule.classes;
      const className = classInfo.name;
      const classId = classInfo.id;
      
      // Find invoice items for this booking
      const invoiceItems = data.invoiceItems.filter(item => item.booking_id === booking.id);
      if (invoiceItems.length === 0) return;
      
      totalInvoiceItems += invoiceItems.length;
      
      // Calculate total revenue from invoice items
      const totalRevenue = invoiceItems.reduce((sum, item) => {
        if (!item.invoices) return sum;
        // Only count if invoice exists and is in a valid state
        if (['sent', 'paid', 'overdue'].includes(item.invoices.status)) {
          return sum + item.amount;
        }
        return sum;
      }, 0);
      
      // Skip if no revenue
      if (totalRevenue <= 0) return;
      
      // Calculate fees based on class configuration
      let adminFee = 0;
      let instructorFee = 0;
      let franchiseFee = 0;
      
      // Admin fee calculation
      if (classInfo.admin_fee_type === 'percentage') {
        adminFee = totalRevenue * (classInfo.admin_fee_value / 100);
      } else {
        adminFee = classInfo.admin_fee_value;
      }
      
      // Trainer fee calculation
      if (classInfo.trainer_fee_type === 'percentage') {
        instructorFee = totalRevenue * (classInfo.trainer_fee_value / 100);
      } else {
        instructorFee = classInfo.trainer_fee_value;
      }
      
      // Franchise fee calculation
      if (classInfo.mckaynine_commission_type === 'percentage') {
        franchiseFee = totalRevenue * (classInfo.mckaynine_commission_value / 100);
      } else {
        franchiseFee = classInfo.mckaynine_commission_value;
      }
      
      // Update existing class entry or create new one
      if (processedClasses.has(classId)) {
        const existingClass = processedClasses.get(classId)!;
        existingClass.revenue += totalRevenue;
        existingClass.adminFee += adminFee;
        existingClass.instructorFee += instructorFee;
        existingClass.franchiseFee += franchiseFee;
        existingClass.profit = existingClass.revenue - existingClass.adminFee - 
                               existingClass.instructorFee - existingClass.franchiseFee;
        existingClass.bookingCount += 1;
      } else {
        const profit = totalRevenue - adminFee - instructorFee - franchiseFee;
        processedClasses.set(classId, {
          id: classId,
          name: className,
          revenue: totalRevenue,
          adminFee,
          instructorFee,
          franchiseFee,
          profit,
          bookingCount: 1
        });
      }
    });
    
    console.log(`Processed ${processedClasses.size} classes with ${totalInvoiceItems} invoice items`);
    
    return Array.from(processedClasses.values());
  }, [data]);
  
  // Calculate aggregate values
  const totalInvoiceCount = data?.allInvoicesCount || 0;
  const invalidInvoicesCount = data?.invalidInvoicesCount || 0;
  
  return {
    classFinances,
    totalInvoiceCount,
    invalidInvoicesCount
  };
}

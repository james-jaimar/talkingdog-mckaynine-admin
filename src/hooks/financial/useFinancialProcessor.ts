
import { FinancialData, ClassFinance } from './types';

export function useFinancialProcessor(financialData?: FinancialData) {
  if (!financialData) {
    return {
      classFinances: [],
      totalInvoiceCount: 0,
      invalidInvoicesCount: 0
    };
  }

  const { bookingsWithInvoices, allInvoicesCount, invalidInvoicesCount, invoiceItems } = financialData;

  // Group bookings by class
  const classGroups: Record<string, any[]> = {};
  
  // Process all bookings with their class data
  bookingsWithInvoices.forEach(booking => {
    const classData = booking.class_schedules?.classes;
    if (classData) {
      const className = classData.name;
      if (!classGroups[className]) {
        classGroups[className] = [];
      }
      classGroups[className].push({...booking, classData});
    }
  });

  // Process invoice items that don't have associated bookings
  const classNameToItemsMap: Record<string, any[]> = {};
  const processedInvoiceItems = invoiceItems.filter(item => item.booking_id && item.amount > 0);
  
  // Collect general invoice items (not tied to bookings)
  const generalInvoiceItems = invoiceItems.filter(item => !item.booking_id && item.amount > 0);
  if (generalInvoiceItems.length > 0) {
    classNameToItemsMap['General Training Services'] = generalInvoiceItems;
  }

  // Calculate finances for each class
  const classFinances: ClassFinance[] = Object.keys(classGroups).map(className => {
    const bookings = classGroups[className];
    const firstBooking = bookings[0];
    const classData = firstBooking.class_schedules?.classes;

    // Get commission rates and types
    const mckaynineCommissionValue = classData.mckaynine_commission_value || 0;
    const mckaynineCommissionType = classData.mckaynine_commission_type;
    const adminFeeValue = classData.admin_fee_value || 0;
    const adminFeeType = classData.admin_fee_type;
    const trainerFeeValue = classData.trainer_fee_value || 0;
    const trainerFeeType = classData.trainer_fee_type;

    // Calculate total revenue for this class
    const totalRevenue = bookings.reduce((sum, booking) => {
      const relatedInvoiceItems = processedInvoiceItems.filter(
        item => item.booking_id === booking.id
      );
      return sum + relatedInvoiceItems.reduce((s, item) => s + (item.amount || 0), 0);
    }, 0);

    // Calculate fees based on their types (percentage or fixed)
    const calculateFee = (value: number, type: string, baseAmount: number) => {
      if (type === 'percentage') {
        return (value / 100) * baseAmount;
      }
      return value * bookings.length; // Fixed fee per booking
    };

    const franchiseFee = calculateFee(mckaynineCommissionValue, mckaynineCommissionType, totalRevenue);
    const adminFee = calculateFee(adminFeeValue, adminFeeType, totalRevenue);
    const instructorFee = calculateFee(trainerFeeValue, trainerFeeType, totalRevenue);
    
    // Calculate profit
    const profit = totalRevenue - franchiseFee - adminFee - instructorFee;

    // Count unique invoices
    const invoiceIds = new Set<string>();
    bookings.forEach(booking => {
      const relatedInvoiceItems = processedInvoiceItems.filter(
        item => item.booking_id === booking.id
      );
      relatedInvoiceItems.forEach(item => {
        if (item.invoice_id) invoiceIds.add(item.invoice_id);
      });
    });

    return {
      className,
      totalRevenue,
      bookingsCount: bookings.length,
      franchiseFee,
      adminFee,
      instructorFee,
      profit,
      invoiceCount: invoiceIds.size,
      sourceType: 'class'
    };
  });

  // Add general revenue (not tied to specific classes)
  if (generalInvoiceItems.length > 0) {
    const totalGeneralRevenue = generalInvoiceItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    
    // Use default fees for general revenue
    const franchiseFee = totalGeneralRevenue * 0.15; // Default 15% franchise fee
    const adminFee = totalGeneralRevenue * 0.10; // Default 10% admin fee
    const instructorFee = totalGeneralRevenue * 0.40; // Default 40% instructor fee
    const profit = totalGeneralRevenue - franchiseFee - adminFee - instructorFee;

    // Count unique invoices for general items
    const invoiceIds = new Set<string>();
    generalInvoiceItems.forEach(item => {
      if (item.invoice_id) invoiceIds.add(item.invoice_id);
    });

    classFinances.push({
      className: 'General Training Services',
      totalRevenue: totalGeneralRevenue,
      bookingsCount: 0,
      franchiseFee,
      adminFee,
      instructorFee,
      profit,
      invoiceCount: invoiceIds.size,
      sourceType: 'general'
    });
  }

  // Sort classes by revenue (highest first)
  classFinances.sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    classFinances,
    totalInvoiceCount: allInvoicesCount,
    invalidInvoicesCount
  };
}

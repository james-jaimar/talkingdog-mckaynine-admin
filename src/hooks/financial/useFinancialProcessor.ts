
import { useState, useEffect } from "react";
import { FinancialData, ClassFinance, InvoiceDiscount, BookingRevenue } from "./types";

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
      totalRevenue
    } = financialData;

    // Use optional chaining for possibly undefined invoiceItems
    const invoiceItems = financialData.invoiceItems || [];

    setTotalInvoiceCount(allInvoicesCount);
    setInvalidInvoicesCount(invalidCount);

    // Process the class finances with complete revenue tracking
    const classSummaries = new Map<string, ClassFinance>();
    const bookingRevenueMap = new Map<string, BookingRevenue>();
    const classInvoiceMap = new Map<string, Set<string>>();
    const invoiceDiscountMap = new Map<string, InvoiceDiscount>();

    // First, collect all invoice data - use total (already accounts for discounts)
    invoiceItems.forEach(item => {
      if (!item.invoices) return;

      const invoiceId = item.invoice_id;
      invoiceDiscountMap.set(invoiceId, {
        discountAmount: 0, // Not needed since we're using total directly
        subtotal: item.invoices.subtotal || 0,
        total: item.invoices.total || 0
      });
    });

    // Process all items using the final invoice total (after discount)
    invoiceItems.forEach(item => {
      if (!item.booking_id || !item.invoices) return;

      const invoiceId = item.invoice_id;
      const invoiceData = invoiceDiscountMap.get(invoiceId);
      
      // Use the final amount from the item (after any discounts applied)
      const actualItemRevenue = item.amount || 0;

      if (!bookingRevenueMap.has(item.booking_id)) {
        bookingRevenueMap.set(item.booking_id, {
          totalRevenue: 0,
          invoiceIds: new Set()
        });
      }

      const bookingRevenue = bookingRevenueMap.get(item.booking_id)!;
      bookingRevenue.totalRevenue += actualItemRevenue;
      bookingRevenue.invoiceIds.add(item.invoice_id);
    });

    // Process bookings with their complete revenue information
    bookingsWithInvoices.forEach(booking => {
      const bookingRevenue = bookingRevenueMap.get(booking.id) || {
        totalRevenue: 0,
        invoiceIds: new Set()
      };

      const classData = booking.class_schedules?.classes;
      if (!classData) return;

      const className = classData.name;
      const totalRevenue = bookingRevenue.totalRevenue;

      if (className && bookingRevenue.invoiceIds.size > 0) {
        if (!classInvoiceMap.has(className)) {
          classInvoiceMap.set(className, new Set());
        }
        bookingRevenue.invoiceIds.forEach(id =>
          classInvoiceMap.get(className)!.add(id)
        );
      }

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

      // Update summary with net revenue information
      summary.bookingsCount++;
      summary.totalRevenue += totalRevenue;

      // Calculate fees based on actual revenue (net after discount)
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

    // Update invoice counts and calculate profits
    Array.from(classInvoiceMap.entries()).forEach(([className, invoiceIds]) => {
      const summary = classSummaries.get(className);
      if (summary) {
        summary.invoiceCount = invoiceIds.size;
        summary.invoiceIds = Array.from(invoiceIds);
        // Calculate profit as net revenue minus all fees
        summary.profit = summary.totalRevenue - summary.franchiseFee - summary.adminFee - summary.instructorFee;
      }
    });

    // Convert to array and sort by class name
    const sortedFinances = Array.from(classSummaries.values())
      .sort((a, b) => a.className.localeCompare(b.className));

    setClassFinances(sortedFinances);
  }, [financialData]);

  return {
    classFinances,
    totalInvoiceCount,
    invalidInvoicesCount
  };
}

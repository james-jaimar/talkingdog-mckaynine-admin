
import { useState, useEffect } from "react";
import { FinancialData, ClassFinance, InvoiceDiscount, BookingRevenue } from "./types";

/**
 * Processes financial data into structured finances for classes
 * Optimized to reduce processing overhead and console logging
 */
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
      invoiceItems = [],
      totalRevenue,
      totalDiscounts
    } = financialData;

    setTotalInvoiceCount(allInvoicesCount);
    setInvalidInvoicesCount(invalidCount);

    // Skip processing if no data available
    if (!bookingsWithInvoices?.length && !invoiceItems?.length) {
      setClassFinances([]);
      return;
    }

    // Process the class finances with optimized tracking
    const classSummaries = new Map<string, ClassFinance>();
    const bookingRevenueMap = new Map<string, BookingRevenue>();
    const classInvoiceMap = new Map<string, Set<string>>();
    const invoiceDiscountMap = new Map<string, InvoiceDiscount>();

    // Collect invoice discounts - key processing step
    invoiceItems.forEach(item => {
      if (!item.invoices) return;

      const invoiceId = item.invoice_id;
      const monetaryDiscount = item.invoices.monetary_discount || 0;

      invoiceDiscountMap.set(invoiceId, {
        discountAmount: monetaryDiscount,
        subtotal: item.invoices.subtotal || 0,
        total: item.invoices.total || 0
      });
    });

    // Process invoice items and apply discount proportionally
    invoiceItems.forEach(item => {
      if (!item.booking_id || !item.invoices) return;

      const invoiceId = item.invoice_id;
      const invoiceData = invoiceDiscountMap.get(invoiceId);
      const invoiceSubtotal = invoiceData?.subtotal || 0;
      const invoiceDiscountAmount = invoiceData?.discountAmount || 0;

      const itemAmount = item.amount || 0;
      let itemDiscount = 0;

      // Apply proportional discount to each item
      if (invoiceSubtotal > 0 && invoiceDiscountAmount > 0) {
        const proportion = itemAmount / invoiceSubtotal;
        itemDiscount = proportion * invoiceDiscountAmount;
      }

      const actualItemRevenue = Math.max(0, itemAmount - itemDiscount);

      // Track booking revenue
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

    // Process bookings with complete revenue information
    bookingsWithInvoices.forEach(booking => {
      const bookingRevenue = bookingRevenueMap.get(booking.id) || {
        totalRevenue: 0,
        invoiceIds: new Set()
      };

      const classData = booking.class_schedules?.classes;
      if (!classData) return;

      const className = classData.name;
      const totalRevenue = bookingRevenue.totalRevenue;

      // Track invoices per class
      if (className && bookingRevenue.invoiceIds.size > 0) {
        if (!classInvoiceMap.has(className)) {
          classInvoiceMap.set(className, new Set());
        }
        bookingRevenue.invoiceIds.forEach(id =>
          classInvoiceMap.get(className)!.add(id)
        );
      }

      // Create or update class summary
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

      // Update summary with booking revenue
      summary.bookingsCount++;
      summary.totalRevenue += totalRevenue;

      // Calculate fees based on actual revenue
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

    // Calculate final stats and profit
    Array.from(classInvoiceMap.entries()).forEach(([className, invoiceIds]) => {
      const summary = classSummaries.get(className);
      if (summary) {
        summary.invoiceCount = invoiceIds.size;
        summary.invoiceIds = Array.from(invoiceIds);
        // Calculate profit as the difference between revenue and all fees
        summary.profit = summary.totalRevenue - summary.franchiseFee - summary.adminFee - summary.instructorFee;
      }
    });

    // Sort finances by class name
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

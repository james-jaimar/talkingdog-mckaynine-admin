import { useState, useEffect, useMemo } from "react";
import { FinancialData, ClassFinance } from "./types";
import { roundToCents } from "@/lib/invoiceMath";
import { buildCanonicalCommissionLines } from "@/lib/financial/canonicalCommission";

/**
 * Simplified financial processor
 * 
 * Strategy:
 * 1. Apply invoice-level discounts to get net amounts per item
 * 2. Group invoice items by class via booking -> class_schedule -> class
 * 3. For items without booking_id, put in "Unallocated" bucket
 * 4. Calculate fees based on course fee only (exclude enrollment fees)
 * 
 * IMPORTANT: Uses net_amount (after invoice discounts) for all revenue calculations
 */
export function useFinancialProcessor(financialData: FinancialData | undefined) {
  const [classFinances, setClassFinances] = useState<ClassFinance[]>([]);
  const [totalInvoiceCount, setTotalInvoiceCount] = useState<number>(0);
  const [invalidInvoicesCount, setInvalidInvoicesCount] = useState<number>(0);

  // Memoize processing to avoid unnecessary recalculations
  const processedData = useMemo(() => {
    if (!financialData) {
      return { classFinances: [], totalInvoiceCount: 0, invalidInvoicesCount: 0 };
    }

    const {
      bookingsWithInvoices,
      allInvoicesCount,
      invalidInvoicesCount: invalidCount,
      invoiceItems,
      branchId
    } = financialData;

    console.log(`[FinancialProcessor] Processing data for branch ${branchId}`);
    console.log(`[FinancialProcessor] Input: ${invoiceItems?.length || 0} invoice items, ${bookingsWithInvoices?.length || 0} bookings`);

    const commissionLines = buildCanonicalCommissionLines(invoiceItems || [], bookingsWithInvoices || [], [], branchId);

    // Track class finances
    const classSummaries = new Map<string, ClassFinance>();
    const classBookingIds = new Map<string, Set<string>>();
    const classInvoiceIds = new Map<string, Set<string>>();

    // Track unallocated items (no booking_id or booking not found)
    let unallocatedCourseFee = 0;
    let unallocatedInvoiceIds = new Set<string>();
    let unallocatedItemCount = 0;

    // Process each canonical financial line
    commissionLines.forEach(line => {
      if (line.isEnrollmentFee || line.invoiceStatus === 'cancelled') {
        return;
      }

      const amount = line.netAmount || 0;

      if (!line.isAllocated) {
        unallocatedCourseFee += amount;
        if (line.invoiceId) {
          unallocatedInvoiceIds.add(line.invoiceId);
        }
        unallocatedItemCount++;
        return;
      }
      const className = line.className;

      // Get or create class summary
      let summary = classSummaries.get(className);
      if (!summary) {
        summary = {
          className,
          totalRevenue: 0,
          bookingsCount: 0,
          franchiseFee: 0,
          adminFee: 0,
          instructorFee: 0,
          profit: 0,
          invoiceCount: 0,
          sourceType: 'class',
          invoiceIds: [],
          branch_id: line.branchId
        };
        classSummaries.set(className, summary);
        classBookingIds.set(className, new Set());
        classInvoiceIds.set(className, new Set());
      }

      // Add revenue (course fee only)
      summary.totalRevenue += amount;

      // Track unique bookings and invoices
      const bookingSet = classBookingIds.get(className);
      if (bookingSet && line.bookingId) {
        bookingSet.add(line.bookingId);
      }
      const invoiceSet = classInvoiceIds.get(className);
      if (invoiceSet && line.invoiceId) {
        invoiceSet.add(line.invoiceId);
      }

      summary.franchiseFee += line.franchiseFee;
      summary.adminFee += line.adminFee;
      summary.instructorFee += line.trainerCommission;

      // Accumulate profit per-item so totals always reconcile (no ±1c drift
      // from summing rounded fees then subtracting from raw revenue).
      summary.profit += line.profit;
    });

    // Finalize class summaries
    classSummaries.forEach((summary, className) => {
      const bookings = classBookingIds.get(className);
      const invoices = classInvoiceIds.get(className);
      
      summary.bookingsCount = bookings?.size || 0;
      summary.invoiceCount = invoices?.size || 0;
      summary.invoiceIds = invoices ? Array.from(invoices) : [];
      // profit is already accumulated per-item above
    });

    // Add unallocated bucket if there's any
    if (unallocatedCourseFee > 0) {
      console.log(`[FinancialProcessor] Unallocated course fees: R${unallocatedCourseFee.toFixed(2)} from ${unallocatedItemCount} items`);
      
      const unallocatedSummary: ClassFinance = {
        className: "Unallocated (no booking link)",
        totalRevenue: unallocatedCourseFee,
        bookingsCount: 0,
        franchiseFee: 0,
        adminFee: 0,
        instructorFee: 0,
        profit: roundToCents(unallocatedCourseFee),
        invoiceCount: unallocatedInvoiceIds.size,
        sourceType: 'general',
        invoiceIds: Array.from(unallocatedInvoiceIds),
        branch_id: branchId
      };

      classSummaries.set("Unallocated (no booking link)", unallocatedSummary);
    }

    // Sort by class name
    const sortedFinances = Array.from(classSummaries.values())
      .sort((a, b) => a.className.localeCompare(b.className));

    // Log summary
    const totalAllocatedRevenue = sortedFinances.reduce((sum, cf) => sum + cf.totalRevenue, 0);
    console.log(`[FinancialProcessor] Summary:
      - Classes processed: ${sortedFinances.length}
      - Total allocated revenue: R${totalAllocatedRevenue.toFixed(2)}
      - Course fee from query: R${financialData.courseFeeRevenue?.toFixed(2) || 0}
      - Difference: R${Math.abs(totalAllocatedRevenue - (financialData.courseFeeRevenue || 0)).toFixed(2)}`);

    return {
      classFinances: sortedFinances,
      totalInvoiceCount: allInvoicesCount,
      invalidInvoicesCount: invalidCount
    };
  }, [financialData]);

  // Update state when processed data changes
  useEffect(() => {
    setClassFinances(processedData.classFinances);
    setTotalInvoiceCount(processedData.totalInvoiceCount);
    setInvalidInvoicesCount(processedData.invalidInvoicesCount);
  }, [processedData]);

  return {
    classFinances,
    totalInvoiceCount,
    invalidInvoicesCount
  };
}

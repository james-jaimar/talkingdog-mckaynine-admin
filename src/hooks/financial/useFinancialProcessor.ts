import { useState, useEffect, useMemo } from "react";
import { FinancialData, ClassFinance } from "./types";
import { isEnrollmentFeeItem, applyInvoiceDiscountToItems, DiscountedInvoiceItem } from "@/lib/invoiceItemUtils";
import { roundToCents } from "@/lib/invoiceMath";

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

    // STEP 1: Apply invoice-level discounts to get net amounts
    const discountedItems = applyInvoiceDiscountToItems(invoiceItems || []);

    // Create a map for quick lookup of net_amount by item id
    const netAmountMap = new Map<string, number>();
    discountedItems.forEach(item => {
      if (item.id) {
        netAmountMap.set(item.id, item.net_amount);
      }
    });

    // Create a map of booking ID -> booking details for quick lookup
    const bookingMap = new Map<string, any>();
    (bookingsWithInvoices || []).forEach(booking => {
      bookingMap.set(booking.id, booking);
    });

    // STEP 1b: Compute an "instructor share" per item that mirrors the
    // Trainer Payment Summary's multi-dog redistribution. This ONLY drives the
    // instructor fee; revenue, franchise and admin fees still use the item's
    // actual net_amount so per-class billing figures don't shift.
    //
    // Gates (same as redistributeMultiTrainerItems):
    //   1. Invoice has multiple distinct trainers across course-fee items.
    //   2. Invoice.discount_reason contains "multi-dog".
    //   3. All course-fee bookings belong to the same handler.
    const instructorNetMap = new Map<string, number>();
    const itemsByInvoice = new Map<string, typeof discountedItems>();
    discountedItems.forEach(item => {
      if (!item.invoice_id) return;
      const group = itemsByInvoice.get(item.invoice_id) || [];
      group.push(item);
      itemsByInvoice.set(item.invoice_id, group);
    });

    const resolveTrainerId = (item: any): string | null => {
      if (!item?.booking_id) return null;
      const b = bookingMap.get(item.booking_id);
      return b?.class_schedules?.trainer_id ?? null;
    };

    itemsByInvoice.forEach((items, invoiceId) => {
      const courseFeeItems = items.filter(i => (i as any).item_type !== 'enrollment_fee');

      // Default: instructor share equals net amount
      courseFeeItems.forEach(i => instructorNetMap.set(i.id, i.net_amount || 0));

      const trainerToItems = new Map<string, typeof courseFeeItems>();
      courseFeeItems.forEach(i => {
        const tid = resolveTrainerId(i);
        if (!tid) return;
        const arr = trainerToItems.get(tid) || [];
        arr.push(i);
        trainerToItems.set(tid, arr);
      });

      if (trainerToItems.size <= 1) return;

      const invoice = (items[0] as any)?.invoices;
      const reason = invoice?.discount_reason ?? "";
      if (!/multi-?dog/i.test(reason)) return;

      const handlerIds = new Set<string>();
      courseFeeItems.forEach(i => {
        const b = i.booking_id ? bookingMap.get(i.booking_id) : null;
        if (b?.client_id) handlerIds.add(b.client_id);
      });
      if (handlerIds.size !== 1) return;

      const totalNet = courseFeeItems.reduce((s, i) => s + (i.net_amount || 0), 0);
      const sharePerTrainer = totalNet / trainerToItems.size;

      console.log(
        `[FinancialProcessor] Invoice ${invoiceId}: instructor-fee redistribution ` +
        `applied across ${trainerToItems.size} trainers (share R${sharePerTrainer.toFixed(2)})`
      );

      trainerToItems.forEach(trainerItems => {
        const trainerTotal = trainerItems.reduce((s, i) => s + (i.net_amount || 0), 0);
        if (trainerTotal === 0) return;
        const scale = sharePerTrainer / trainerTotal;
        trainerItems.forEach(i => {
          instructorNetMap.set(i.id, roundToCents((i.net_amount || 0) * scale));
        });
      });
    });


    // Track class finances
    const classSummaries = new Map<string, ClassFinance>();
    const classBookingIds = new Map<string, Set<string>>();
    const classInvoiceIds = new Map<string, Set<string>>();

    // Track unallocated items (no booking_id or booking not found)
    let unallocatedCourseFee = 0;
    let unallocatedInvoiceIds = new Set<string>();
    let unallocatedItemCount = 0;

    // Process each invoice item using the discounted items list
    discountedItems.forEach(item => {
      // Skip enrollment fees from class allocation (they go to franchise owner)
      if (isEnrollmentFeeItem(item)) {
        return;
      }

      // Use net_amount (after invoice discount) for revenue
      const amount = item.net_amount || 0;

      // If no booking_id, this is unallocated
      if (!item.booking_id) {
        unallocatedCourseFee += amount;
        if (item.invoice_id) {
          unallocatedInvoiceIds.add(item.invoice_id);
        }
        unallocatedItemCount++;
        return;
      }

      // Find the booking
      const booking = bookingMap.get(item.booking_id);
      if (!booking) {
        // Booking not found - treat as unallocated
        console.warn(`[FinancialProcessor] Booking ${item.booking_id} not found for item ${item.id}`);
        unallocatedCourseFee += amount;
        if (item.invoice_id) {
          unallocatedInvoiceIds.add(item.invoice_id);
        }
        unallocatedItemCount++;
        return;
      }

      // Get class info from booking
      const classData = booking.class_schedules?.classes;
      if (!classData) {
        console.warn(`[FinancialProcessor] No class data for booking ${item.booking_id}`);
        unallocatedCourseFee += amount;
        if (item.invoice_id) {
          unallocatedInvoiceIds.add(item.invoice_id);
        }
        unallocatedItemCount++;
        return;
      }

      // CRITICAL: Skip bookings where the class belongs to a different branch
      // This prevents cross-pollination of financial data between branches
      if (branchId && classData.branch_id && classData.branch_id !== branchId) {
        console.warn(`[FinancialProcessor] Skipping booking ${item.booking_id} - class branch ${classData.branch_id} != current branch ${branchId}`);
        return;
      }

      const className = classData.name;

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
          branch_id: classData.branch_id
        };
        classSummaries.set(className, summary);
        classBookingIds.set(className, new Set());
        classInvoiceIds.set(className, new Set());
      }

      // Add revenue (course fee only)
      summary.totalRevenue += amount;

      // Track unique bookings and invoices
      classBookingIds.get(className)!.add(item.booking_id);
      if (item.invoice_id) {
        classInvoiceIds.get(className)!.add(item.invoice_id);
      }

      // Calculate fees based on class configuration
      const isFixedAmount = (t: unknown): boolean => {
        const type = String(t ?? "percentage").toLowerCase().trim();
        return type === 'amount' || type === 'fixed';
      };

      const commissionValue = Number(classData.mckaynine_commission_value ?? 0);
      const adminValue = Number(classData.admin_fee_value ?? 0);
      const trainerValue = Number(classData.trainer_fee_value ?? 0);

      // Franchise/Commission fee (round per-item)
      const itemFranchise = isFixedAmount(classData.mckaynine_commission_type)
        ? roundToCents(commissionValue)
        : roundToCents(amount * (commissionValue / 100));
      summary.franchiseFee += itemFranchise;

      // Admin fee (round per-item)
      const itemAdmin = isFixedAmount(classData.admin_fee_type)
        ? roundToCents(adminValue)
        : roundToCents(amount * (adminValue / 100));
      summary.adminFee += itemAdmin;

      // Trainer/Instructor fee — use the redistributed instructor share so this
      // matches the Trainer Payment Summary on multi-dog household invoices.
      const instructorBase = instructorNetMap.has(item.id)
        ? (instructorNetMap.get(item.id) as number)
        : amount;
      const itemTrainer = isFixedAmount(classData.trainer_fee_type)
        ? roundToCents(trainerValue)
        : roundToCents(instructorBase * (trainerValue / 100));
      summary.instructorFee += itemTrainer;

      // Accumulate profit per-item so totals always reconcile (no ±1c drift
      // from summing rounded fees then subtracting from raw revenue).
      summary.profit += roundToCents(amount - itemFranchise - itemAdmin - itemTrainer);
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
      
      // For any unallocated course-fee items (no booking link), apply the platform-standard fee rates
      // (these are hard-set business rules: Admin 10%, Trainer 40%, Franchise 15%).
      // This avoids skewing dashboard percentages due to data linkage issues.
      const avgAdminPercent = 10;
      const avgTrainerPercent = 40;
      const avgFranchisePercent = 15;

      const unallocatedAdminFee = roundToCents(unallocatedCourseFee * (avgAdminPercent / 100));
      const unallocatedTrainerFee = roundToCents(unallocatedCourseFee * (avgTrainerPercent / 100));
      const unallocatedFranchiseFee = roundToCents(unallocatedCourseFee * (avgFranchisePercent / 100));

      const unallocatedSummary: ClassFinance = {
        className: "Unallocated (no booking link)",
        totalRevenue: unallocatedCourseFee,
        bookingsCount: 0,
        franchiseFee: unallocatedFranchiseFee,
        adminFee: unallocatedAdminFee,
        instructorFee: unallocatedTrainerFee,
        profit: unallocatedCourseFee - unallocatedAdminFee - unallocatedTrainerFee - unallocatedFranchiseFee,
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

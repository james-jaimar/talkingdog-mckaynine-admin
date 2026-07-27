import { isEnrollmentFeeItem } from "@/lib/invoiceItemUtils";
import { roundToCents } from "@/lib/invoiceMath";

export interface CanonicalInvoiceItem {
  id: string;
  invoice_id: string;
  booking_id?: string | null;
  amount?: number | null;
  description?: string | null;
  item_type?: string | null;
  invoices?: {
    id?: string;
    status?: string | null;
    subtotal?: number | null;
    monetary_discount?: number | null;
    discount_reason?: string | null;
    branch_id?: string | null;
  } | null;
}

export interface CanonicalBooking {
  id: string;
  client_id?: string | null;
  class_schedule_id?: string | null;
  class_schedules?: CanonicalSchedule | null;
}

export interface CanonicalSchedule {
  id: string;
  trainer_id?: string | null;
  classes?: {
    id?: string;
    name?: string;
    trainer_fee_type?: string | null;
    trainer_fee_value?: number | null;
    mckaynine_commission_type?: string | null;
    mckaynine_commission_value?: number | null;
    admin_fee_type?: string | null;
    admin_fee_value?: number | null;
    branch_id?: string | null;
  } | null;
}

export interface CanonicalCommissionLine {
  itemId: string;
  invoiceId: string;
  bookingId?: string;
  clientId?: string;
  scheduleId?: string;
  trainerId?: string;
  classId?: string;
  className: string;
  branchId?: string;
  invoiceStatus?: string;
  isEnrollmentFee: boolean;
  isAllocated: boolean;
  grossAmount: number;
  netAmount: number;
  trainerBaseAmount: number;
  trainerCommission: number;
  franchiseFee: number;
  adminFee: number;
  profit: number;
}

function isFixedAmount(type: unknown): boolean {
  const normalized = String(type ?? "percentage").toLowerCase().trim();
  return normalized === "fixed" || normalized === "amount";
}

function calculateFee(baseAmount: number, type: unknown, value: unknown): number {
  const feeValue = Number(value ?? 0);
  if (feeValue === 0) return 0;
  return isFixedAmount(type) ? roundToCents(feeValue) : roundToCents(baseAmount * (feeValue / 100));
}

function getScheduleFromBooking(
  booking: CanonicalBooking | undefined,
  scheduleMap: Map<string, CanonicalSchedule>
): CanonicalSchedule | undefined {
  if (booking?.class_schedules?.id) return booking.class_schedules;
  if (booking?.class_schedule_id) return scheduleMap.get(booking.class_schedule_id);
  return undefined;
}

function applyDiscountsByInvoice(items: CanonicalInvoiceItem[]): Map<string, number> {
  const netAmountByItemId = new Map<string, number>();
  const itemsByInvoice = new Map<string, CanonicalInvoiceItem[]>();

  items.forEach((item) => {
    const invoiceId = item.invoice_id || item.invoices?.id;
    if (!invoiceId) {
      netAmountByItemId.set(item.id, roundToCents(Number(item.amount ?? 0)));
      return;
    }
    const group = itemsByInvoice.get(invoiceId) || [];
    group.push(item);
    itemsByInvoice.set(invoiceId, group);
  });

  itemsByInvoice.forEach((invoiceItems) => {
    const invoice = invoiceItems[0]?.invoices;
    const subtotal = Number(invoice?.subtotal ?? 0);
    const monetaryDiscount = Number(invoice?.monetary_discount ?? 0);

    if (monetaryDiscount <= 0 || subtotal <= 0) {
      invoiceItems.forEach((item) => {
        netAmountByItemId.set(item.id, roundToCents(Number(item.amount ?? 0)));
      });
      return;
    }

    const targetNetTotal = roundToCents(subtotal - monetaryDiscount);
    const discountRatio = monetaryDiscount / subtotal;
    let accumulatedNet = 0;

    invoiceItems.forEach((item, index) => {
      const originalAmount = Number(item.amount ?? 0);
      const isLast = index === invoiceItems.length - 1;
      const netAmount = isLast
        ? Math.max(0, roundToCents(targetNetTotal - accumulatedNet))
        : roundToCents(originalAmount - originalAmount * discountRatio);

      if (!isLast) accumulatedNet += netAmount;
      netAmountByItemId.set(item.id, netAmount);
    });
  });

  return netAmountByItemId;
}

export function buildCanonicalCommissionLines(
  invoiceItems: CanonicalInvoiceItem[],
  bookings: CanonicalBooking[],
  schedules: CanonicalSchedule[] = [],
  branchId?: string
): CanonicalCommissionLine[] {
  const bookingMap = new Map<string, CanonicalBooking>();
  bookings.forEach((booking) => bookingMap.set(booking.id, booking));

  const scheduleMap = new Map<string, CanonicalSchedule>();
  schedules.forEach((schedule) => scheduleMap.set(schedule.id, schedule));

  const netAmountByItemId = applyDiscountsByInvoice(invoiceItems);

  const baseLines = invoiceItems.map((item): CanonicalCommissionLine => {
    const booking = item.booking_id ? bookingMap.get(item.booking_id) : undefined;
    const schedule = getScheduleFromBooking(booking, scheduleMap);
    const classData = schedule?.classes;
    const netAmount = netAmountByItemId.get(item.id) ?? roundToCents(Number(item.amount ?? 0));
    const itemBranchId = classData?.branch_id || item.invoices?.branch_id || branchId;
    const allocated = Boolean(booking && schedule && classData && (!branchId || !itemBranchId || itemBranchId === branchId));

    return {
      itemId: item.id,
      invoiceId: item.invoice_id || item.invoices?.id || "",
      bookingId: item.booking_id || undefined,
      clientId: booking?.client_id || undefined,
      scheduleId: schedule?.id,
      trainerId: schedule?.trainer_id || undefined,
      classId: classData?.id,
      className: allocated ? classData?.name || "Unknown Class" : "Unallocated (no booking link)",
      branchId: itemBranchId || undefined,
      invoiceStatus: item.invoices?.status || undefined,
      isEnrollmentFee: isEnrollmentFeeItem(item),
      isAllocated: allocated,
      grossAmount: roundToCents(Number(item.amount ?? 0)),
      netAmount,
      trainerBaseAmount: netAmount,
      trainerCommission: 0,
      franchiseFee: 0,
      adminFee: 0,
      profit: 0,
    };
  });

  const linesByInvoice = new Map<string, CanonicalCommissionLine[]>();
  baseLines.forEach((line) => {
    if (!line.invoiceId) return;
    const group = linesByInvoice.get(line.invoiceId) || [];
    group.push(line);
    linesByInvoice.set(line.invoiceId, group);
  });

  linesByInvoice.forEach((invoiceLines) => {
    const courseLines = invoiceLines.filter((line) => !line.isEnrollmentFee && line.isAllocated && line.trainerId);
    if (courseLines.length === 0) return;

    const invoice = invoiceItems.find((item) => item.invoice_id === invoiceLines[0]?.invoiceId)?.invoices;
    const trainerIds = new Set(courseLines.map((line) => line.trainerId).filter(Boolean));
    const clientIds = new Set(courseLines.map((line) => line.clientId).filter(Boolean));
    const hasMultiDogDiscount = /multi-?dog/i.test(invoice?.discount_reason || "");

    if (trainerIds.size <= 1 || clientIds.size !== 1 || !hasMultiDogDiscount) return;

    const totalNet = courseLines.reduce((sum, line) => sum + line.netAmount, 0);
    const sharePerTrainer = totalNet / trainerIds.size;
    const trainerTotals = new Map<string, number>();

    courseLines.forEach((line) => {
      if (!line.trainerId) return;
      trainerTotals.set(line.trainerId, (trainerTotals.get(line.trainerId) || 0) + line.netAmount);
    });

    courseLines.forEach((line) => {
      if (!line.trainerId) return;
      const trainerTotal = trainerTotals.get(line.trainerId) || 0;
      if (trainerTotal <= 0) return;
      line.trainerBaseAmount = roundToCents(line.netAmount * (sharePerTrainer / trainerTotal));
    });
  });

  baseLines.forEach((line) => {
    if (line.isEnrollmentFee || !line.isAllocated) return;
    const booking = line.bookingId ? bookingMap.get(line.bookingId) : undefined;
    const schedule = getScheduleFromBooking(booking, scheduleMap);
    const classData = schedule?.classes;
    if (!classData) return;

    line.franchiseFee = calculateFee(line.netAmount, classData.mckaynine_commission_type, classData.mckaynine_commission_value);
    line.adminFee = calculateFee(line.netAmount, classData.admin_fee_type, classData.admin_fee_value);
    line.trainerCommission = calculateFee(line.trainerBaseAmount, classData.trainer_fee_type, classData.trainer_fee_value);
    line.profit = roundToCents(line.netAmount - line.franchiseFee - line.adminFee - line.trainerCommission);
  });

  return baseLines;
}

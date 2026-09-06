import { addMonths, endOfMonth, format, isSameMonth, startOfMonth } from "date-fns";
import { roundToCents } from "@/lib/invoiceMath";
import { CanonicalCommissionLine, resolvePeriodKey } from "@/lib/financial/canonicalCommission";

export interface StatementInvoiceLike {
  id?: string | null;
  status?: string | null;
  franchise_report_month?: string | null;
  issued_date?: string | null;
}

export interface StatementInvoiceItemLike {
  id: string;
  invoice_id?: string | null;
  booking_id?: string | null;
  amount?: number | null;
  description?: string | null;
  item_type?: string | null;
  invoices?: StatementInvoiceLike | null;
}

/** Convert an inclusive date range to its inclusive YYYY-MM reporting months. */
export function statementPeriodMonthKeys(from: Date, to: Date): string[] {
  if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return [];

  const start = startOfMonth(from < to ? from : to);
  const end = startOfMonth(to >= from ? to : from);
  const keys: string[] = [];
  let cursor = start;

  while (cursor <= end) {
    keys.push(format(cursor, "yyyy-MM"));
    cursor = addMonths(cursor, 1);
  }

  return keys;
}

/** Return whether an invoice's reporting period falls inside the inclusive month set. */
export function isInvoiceInStatementPeriod(
  invoice: StatementInvoiceLike | null | undefined,
  monthKeys: Iterable<string>
): boolean {
  const monthSet = monthKeys instanceof Set ? monthKeys : new Set(monthKeys);
  if (monthSet.size === 0) return false;

  const { periodKey } = resolvePeriodKey({ invoices: invoice || null } as any);
  return !!periodKey && monthSet.has(periodKey);
}

/** Derive a friendly statement period from report months. */
export function statementPeriodFromMonthKeys(monthKeys: string[]): { label: string; from: Date; to: Date } | null {
  const sorted = [...new Set(monthKeys.filter(Boolean))].sort();
  if (sorted.length === 0) return null;

  const from = startOfMonth(new Date(`${sorted[0]}-01T00:00:00`));
  const to = endOfMonth(new Date(`${sorted[sorted.length - 1]}-01T00:00:00`));
  const label = isSameMonth(from, to)
    ? format(from, "MMMM yyyy")
    : `${format(from, "MMM")} - ${format(to, "MMM yyyy")}`;

  return { label, from, to };
}

export interface TrainerStatementHandlerRow {
  key: string;
  invoiceItemId: string;
  invoiceId: string;
  invoiceStatus: string;
  periodKey: string;
  periodLabel: string;
  periodInferred: boolean;
  handlerName: string;
  handlerEmail: string;
  dogName: string;
  dogBreed: string;
  courseFee: number;
  commissionAmount: number;
  paymentStatus: "paid" | "unpaid";
  scheduleId?: string;
  className: string;
  classDate: string;
  isSubstitute: boolean;
  substituteDates?: number;
  totalDates?: number;
  originalTrainerName?: string;
  substituteTrainerName?: string;
}

export interface TrainerStatementClassGroup {
  key: string;
  className: string;
  classDate: string;
  sortDate: number;
  handlers: TrainerStatementHandlerRow[];
  bookingsCount: number;
  courseFee: number;
  commissionAmount: number;
  paymentStatus: "paid" | "unpaid" | "partial";
  periodInferred: boolean;
  isSubstitute: boolean;
  substituteDates?: number;
  totalDates?: number;
  originalTrainerName?: string;
  substituteTrainerName?: string;
}

export interface TrainerStatementSummary {
  classes: TrainerStatementClassGroup[];
  totalCommission: number;
  totalPaid: number;
  outstanding: number;
  periodKeys: string[];
}

interface BuildTrainerStatementOptions {
  bookingById: Map<string, {
    clientName: string;
    clientEmail: string;
    dogName: string;
    dogBreed: string;
  }>;
  scheduleById: Map<string, {
    className: string;
    classDate: string;
    sortDate: number;
    trainerId?: string | null;
    commissionRatio?: number;
    isSubstitute?: boolean;
    substituteDates?: number;
    totalDates?: number;
    originalTrainerName?: string;
    substituteTrainerName?: string;
  }>;
}

/** Build statement groups from canonical invoice lines without aggregating invoices into bookings. */
export function buildTrainerStatementGroups(
  commissionLines: CanonicalCommissionLine[],
  options: BuildTrainerStatementOptions
): TrainerStatementSummary {
  const groups = new Map<string, TrainerStatementClassGroup>();
  const periodKeys = new Set<string>();

  commissionLines
    .filter((line) => line.isAllocated && !line.isEnrollmentFee && line.invoiceStatus !== "cancelled")
    .forEach((line) => {
      const schedule = line.scheduleId ? options.scheduleById.get(line.scheduleId) : undefined;
      const booking = line.bookingId ? options.bookingById.get(line.bookingId) : undefined;
      const className = schedule?.className || line.className || "Unknown Class";
      const classDate = schedule?.classDate || "";
      const sortDate = schedule?.sortDate || 0;
      const groupKey = className.trim().toLowerCase();
      const periodKey = line.periodKey || "unknown";
      const invoiceStatus = (line.invoiceStatus || "unpaid").toLowerCase();
      const paymentStatus: "paid" | "unpaid" = invoiceStatus === "paid" ? "paid" : "unpaid";
      const periodLabel = periodKey === "unknown" ? "Unknown month" : format(new Date(`${periodKey}-01T00:00:00`), "MMM yyyy");

      periodKeys.add(periodKey);

      let group = groups.get(groupKey);
      if (!group) {
        group = {
          key: groupKey,
          className,
          classDate,
          sortDate,
          handlers: [],
          bookingsCount: 0,
          courseFee: 0,
          commissionAmount: 0,
          paymentStatus: "paid",
          periodInferred: false,
          isSubstitute: false,
        };
        groups.set(groupKey, group);
      }

      if (schedule?.sortDate && (!group.sortDate || schedule.sortDate < group.sortDate)) {
        group.sortDate = schedule.sortDate;
        group.classDate = schedule.classDate;
      }

      group.handlers.push({
        key: line.itemId,
        invoiceItemId: line.itemId,
        invoiceId: line.invoiceId,
        invoiceStatus,
        periodKey,
        periodLabel,
        periodInferred: line.periodInferred,
        handlerName: booking?.clientName || "Unknown Handler",
        handlerEmail: booking?.clientEmail || "",
        dogName: booking?.dogName || "Unknown Dog",
        dogBreed: booking?.dogBreed || "",
        courseFee: roundToCents(line.netAmount),
        commissionAmount: roundToCents(line.trainerCommission),
        paymentStatus,
        scheduleId: line.scheduleId,
        className,
        classDate,
        isSubstitute: !!schedule?.isSubstitute,
        substituteDates: schedule?.substituteDates,
        totalDates: schedule?.totalDates,
        originalTrainerName: schedule?.originalTrainerName,
        substituteTrainerName: schedule?.substituteTrainerName,
      });
    });

  const classes = Array.from(groups.values()).map((group) => {
    group.handlers.sort((a, b) =>
      a.periodKey.localeCompare(b.periodKey) ||
      a.handlerName.localeCompare(b.handlerName) ||
      a.dogName.localeCompare(b.dogName) ||
      a.invoiceItemId.localeCompare(b.invoiceItemId)
    );

    group.bookingsCount = group.handlers.length;
    group.courseFee = roundToCents(group.handlers.reduce((sum, handler) => sum + handler.courseFee, 0));
    group.commissionAmount = roundToCents(group.handlers.reduce((sum, handler) => sum + handler.commissionAmount, 0));
    group.periodInferred = group.handlers.some((handler) => handler.periodInferred);
    group.isSubstitute = group.handlers.some((handler) => handler.isSubstitute);
    group.originalTrainerName = group.handlers.find((handler) => handler.originalTrainerName)?.originalTrainerName;
    group.substituteTrainerName = group.handlers.find((handler) => handler.substituteTrainerName)?.substituteTrainerName;
    group.substituteDates = group.handlers.find((handler) => handler.substituteDates != null)?.substituteDates;
    group.totalDates = group.handlers.find((handler) => handler.totalDates != null)?.totalDates;

    const paidCount = group.handlers.filter((handler) => handler.paymentStatus === "paid").length;
    group.paymentStatus = paidCount === group.handlers.length ? "paid" : paidCount === 0 ? "unpaid" : "partial";

    return group;
  }).sort((a, b) => a.sortDate - b.sortDate || a.className.localeCompare(b.className));

  const totalCommission = roundToCents(classes.reduce((sum, cls) => sum + cls.commissionAmount, 0));
  const totalPaid = roundToCents(classes.reduce((sum, cls) =>
    sum + cls.handlers.reduce((paidSum, handler) => paidSum + (handler.paymentStatus === "paid" ? handler.commissionAmount : 0), 0), 0));
  const outstanding = roundToCents(totalCommission - totalPaid);

  return {
    classes,
    totalCommission,
    totalPaid,
    outstanding,
    periodKeys: Array.from(periodKeys).filter(Boolean).sort(),
  };
}

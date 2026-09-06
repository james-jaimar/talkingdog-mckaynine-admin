import { useQuery } from "@tanstack/react-query";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  buildCanonicalCommissionLines,
  CanonicalBooking,
  CanonicalInvoiceItem,
  CanonicalSchedule,
} from "@/lib/financial/canonicalCommission";
import {
  buildTrainerStatementGroups,
  statementPeriodMonthKeys,
  TrainerStatementSummary,
} from "@/lib/financial/trainerStatement";

interface TrainerStatementDataOptions {
  enabled: boolean;
  trainerId?: string;
  branchId?: string;
  from?: Date;
  to?: Date;
}

interface InvoiceItemQueryRow extends Omit<CanonicalInvoiceItem, "invoices"> {
  invoices: (CanonicalInvoiceItem["invoices"] & { branch_id?: string | null }) | null;
}

interface BookingQueryRow {
  id: string;
  client_id?: string | null;
  class_schedule_id?: string | null;
  clients?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
  dogs?: {
    name?: string | null;
    breed?: string | null;
  } | null;
}

interface ScheduleQueryRow {
  id: string;
  trainer_id?: string | null;
  start_time?: string | null;
  selected_dates?: string[] | null;
  classes?: CanonicalSchedule["classes"] & { branch_id?: string | null };
}

function monthBounds(from: Date, to: Date): { from: Date; to: Date } {
  const start = startOfMonth(from < to ? from : to);
  const end = endOfMonth(to >= from ? to : from);
  return { from: start, to: end };
}

async function fetchStatementSchedules(trainerId: string, branchId: string): Promise<ScheduleQueryRow[]> {
  // Schedules where this trainer is the assigned trainer, plus schedules they subbed.
  const [{ data: ownSchedules, error: ownError }, { data: substitutes, error: subError }] = await Promise.all([
    supabase
      .from("class_schedules")
      .select(`
        id,
        trainer_id,
        start_time,
        selected_dates,
        classes:class_id (
          id,
          name,
          trainer_fee_type,
          trainer_fee_value,
          mckaynine_commission_type,
          mckaynine_commission_value,
          admin_fee_type,
          admin_fee_value,
          branch_id
        )
      `)
      .eq("trainer_id", trainerId),
    supabase
      .from("class_date_substitutes")
      .select(`
        id,
        class_schedule_id,
        class_date,
        substitute_trainer_id,
        original_trainer_id,
        class_schedules:class_schedule_id (
          id,
          trainer_id,
          start_time,
          selected_dates,
          classes:class_id (
            id,
            name,
            trainer_fee_type,
            trainer_fee_value,
            mckaynine_commission_type,
            mckaynine_commission_value,
            admin_fee_type,
            admin_fee_value,
            branch_id
          )
        )
      `)
      .or(`substitute_trainer_id.eq.${trainerId},original_trainer_id.eq.${trainerId}`),
  ]);

  if (ownError) throw ownError;
  if (subError) throw subError;

  const byId = new Map<string, ScheduleQueryRow & { substituteRecords?: any[] }>();

  (ownSchedules || []).forEach((schedule: any) => {
    if (schedule.classes?.branch_id !== branchId) return;
    byId.set(schedule.id, { ...schedule, substituteRecords: [] });
  });

  (substitutes || []).forEach((record: any) => {
    const schedule = record.class_schedules;
    if (!schedule?.id || schedule.classes?.branch_id !== branchId) return;
    const existing = byId.get(schedule.id) || { ...schedule, substituteRecords: [] };
    existing.substituteRecords = [...(existing.substituteRecords || []), record];
    byId.set(schedule.id, existing);
  });

  return Array.from(byId.values());
}

function scheduleDisplay(schedule: ScheduleQueryRow & { substituteRecords?: any[] }, trainerId: string, trainerNameById: Map<string, string>) {
  const scheduleDate = schedule.start_time ? new Date(schedule.start_time) : null;
  const subs = schedule.substituteRecords || [];
  const selectedDates = schedule.selected_dates || [];
  const totalDates = selectedDates.length || 1;
  const isSubstitute = schedule.trainer_id !== trainerId;
  const mySubDates = isSubstitute
    ? subs.filter((sub) => sub.substitute_trainer_id === trainerId)
    : subs;

  // Pro-rate commission by dates covered, matching formatTrainerData
  let commissionRatio = 1;
  if (subs.length > 0 && totalDates > 0) {
    commissionRatio = isSubstitute
      ? mySubDates.length / totalDates
      : Math.max(0, (totalDates - subs.length) / totalDates);
  }

  const originalTrainerName = isSubstitute
    ? trainerNameById.get(String(schedule.trainer_id || "")) || "Original Trainer"
    : undefined;
  const substituteTrainerName = !isSubstitute && subs.length > 0
    ? [...new Set(subs.map((sub) => trainerNameById.get(String(sub.substitute_trainer_id))).filter(Boolean))].join(", ")
    : undefined;

  return {
    className: schedule.classes?.name || "Unknown Class",
    classDate: scheduleDate ? format(scheduleDate, "dd/MM/yyyy") : "N/A",
    sortDate: scheduleDate?.getTime() || 0,
    trainerId: schedule.trainer_id,
    commissionRatio,
    isSubstitute,
    substituteDates: mySubDates.length || undefined,
    totalDates: totalDates > 1 ? totalDates : undefined,
    originalTrainerName,
    substituteTrainerName,
  };
}

export function useTrainerStatementData({ enabled, trainerId, branchId, from, to }: TrainerStatementDataOptions) {
  const range = from && to ? monthBounds(from, to) : undefined;
  const fromKey = range ? format(range.from, "yyyy-MM-dd") : undefined;
  const toKey = range ? format(range.to, "yyyy-MM-dd") : undefined;
  const monthKeys = range ? statementPeriodMonthKeys(range.from, range.to) : [];

  return useQuery({
    queryKey: ["trainer-statement-data", trainerId, branchId, fromKey, toKey],
    enabled: enabled && !!trainerId && !!branchId && !!range,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<TrainerStatementSummary> => {
      if (!trainerId || !branchId || !range) {
        return { classes: [], totalCommission: 0, totalPaid: 0, outstanding: 0, periodKeys: [] };
      }

      const schedules = await fetchStatementSchedules(trainerId, branchId);
      const scheduleIds = schedules.map((schedule) => schedule.id);

      if (scheduleIds.length === 0) {
        return { classes: [], totalCommission: 0, totalPaid: 0, outstanding: 0, periodKeys: [] };
      }

      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          id,
          client_id,
          class_schedule_id,
          clients:client_id (
            first_name,
            last_name,
            email
          ),
          dogs:dog_id (
            name,
            breed
          )
        `)
        .in("class_schedule_id", scheduleIds);

      if (bookingsError) throw bookingsError;

      const bookingRows = (bookings || []) as BookingQueryRow[];
      const bookingIds = bookingRows.map((booking) => booking.id);

      if (bookingIds.length === 0) {
        return { classes: [], totalCommission: 0, totalPaid: 0, outstanding: 0, periodKeys: [] };
      }

      const { data: invoiceItems, error: invoiceItemsError } = await supabase
        .from("invoice_items")
        .select(`
          id,
          invoice_id,
          booking_id,
          description,
          quantity,
          unit_price,
          amount,
          item_type,
          invoices:invoice_id (
            id,
            status,
            subtotal,
            monetary_discount,
            discount_reason,
            branch_id,
            franchise_report_month,
            issued_date
          )
        `)
        .in("booking_id", bookingIds);

      if (invoiceItemsError) throw invoiceItemsError;

      const monthSet = new Set(monthKeys);
      const scopedInvoiceItems = ((invoiceItems || []) as InvoiceItemQueryRow[]).filter((item) => {
        if (item.invoices?.branch_id !== branchId) return false;
        const reportMonth = item.invoices?.franchise_report_month;
        const issuedDate = item.invoices?.issued_date;
        const key = reportMonth?.slice(0, 7) || issuedDate?.slice(0, 7) || "";
        return !!key && monthSet.has(key);
      });

      if (scopedInvoiceItems.length === 0) {
        return { classes: [], totalCommission: 0, totalPaid: 0, outstanding: 0, periodKeys: [] };
      }

      // Commission discounts are invoice-level, so include every item on the same invoices
      // before running the canonical calculator; then keep only this trainer's allocated lines.
      const scopedInvoiceIds = [...new Set(scopedInvoiceItems.map((item) => item.invoice_id).filter(Boolean))] as string[];
      const { data: completeInvoiceItems, error: completeInvoiceItemsError } = await supabase
        .from("invoice_items")
        .select(`
          id,
          invoice_id,
          booking_id,
          description,
          quantity,
          unit_price,
          amount,
          item_type,
          invoices:invoice_id (
            id,
            status,
            subtotal,
            monetary_discount,
            discount_reason,
            branch_id,
            franchise_report_month,
            issued_date
          )
        `)
        .in("invoice_id", scopedInvoiceIds);

      if (completeInvoiceItemsError) throw completeInvoiceItemsError;

      const completeRows = ((completeInvoiceItems || []) as InvoiceItemQueryRow[]).filter(
        (item) => item.invoices?.branch_id === branchId
      );
      const relevantBookingIds = [...new Set(completeRows.map((item) => item.booking_id).filter(Boolean))] as string[];

      const { data: relevantBookings, error: relevantBookingsError } = relevantBookingIds.length > 0
        ? await supabase
            .from("bookings")
            .select(`
              id,
              client_id,
              class_schedule_id,
              clients:client_id (
                first_name,
                last_name,
                email
              ),
              dogs:dog_id (
                name,
                breed
              )
            `)
            .in("id", relevantBookingIds)
        : { data: [], error: null };

      if (relevantBookingsError) throw relevantBookingsError;

      const relevantScheduleIds = [...new Set(((relevantBookings || []) as BookingQueryRow[])
        .map((booking) => booking.class_schedule_id)
        .filter(Boolean))] as string[];
      const missingScheduleIds = relevantScheduleIds.filter((id) => !schedules.some((schedule) => schedule.id === id));

      let allSchedules = schedules;
      if (missingScheduleIds.length > 0) {
        const { data: missingSchedules, error: missingSchedulesError } = await supabase
          .from("class_schedules")
          .select(`
            id,
            trainer_id,
            start_time,
            selected_dates,
            classes:class_id (
              id,
              name,
              trainer_fee_type,
              trainer_fee_value,
              mckaynine_commission_type,
              mckaynine_commission_value,
              admin_fee_type,
              admin_fee_value,
              branch_id
            )
          `)
          .in("id", missingScheduleIds);

        if (missingSchedulesError) throw missingSchedulesError;
        allSchedules = [...schedules, ...((missingSchedules || []) as ScheduleQueryRow[])];
      }

      const trainerIds = [...new Set(allSchedules.map((schedule) => schedule.trainer_id).filter(Boolean))] as string[];
      const { data: trainerRows, error: trainerRowsError } = trainerIds.length > 0
        ? await supabase.from("trainers").select("id, first_name, last_name").in("id", trainerIds)
        : { data: [], error: null };

      if (trainerRowsError) throw trainerRowsError;

      const trainerNameById = new Map<string, string>();
      (trainerRows || []).forEach((trainer: any) => {
        trainerNameById.set(trainer.id, `${trainer.first_name || ""} ${trainer.last_name || ""}`.trim());
      });

      const canonicalBookings: CanonicalBooking[] = ((relevantBookings || []) as BookingQueryRow[]).map((booking) => ({
        id: booking.id,
        client_id: booking.client_id,
        class_schedule_id: booking.class_schedule_id,
      }));

      const canonicalSchedules: CanonicalSchedule[] = allSchedules.map((schedule) => ({
        id: schedule.id,
        trainer_id: schedule.trainer_id,
        classes: schedule.classes,
      }));

      const allLines = buildCanonicalCommissionLines(
        completeRows as CanonicalInvoiceItem[],
        canonicalBookings,
        canonicalSchedules,
        branchId
      );

      const trainerLines = allLines.filter((line) => line.trainerId === trainerId);
      const bookingById = new Map(
        ((relevantBookings || []) as BookingQueryRow[]).map((booking) => {
          const client = booking.clients;
          const dog = booking.dogs;
          return [booking.id, {
            clientName: `${client?.first_name || ""} ${client?.last_name || ""}`.trim() || "Unknown Handler",
            clientEmail: client?.email || "",
            dogName: dog?.name || "Unknown Dog",
            dogBreed: dog?.breed || "",
          }];
        })
      );

      const scheduleById = new Map(
        allSchedules.map((schedule) => [schedule.id, scheduleDisplay(schedule, trainerId, trainerNameById)])
      );

      return buildTrainerStatementGroups(trainerLines, { bookingById, scheduleById });
    },
  });
}

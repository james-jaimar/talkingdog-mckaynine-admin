import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CascadeDiff } from "./cascade-diff";

export interface CascadePreview {
  draftDescriptionsToUpdate: number;
  pendingTrainerPaymentsToRecalc: number;
  sentInvoicesUntouched: number;
}

/**
 * Preview how many downstream rows a class edit would touch. Read-only.
 * Uses the client's RLS-scoped session (admins only can see the full set).
 */
export async function previewClassCascade(
  classId: string,
  diff: CascadeDiff,
): Promise<CascadePreview> {
  const preview: CascadePreview = {
    draftDescriptionsToUpdate: 0,
    pendingTrainerPaymentsToRecalc: 0,
    sentInvoicesUntouched: 0,
  };

  // Booking ids under this class
  const { data: schedules } = await supabase
    .from("class_schedules")
    .select("id")
    .eq("class_id", classId);
  const scheduleIds = (schedules ?? []).map((s: any) => s.id);
  if (scheduleIds.length === 0) return preview;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id")
    .in("class_schedule_id", scheduleIds);
  const bookingIds = (bookings ?? []).map((b: any) => b.id);
  if (bookingIds.length === 0) return preview;

  if (diff.nameChanged && diff.oldName) {
    const { data: items } = await supabase
      .from("invoice_items")
      .select("id, description, invoices!inner(status)")
      .in("booking_id", bookingIds);
    for (const it of (items ?? []) as any[]) {
      const status = it.invoices?.status;
      const matches = (it.description ?? "").includes(diff.oldName);
      if (!matches) continue;
      if (status === "draft") preview.draftDescriptionsToUpdate++;
      else preview.sentInvoicesUntouched++;
    }
  }

  if (diff.feesChanged) {
    const { count } = await supabase
      .from("trainer_payments")
      .select("id", { count: "exact", head: true })
      .in("booking_id", bookingIds)
      .eq("status", "pending");
    preview.pendingTrainerPaymentsToRecalc = count ?? 0;
  }

  return preview;
}

export function useCascadeClassEdit() {
  const [isRunning, setIsRunning] = useState(false);

  const runCascade = async (params: {
    classId: string;
    diff: CascadeDiff;
  }) => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "cascade-class-edit",
        {
          body: {
            classId: params.classId,
            oldName: params.diff.oldName,
            newName: params.diff.newName,
            feesChanged: params.diff.feesChanged,
          },
        },
      );
      if (error) throw error;
      return data as {
        descriptionsUpdated: number;
        trainerPaymentsRecalculated: number;
        errors: string[];
      };
    } finally {
      setIsRunning(false);
    }
  };

  return { runCascade, isRunning };
}

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface CascadeRequest {
  classId: string;
  oldName?: string;
  newName?: string;
  feesChanged?: boolean;
}

interface CascadeResult {
  descriptionsUpdated: number;
  trainerPaymentsRecalculated: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // AuthN — must be an authenticated admin
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userRes.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as CascadeRequest;
    if (!body.classId) {
      return new Response(JSON.stringify({ error: "classId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result: CascadeResult = {
      descriptionsUpdated: 0,
      trainerPaymentsRecalculated: 0,
      errors: [],
    };

    // Collect all schedule ids and booking ids for this class (needed for both cascades)
    const { data: schedules, error: schedErr } = await admin
      .from("class_schedules")
      .select("id")
      .eq("class_id", body.classId);
    if (schedErr) throw schedErr;
    const scheduleIds = (schedules ?? []).map((s: any) => s.id);

    let bookingIds: string[] = [];
    if (scheduleIds.length > 0) {
      const { data: bookings, error: bkErr } = await admin
        .from("bookings")
        .select("id")
        .in("class_schedule_id", scheduleIds);
      if (bkErr) throw bkErr;
      bookingIds = (bookings ?? []).map((b: any) => b.id);
    }

    // ---------- 1. Rename cascade: rewrite invoice_items.description on DRAFT invoices only ----------
    if (body.oldName && body.newName && body.oldName !== body.newName && bookingIds.length > 0) {
      // Fetch draft invoice ids
      const { data: draftInvoices, error: invErr } = await admin
        .from("invoices")
        .select("id")
        .eq("status", "draft");
      if (invErr) throw invErr;
      const draftIds = new Set((draftInvoices ?? []).map((i: any) => i.id));

      if (draftIds.size > 0) {
        // Fetch matching invoice items in chunks (in-clause safety)
        const { data: items, error: itemsErr } = await admin
          .from("invoice_items")
          .select("id, invoice_id, description")
          .in("booking_id", bookingIds);
        if (itemsErr) throw itemsErr;

        for (const item of items ?? []) {
          if (!draftIds.has(item.invoice_id)) continue;
          const desc: string = item.description ?? "";
          if (!desc.includes(body.oldName)) continue;
          const newDesc = desc.split(body.oldName).join(body.newName);
          const { error: updErr } = await admin
            .from("invoice_items")
            .update({ description: newDesc })
            .eq("id", item.id);
          if (updErr) {
            result.errors.push(`item ${item.id}: ${updErr.message}`);
          } else {
            result.descriptionsUpdated++;
          }
        }
      }
    }

    // ---------- 2. Fee cascade: recompute pending trainer_payments for this class ----------
    if (body.feesChanged && bookingIds.length > 0) {
      const { data: pending, error: pendErr } = await admin
        .from("trainer_payments")
        .select("id, booking_id")
        .in("booking_id", bookingIds)
        .eq("status", "pending");
      if (pendErr) throw pendErr;

      for (const tp of pending ?? []) {
        if (!tp.booking_id) continue;
        const { data: newAmt, error: calcErr } = await admin.rpc(
          "calculate_trainer_payment",
          { p_booking_id: tp.booking_id },
        );
        if (calcErr) {
          result.errors.push(`tp ${tp.id}: ${calcErr.message}`);
          continue;
        }
        const { error: updErr } = await admin
          .from("trainer_payments")
          .update({ amount: newAmt ?? 0, updated_at: new Date().toISOString() })
          .eq("id", tp.id);
        if (updErr) {
          result.errors.push(`tp ${tp.id}: ${updErr.message}`);
        } else {
          result.trainerPaymentsRecalculated++;
        }
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cascade-class-edit error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

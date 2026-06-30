import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PayloadSchema = z.object({
  source: z.string().min(1).max(100),
  submittedAt: z.string().optional().nullable(),
  answers: z.record(
    z.union([z.string(), z.array(z.string()), z.number(), z.boolean(), z.null()])
  ),
});

// Extract any Google Drive URLs (or bare file IDs) so we can surface them
// to admins as clickable links in the review UI.
const DRIVE_URL_REGEX = /https?:\/\/(?:drive|docs)\.google\.com\/[^\s"'<>)]+/gi;
const FILE_ID_REGEX = /^[a-zA-Z0-9_-]{20,}$/;
function collectDriveUrls(value: unknown, out: Set<string>): void {
  if (value == null) return;
  if (typeof value === "string") {
    const m = value.match(DRIVE_URL_REGEX);
    if (m) m.forEach((u) => out.add(u));
    else if (FILE_ID_REGEX.test(value.trim()))
      out.add(`https://drive.google.com/file/d/${value.trim()}/view`);
    return;
  }
  if (Array.isArray(value)) { value.forEach((v) => collectDriveUrls(v, out)); return; }
  if (typeof value === "object")
    Object.values(value as Record<string, unknown>).forEach((v) => collectDriveUrls(v, out));
}

// Light-weight email extractor so the log row has a useful summary column.
function extractEmail(answers: Record<string, unknown>): string | null {
  for (const [k, v] of Object.entries(answers)) {
    if (/email|e-mail/i.test(k) && typeof v === "string" && v.includes("@")) {
      return v.toLowerCase().trim();
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const secret = req.headers.get("x-webhook-secret");
  const expected = Deno.env.get("GOOGLE_FORM_WEBHOOK_SECRET");
  if (!expected || secret !== expected) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload;
  try {
    payload = PayloadSchema.parse(await req.json());
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid payload: " + err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const email = extractEmail(payload.answers);

  // Collect Drive URLs (vaccination certs etc.) into the stored payload
  // so the admin UI can show them as clickable links.
  const driveUrlSet = new Set<string>();
  collectDriveUrls(payload.answers, driveUrlSet);
  const driveUrls = Array.from(driveUrlSet);
  const enrichedPayload = { ...payload, driveUrls };

  const { data: log, error } = await supabase
    .from("google_form_submissions")
    .insert({
      source: payload.source,
      submitted_at: payload.submittedAt ?? null,
      email,
      raw_payload: enrichedPayload,
      status: "received",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Insert failed:", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ ok: true, status: "received", id: log.id }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PayloadSchema = z.object({
  source: z.string().min(1).max(100),
  submittedAt: z.string().optional().nullable(),
  answers: z.record(z.union([z.string(), z.array(z.string()), z.number(), z.boolean(), z.null()])),
});

// ------- Field mapping (case-insensitive question titles) ----------
// Add aliases here as Shannon's exact question titles are confirmed.
const FIELD_ALIASES: Record<string, string[]> = {
  ownerName: ["owner name", "your name", "full name", "name", "handler name", "parent name"],
  accountHolderName: ["account holder name", "account holder", "billing name"],
  email: ["email", "email address", "your email", "e-mail"],
  phone: ["phone", "phone number", "cell", "cellphone", "mobile", "contact number"],
  occupation: ["occupation", "job", "profession"],
  vetName: ["vet name", "vet", "veterinarian", "vet practice", "veterinary practice"],

  dogName: ["dog name", "puppy name", "your dog's name", "dog's name", "puppy's name"],
  birthDate: ["date of birth", "dog date of birth", "puppy date of birth", "dob", "birthday"],
  gender: ["gender", "dog gender", "sex"],
  breed: ["breed", "dog breed", "puppy breed"],
  spayNeuterStatus: ["spayed/neutered", "spayed or neutered", "spay/neuter status", "sterilised", "sterilized"],
  acquiredFrom: ["acquired from", "where did you get your dog", "where did you get your puppy", "source"],
  acquiredFromOther: ["acquired from other", "if other, where"],
  ageAtAcquisition: ["age at acquisition", "age when you got your dog", "age when you got your puppy"],

  childrenAtHome: ["children at home", "kids at home", "do you have children"],
  socialBehaviorDetails: ["social behaviour details", "social behavior details", "behaviour details"],
  trainingGoal: ["training goal", "what do you want to achieve", "goal"],
  hasBehaviorProblems: ["any behaviour problems", "any behavior problems", "behaviour problems?"],
  behaviorProblemsDetails: ["behaviour problems details", "behavior problems details", "describe behaviour problems"],
  hasHealthProblems: ["any health problems", "health problems?"],
  healthProblemsDetails: ["health problems details", "describe health problems"],

  classType: ["class type", "which class", "course", "class"],
  branch: ["branch", "location", "which branch"],

  whatsappPermission: ["whatsapp permission", "whatsapp", "may we add you to whatsapp"],
  photoPermission: ["photo permission", "photos", "may we use photos"],

  onleadSocializingAcknowledged: ["on-lead socializing acknowledgement", "onlead socializing", "on lead socializing"],
  equipmentSupervisionAcknowledged: ["equipment supervision acknowledgement", "equipment supervision"],
  trainingEquipmentAcknowledged: ["training equipment acknowledgement", "training equipment"],
  treatsAcknowledged: ["treats acknowledgement", "treats"],
  wasteDisposalAcknowledged: ["waste disposal acknowledgement", "waste disposal", "poop disposal"],
  termsAgreed: ["terms agreed", "i agree to the terms", "terms and conditions"],
  privacyPolicyAgreed: ["privacy policy agreed", "i agree to the privacy policy", "privacy policy"],
  signatureName: ["signature name", "signed by", "signature"],
  signatureDate: ["signature date", "date signed", "date"],
};

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[?:]/g, "");
}

function getAnswer(answers: Record<string, any>, field: string): any {
  const aliases = FIELD_ALIASES[field] || [];
  const normalizedAnswers: Record<string, any> = {};
  for (const [k, v] of Object.entries(answers)) {
    normalizedAnswers[normalize(k)] = v;
  }
  for (const alias of aliases) {
    const v = normalizedAnswers[normalize(alias)];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

function asString(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

function asBool(v: any): boolean {
  const s = asString(v)?.toLowerCase().trim();
  if (!s) return false;
  return ["yes", "y", "true", "1", "agree", "i agree", "accepted", "accept", "✓"].includes(s);
}

function asPermission(v: any): string {
  const s = asString(v)?.toLowerCase().trim();
  if (!s) return "unsure";
  if (s.startsWith("y")) return "yes";
  if (s.startsWith("n")) return "no";
  return "unsure";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Verify shared secret
  const secret = req.headers.get("x-webhook-secret");
  const expected = Deno.env.get("GOOGLE_FORM_WEBHOOK_SECRET");
  if (!expected || secret !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten() }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { source, submittedAt, answers } = parsed.data;

  // Always log raw payload first
  const email = asString(getAnswer(answers, "email"))?.toLowerCase().trim() ?? null;
  const { data: logRow, error: logErr } = await supabase
    .from("google_form_submissions")
    .insert({
      source,
      raw_payload: body,
      submitted_at: submittedAt || null,
      email,
      status: "received",
    })
    .select("id")
    .single();

  if (logErr) {
    console.error("Failed to insert log row:", logErr);
    // still return 200 to prevent Apps Script retries
    return new Response(JSON.stringify({ ok: false, error: "log_failed" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const logId = logRow.id;

  try {
    // Duplicate check
    if (email && submittedAt) {
      const { data: dup } = await supabase
        .from("google_form_submissions")
        .select("id")
        .eq("email", email)
        .eq("source", source)
        .eq("submitted_at", submittedAt)
        .eq("status", "ingested")
        .neq("id", logId)
        .maybeSingle();
      if (dup) {
        await supabase.from("google_form_submissions").update({
          status: "duplicate",
        }).eq("id", logId);
        return new Response(JSON.stringify({ ok: true, status: "duplicate" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Map fields
    const ownerName = asString(getAnswer(answers, "ownerName"));
    if (!email) throw new Error("Missing email in submission");
    if (!ownerName) throw new Error("Missing owner name in submission");

    const dogName = asString(getAnswer(answers, "dogName")) || "Unknown";
    const breed = asString(getAnswer(answers, "breed")) || "Unknown";
    const phone = asString(getAnswer(answers, "phone")) || "";
    const classType = asString(getAnswer(answers, "classType")) || "Puppy";

    // Resolve branch
    let branchId: string | null = null;
    const branchAnswer = asString(getAnswer(answers, "branch"));
    if (branchAnswer) {
      const { data: branches } = await supabase
        .from("branches").select("id, name").eq("is_active", true);
      const match = branches?.find((b) =>
        b.name.toLowerCase().includes(branchAnswer.toLowerCase()) ||
        branchAnswer.toLowerCase().includes(b.name.toLowerCase())
      );
      branchId = match?.id ?? null;
    }
    if (!branchId) {
      // fallback to first active branch
      const { data: defaultBranch } = await supabase
        .from("branches").select("id").eq("is_active", true).limit(1).maybeSingle();
      branchId = defaultBranch?.id ?? null;
    }

    const firstName = ownerName.split(" ")[0] || ownerName;
    const lastName = ownerName.split(" ").slice(1).join(" ") || "";

    // Find or create client by email
    let clientId: string;
    const { data: existing } = await supabase
      .from("clients").select("id").ilike("email", email).maybeSingle();

    if (existing) {
      clientId = existing.id;
      await supabase.from("clients").update({
        first_name: firstName, last_name: lastName, phone,
        occupation: asString(getAnswer(answers, "occupation")) || null,
        vet_name: asString(getAnswer(answers, "vetName")) || null,
        account_holder_name: asString(getAnswer(answers, "accountHolderName")) || null,
        branch_id: branchId,
      }).eq("id", clientId);
    } else {
      const { data: newClient, error: cErr } = await supabase.from("clients").insert({
        first_name: firstName, last_name: lastName, email, phone,
        occupation: asString(getAnswer(answers, "occupation")) || null,
        vet_name: asString(getAnswer(answers, "vetName")) || null,
        account_holder_name: asString(getAnswer(answers, "accountHolderName")) || null,
        branch_id: branchId, onboarding_status: "pending",
      }).select("id").single();
      if (cErr) throw new Error("Client insert failed: " + cErr.message);
      clientId = newClient.id;
      if (branchId) {
        await supabase.from("client_branches").insert({ client_id: clientId, branch_id: branchId });
      }
    }

    // Create dog
    const birthDateRaw = asString(getAnswer(answers, "birthDate"));
    const { data: newDog, error: dErr } = await supabase.from("dogs").insert({
      client_id: clientId,
      name: dogName, breed,
      date_of_birth: birthDateRaw && /^\d{4}-\d{2}-\d{2}/.test(birthDateRaw) ? birthDateRaw.slice(0, 10) : null,
      gender: asString(getAnswer(answers, "gender")) || null,
      spay_neuter_status: asString(getAnswer(answers, "spayNeuterStatus")) || null,
      acquired_from: asString(getAnswer(answers, "acquiredFrom")) || null,
      acquired_from_other: asString(getAnswer(answers, "acquiredFromOther")) || null,
      age_at_acquisition: asString(getAnswer(answers, "ageAtAcquisition")) || null,
      children_at_home: asString(getAnswer(answers, "childrenAtHome")) || null,
      social_behavior_details: asString(getAnswer(answers, "socialBehaviorDetails")) || null,
      training_goal: asString(getAnswer(answers, "trainingGoal")) || null,
      has_behavior_problems: asBool(getAnswer(answers, "hasBehaviorProblems")),
      behavior_problems_details: asString(getAnswer(answers, "behaviorProblemsDetails")) || null,
      has_health_problems: asBool(getAnswer(answers, "hasHealthProblems")),
      health_problems_details: asString(getAnswer(answers, "healthProblemsDetails")) || null,
    }).select("id").single();
    if (dErr) throw new Error("Dog insert failed: " + dErr.message);
    const dogId = newDog.id;

    // Enrollment registration
    const { data: enr, error: eErr } = await supabase.from("enrollment_registrations").insert({
      client_id: clientId, dog_id: dogId, branch_id: branchId,
      class_type: classType,
      whatsapp_permission: asPermission(getAnswer(answers, "whatsappPermission")),
      photo_permission: asPermission(getAnswer(answers, "photoPermission")),
      onlead_socializing_acknowledged: asBool(getAnswer(answers, "onleadSocializingAcknowledged")),
      equipment_supervision_acknowledged: asBool(getAnswer(answers, "equipmentSupervisionAcknowledged")),
      training_equipment_acknowledged: asBool(getAnswer(answers, "trainingEquipmentAcknowledged")),
      treats_acknowledged: asBool(getAnswer(answers, "treatsAcknowledged")),
      waste_disposal_acknowledged: asBool(getAnswer(answers, "wasteDisposalAcknowledged")),
      terms_agreed: asBool(getAnswer(answers, "termsAgreed")),
      privacy_policy_agreed: asBool(getAnswer(answers, "privacyPolicyAgreed")),
      signature_name: asString(getAnswer(answers, "signatureName")) || ownerName,
      signature_date: asString(getAnswer(answers, "signatureDate")) || new Date().toISOString().slice(0, 10),
      status: "submitted",
      submitted_at: submittedAt || new Date().toISOString(),
    }).select("id").single();
    if (eErr) throw new Error("Enrollment insert failed: " + eErr.message);

    // Update log row
    await supabase.from("google_form_submissions").update({
      status: "ingested",
      client_id: clientId,
      dog_ids: [dogId],
      enrollment_ids: [enr.id],
      branch_id: branchId,
    }).eq("id", logId);

    return new Response(JSON.stringify({
      ok: true, status: "ingested", clientId, dogId, enrollmentId: enr.id,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("google-form-intake ingest error:", err);
    await supabase.from("google_form_submissions").update({
      status: "failed",
      error_message: err?.message || String(err),
    }).eq("id", logId);
    // Return 200 anyway - raw is logged, no retries needed
    return new Response(JSON.stringify({ ok: false, status: "failed", error: err?.message }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

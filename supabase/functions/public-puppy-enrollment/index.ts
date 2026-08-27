import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRIVACY_NOTICE_VERSION = "2026-08-27";

const PayloadSchema = z.object({
  ownerName: z.string().min(2).max(200),
  accountHolderName: z.string().max(200).optional().nullable(),
  email: z.string().email().max(255),
  phone: z.string().min(5).max(50),
  occupation: z.string().max(200).optional().nullable(),
  vetName: z.string().min(1).max(200),

  dogName: z.string().min(1).max(100),
  birthDate: z.string().optional().nullable(),
  gender: z.string().max(20),
  breed: z.string().min(1).max(200),
  spayNeuterStatus: z.string().max(50),
  acquiredFrom: z.string().max(50),
  acquiredFromOther: z.string().max(200).optional().nullable(),
  ageAtAcquisition: z.string().max(50),

  otherPets: z.record(z.boolean()).default({}),
  childrenAtHome: z.string().max(50),
  socialBehavior: z.record(z.string()).default({}),
  socialBehaviorDetails: z.string().max(2000).optional().nullable(),

  trainingGoal: z.string().max(100),
  hasBehaviorProblems: z.boolean().default(false),
  behaviorProblemsDetails: z.string().max(2000).optional().nullable(),
  hasHealthProblems: z.boolean().default(false),
  healthProblemsDetails: z.string().max(2000).optional().nullable(),

  classType: z.string().max(50),
  classTypeOther: z.string().max(100).optional().nullable(),
  branchId: z.string().uuid(),
  heardFrom: z.record(z.boolean()).default({}),
  whatsappPermission: z.string().max(20),
  photoPermission: z.string().max(20),
  onleadSocializingAcknowledged: z.boolean(),
  equipmentSupervisionAcknowledged: z.boolean(),
  trainingEquipmentAcknowledged: z.boolean(),
  treatsAcknowledged: z.boolean(),
  wasteDisposalAcknowledged: z.boolean(),
  termsAgreed: z.boolean(),
  privacyPolicyAgreed: z.boolean(),
  signatureName: z.string().min(1).max(200),
  signatureDate: z.string().min(1).max(50),
  vetClearancePath: z.string().min(1).max(500),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const parsed = PayloadSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = parsed.data;
    if (!data.privacyPolicyAgreed || !data.termsAgreed) {
      return new Response(JSON.stringify({ error: "Privacy & terms must be accepted" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Anti-abuse: cap submissions per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentClient } = await supabase
      .from("clients").select("id").eq("email", data.email).maybeSingle();
    if (recentClient) {
      const { count } = await supabase
        .from("enrollment_registrations")
        .select("id", { count: "exact", head: true })
        .eq("client_id", recentClient.id)
        .gte("created_at", oneHourAgo);
      if ((count ?? 0) >= 3) {
        return new Response(JSON.stringify({ error: "Too many submissions. Please wait." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Keep only the object path. The bucket is private; authorised staff create
    // short-lived signed URLs when they need to view the document.
    if (!data.vetClearancePath.startsWith("public/")) {
      return new Response(JSON.stringify({ error: "Invalid document path" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const vetClearancePath = data.vetClearancePath;

    // Find or create client
    let clientId: string;
    const { data: existing } = await supabase
      .from("clients").select("id").eq("email", data.email).maybeSingle();

    const firstName = data.ownerName.split(" ")[0] || data.ownerName;
    const lastName = data.ownerName.split(" ").slice(1).join(" ") || "";

    if (existing) {
      clientId = existing.id;
      await supabase.from("clients").update({
        first_name: firstName, last_name: lastName, phone: data.phone,
        occupation: data.occupation || null, vet_name: data.vetName,
        account_holder_name: data.accountHolderName || null,
        onboarding_status: "completed",
      }).eq("id", clientId);
    } else {
      const { data: newClient, error: cErr } = await supabase.from("clients").insert({
        first_name: firstName, last_name: lastName, email: data.email, phone: data.phone,
        occupation: data.occupation || null, vet_name: data.vetName,
        account_holder_name: data.accountHolderName || null,
        branch_id: data.branchId, onboarding_status: "completed",
      }).select("id").single();
      if (cErr) throw new Error("Failed to create handler: " + cErr.message);
      clientId = newClient.id;
      await supabase.from("client_branches").insert({ client_id: clientId, branch_id: data.branchId });
    }

    // Create dog
    const { data: newDog, error: dErr } = await supabase.from("dogs").insert({
      client_id: clientId,
      name: data.dogName, breed: data.breed,
      date_of_birth: data.birthDate || null, gender: data.gender,
      spay_neuter_status: data.spayNeuterStatus, acquired_from: data.acquiredFrom,
      acquired_from_other: data.acquiredFrom === "Other" ? (data.acquiredFromOther || null) : null,
      age_at_acquisition: data.ageAtAcquisition,
      other_pets: data.otherPets, children_at_home: data.childrenAtHome,
      social_behavior: data.socialBehavior,
      social_behavior_details: data.socialBehaviorDetails || null,
      training_goal: data.trainingGoal,
      has_behavior_problems: data.hasBehaviorProblems,
      behavior_problems_details: data.hasBehaviorProblems ? (data.behaviorProblemsDetails || null) : null,
      has_health_problems: data.hasHealthProblems,
      health_problems_details: data.hasHealthProblems ? (data.healthProblemsDetails || null) : null,
    }).select("id").single();
    if (dErr) throw new Error("Failed to create dog: " + dErr.message);
    const dogId = newDog.id;

    // Create enrollment registration
    const { data: enr, error: eErr } = await supabase.from("enrollment_registrations").insert({
      client_id: clientId, dog_id: dogId, branch_id: data.branchId,
      class_type: data.classType,
      class_type_other: data.classType === "Other" ? (data.classTypeOther || null) : null,
      heard_from: data.heardFrom,
      whatsapp_permission: data.whatsappPermission,
      photo_permission: data.photoPermission,
      onlead_socializing_acknowledged: data.onleadSocializingAcknowledged,
      equipment_supervision_acknowledged: data.equipmentSupervisionAcknowledged,
      training_equipment_acknowledged: data.trainingEquipmentAcknowledged,
      treats_acknowledged: data.treatsAcknowledged,
      waste_disposal_acknowledged: data.wasteDisposalAcknowledged,
      terms_agreed: data.termsAgreed,
      privacy_policy_agreed: data.privacyPolicyAgreed,
      privacy_notice_version: PRIVACY_NOTICE_VERSION,
      privacy_notice_accepted_at: new Date().toISOString(),
      vet_clearance_url: vetClearancePath,
      signature_name: data.signatureName,
      signature_date: data.signatureDate,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    }).select("id").single();
    if (eErr) throw new Error("Failed to create enrollment: " + eErr.message);

    // Resolve branch info for emails
    const { data: branch } = await supabase
      .from("branches").select("name, email").eq("id", data.branchId).maybeSingle();
    const branchName = branch?.name || "McKaynine";
    const adminEmail = branch?.email;

    const handlerHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
        <h2 style="color:#2563eb;">Thanks, ${escapeHtml(firstName)}!</h2>
        <p>We've received your puppy class registration for <strong>${escapeHtml(data.dogName)}</strong> at our ${escapeHtml(branchName)} branch.</p>
        <p>One of our team will be in touch shortly to confirm class dates and next steps.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="font-size:13px;color:#666;"><strong>Class type:</strong> ${escapeHtml(data.classType)}<br/>
        <strong>Dog:</strong> ${escapeHtml(data.dogName)} (${escapeHtml(data.breed)})</p>
        <p style="font-size:12px;color:#999;margin-top:30px;">— McKaynine Training Centre</p>
      </div>`;

    await supabase.from("email_queue").insert({
      branch_id: data.branchId,
      to_email: data.email,
      subject: `We've received your registration for ${data.dogName}`,
      html_content: handlerHtml,
      handler_id: clientId,
      status: "pending",
    });

    if (adminEmail) {
      const adminHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
          <h2 style="color:#2563eb;">New Public Registration</h2>
          <p>A new handler has registered via the public puppy class form.</p>
          <table style="border-collapse:collapse;width:100%;font-size:14px;">
            <tr><td style="padding:6px;border-bottom:1px solid #eee;"><strong>Owner</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${escapeHtml(data.ownerName)}</td></tr>
            <tr><td style="padding:6px;border-bottom:1px solid #eee;"><strong>Email</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${escapeHtml(data.email)}</td></tr>
            <tr><td style="padding:6px;border-bottom:1px solid #eee;"><strong>Phone</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${escapeHtml(data.phone)}</td></tr>
            <tr><td style="padding:6px;border-bottom:1px solid #eee;"><strong>Dog</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${escapeHtml(data.dogName)} (${escapeHtml(data.breed)})</td></tr>
            <tr><td style="padding:6px;border-bottom:1px solid #eee;"><strong>Class</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${escapeHtml(data.classType)}</td></tr>
            <tr><td style="padding:6px;border-bottom:1px solid #eee;"><strong>Branch</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${escapeHtml(branchName)}</td></tr>
          </table>
          <p style="font-size:12px;color:#999;margin-top:24px;">Open the admin portal to review the private vet-clearance document and assign this handler to a class.</p>
        </div>`;
      await supabase.from("email_queue").insert({
        branch_id: data.branchId,
        to_email: adminEmail,
        subject: `New puppy class registration: ${data.ownerName} / ${data.dogName}`,
        html_content: adminHtml,
        status: "pending",
      });
    }

    return new Response(JSON.stringify({ success: true, clientId, dogId, enrollmentId: enr.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("public-puppy-enrollment error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]!));
}

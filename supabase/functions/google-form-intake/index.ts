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
// Includes Shannon's exact phrasing as well as generic fallbacks.
const FIELD_ALIASES: Record<string, string[]> = {
  ownerName: [
    "your name and surname", "owner name", "your name", "full name",
    "name", "handler name", "parent name",
  ],
  accountHolderName: [
    "name of person responsible for account (if different to above)",
    "name of person responsible for account",
    "account holder name", "account holder", "billing name",
  ],
  email: ["email", "email address", "your email", "e-mail"],
  phone: [
    "your cell number", "phone", "phone number", "cell", "cellphone",
    "mobile", "contact number",
  ],
  occupation: ["occupation (optional)", "occupation", "job", "profession"],
  vetName: [
    "what is the name/location of your vet",
    "what is the name or location of your vet",
    "vet name", "vet", "veterinarian", "vet practice", "veterinary practice",
  ],

  dogName: [
    "your dog's name", "dog name", "puppy name", "dog's name", "puppy's name",
  ],
  birthDate: [
    "what is your dog's date of birth",
    "date of birth", "dog date of birth", "puppy date of birth", "dob", "birthday",
  ],
  gender: [
    "is your dog a he-dog or a she-dog",
    "gender", "dog gender", "sex",
  ],
  spayNeuterStatus: [
    "what's the scoop on your dog's repro status",
    "whats the scoop on your dog's repro status",
    "spayed/neutered", "spayed or neutered", "spay/neuter status",
    "sterilised", "sterilized",
  ],
  breed: [
    "what's your dog's breed? are they a purebred or a wonderful mix of various breeds",
    "what's your dog's breed",
    "breed", "dog breed", "puppy breed",
  ],
  acquiredFrom: [
    "it's useful to us to know the origin story of your dog. how did you and fido cross paths",
    "how did you and fido cross paths",
    "acquired from", "where did you get your dog", "where did you get your puppy", "source",
  ],
  acquiredFromOther: ["acquired from other", "if other, where"],
  ageAtAcquisition: [
    "how old was your pup/dog when they came to you",
    "age at acquisition", "age when you got your dog", "age when you got your puppy",
  ],

  otherPets: [
    "does your dog have any animal buddies at home",
    "other pets", "any other pets",
  ],
  childrenAtHome: [
    "are there any young 'uns running around with your dog at home",
    "are there any young uns running around with your dog at home",
    "children at home", "kids at home", "do you have children",
  ],
  socialBehavior: [
    "how does your dog get along with different types of...",
    "how does your dog get along with different types of",
    "social behaviour", "social behavior",
  ],
  socialBehaviorDetails: [
    "if you chose \"not a fan\" please give us a little more detail so that we can make sure your dog is a happy camper...",
    "if you chose not a fan please give us a little more detail so that we can make sure your dog is a happy camper",
    "if you chose not a fan please give us a little more detail",
    "social behaviour details", "social behavior details", "behaviour details",
  ],

  trainingGoal: [
    "what's the grand plan for your dog with these training classes",
    "whats the grand plan for your dog with these training classes",
    "training goal", "what do you want to achieve", "goal",
  ],
  hasBehaviorProblems: [
    "does your dog have any behavior problems we should know about before we dive into training",
    "does your dog have any behaviour problems we should know about before we dive into training",
    "any behaviour problems", "any behavior problems", "behaviour problems",
  ],
  behaviorProblemsDetails: [
    "if you answered \"yep\" on the previous question, what's the scoop? understanding their behavior better will help us tailor our training approach. if you answered \"nope\" skip right ahead...",
    "if you answered yep on the previous question, what's the scoop",
    "behaviour problems details", "behavior problems details", "describe behaviour problems",
  ],
  healthProblemsDetails: [
    "to make sure your dog loves their training with us, tell us this... are there any health issues we need to be aware of",
    "are there any health issues we need to be aware of",
    "any health problems", "health problems", "health problems details",
  ],

  classType: [
    "which course are you enrolling your dog for",
    "class type", "which class", "course", "class",
  ],
  heardFrom: [
    "where did you hear about our classes? (tick any that apply)",
    "where did you hear about our classes",
    "heard from", "how did you hear about us",
  ],
  vaccinationUpload: [
    "please upload your pup's vaccination card: front showing the vet practice and inside showing your pup's details and vaccination details. sometimes the forms get iffy on uploads - if this happens, don't stress - just pop it in an email to us --> delta@mckaynine.co.za your pup's health comes first - that's why we insist on the most recent vaccine being administered by a vet-professional",
    "please upload your pup's vaccination card",
    "vaccination card", "vet clearance", "vaccination upload",
  ],

  whatsappPermission: [
    "do you give us permission to add your name and number to a whatsapp class group? (this group is used purely for urgent notifications iro classes. once you have completed your training with us your details are removed)",
    "do you give us permission to add your name and number to a whatsapp class group",
    "whatsapp permission", "whatsapp",
  ],
  photoPermission: [
    "do you give us permission to post graduation or class photographs of you, your dog and any minors in your care at the time on our social media",
    "photo permission", "photos",
  ],

  acknowledgementsGrid: [
    "we're almost done",
    "were almost done",
  ],
  termsAgreed: [
    "one last thing...",
    "one last thing",
    "i affirm that i voluntarily agree to the mckaynine terms & conditions",
    "terms agreed", "i agree to the terms", "terms and conditions",
  ],
  privacyPolicyAgreed: ["privacy policy agreed", "i agree to the privacy policy", "privacy policy"],
  signatureName: ["signature name", "signed by", "signature"],
  signatureDate: ["signature date", "date signed"],

  // Reserved (Shannon's current form does not ask): branch is derived from `source`
  branch: ["branch", "location", "which branch"],
};

// Acknowledgement-grid row labels (Google's grid sends row -> chosen column).
// We treat any non-empty value as "agreed".
const ACK_ROW_TO_FIELD: Array<[RegExp, string]> = [
  [/onlead\s+socialis/i, "onleadSocializingAcknowledged"],
  [/training\s+equipment\s+without\s+instructor/i, "equipmentSupervisionAcknowledged"],
  [/correct\s+training\s+equipment/i, "trainingEquipmentAcknowledged"],
  [/training\s+treats/i, "treatsAcknowledged"],
  [/waste\s+disposal/i, "wasteDisposalAcknowledged"],
];

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

function asArray(v: any): string[] {
  if (v === undefined || v === null || v === "") return [];
  if (Array.isArray(v)) return v.map(String);
  // Google sometimes joins multi-select with ", "
  return String(v).split(/,\s*/).filter(Boolean);
}

function asBool(v: any): boolean {
  const s = asString(v)?.toLowerCase().trim();
  if (!s) return false;
  return ["yes", "y", "true", "1", "agree", "i agree", "accepted", "accept", "yep", "✓"].includes(s);
}

function asPermission(v: any): string {
  const s = asString(v)?.toLowerCase().trim();
  if (!s) return "unsure";
  if (s.startsWith("y")) return "yes";
  if (s.startsWith("n")) return "no";
  return "unsure";
}

// ---------- Shannon-specific value normalisers ----------

function mapGender(v: any): string | null {
  const s = asString(v)?.toLowerCase().trim();
  if (!s) return null;
  if (s.includes("she")) return "Female";
  if (s.includes("he")) return "Male";
  if (s === "male" || s === "female") return s[0].toUpperCase() + s.slice(1);
  return null;
}

function mapSpayNeuter(v: any): string | null {
  const s = asString(v)?.toLowerCase() ?? "";
  if (!s) return null;
  if (s.includes("too young") || s.includes("intend") || s.includes("when old enough")) return "When old enough";
  if (s.includes("already") || s.includes("done") || s.includes("spayed") || s.includes("neutered")) return "Already done";
  if (s.includes("not planning") || s.includes("no plan") || s.includes("won't")) return "Not planning to";
  return null;
}

function mapAcquiredFrom(v: any): string | null {
  const s = asString(v)?.toLowerCase() ?? "";
  if (!s) return null;
  if (s.includes("kusa")) return "KUSA breeder";
  if (s.includes("breeder")) return "Breeder";
  if (s.includes("spca") || s.includes("aacl")) return "SPCA/AACL";
  if (s.includes("rescue")) return "Rescue org";
  if (s.includes("family") || s.includes("friend")) return "Family/friends";
  if (s.includes("advert")) return "Advert";
  if (s.includes("born")) return "Born in home";
  if (s.includes("stray")) return "Stray";
  return "Other";
}

function mapAgeAtAcquisition(v: any): string | null {
  const s = asString(v)?.toLowerCase() ?? "";
  if (!s) return null;
  if (s.includes("less than 2")) return "Less than 2 months";
  if (s.includes("2") && s.includes("4")) return "2-4 months";
  if (s.includes("4") && (s.includes("12") || s.includes("year"))) return "4-12 months";
  if (s.includes("older than")) return "Older than 1 year";
  return null;
}

function mapOtherPets(v: any): Record<string, boolean> {
  const arr = asArray(v).map((x) => x.toLowerCase());
  const has = (kw: string) => arr.some((x) => x.includes(kw));
  return {
    dogs: has("dog"),
    cats: has("cat"),
    birds: has("bird"),
    livestock: has("livestock"),
    none: has("none"),
  };
}

function mapChildrenAtHome(v: any): string | null {
  const s = asString(v)?.toLowerCase() ?? "";
  if (!s) return null;
  if (s.includes("nope") || s.includes("none")) return "None";
  if (s.includes("teen")) return "Teenagers";
  if (s.includes("teeny ones less than") || s.includes("less than 2") || s.includes("baby") || s.includes("toddler")) {
    return "Babies/toddlers";
  }
  if (s.includes("3") || s.includes("not so") || s.includes("child")) return "Children";
  return null;
}

function mapHeardFrom(v: any): Record<string, boolean> {
  const arr = asArray(v).map((x) => x.toLowerCase());
  const has = (kw: string) => arr.some((x) => x.includes(kw));
  return {
    google: has("google") || has("search"),
    vet: has("vet"),
    friends: has("friend") || has("family"),
    breeder: has("breeder") || has("rescue"),
    beenBefore: has("previous") || has("been before"),
    socialMedia: has("social") || has("facebook") || has("instagram"),
  };
}

function mapTrainingGoal(v: any): string {
  const s = asString(v)?.toLowerCase().trim() ?? "";
  const n = parseInt(s, 10);
  if (!isNaN(n)) {
    return n <= 2 ? "Competitive dog sport" : "Chilled canine companion";
  }
  if (s.includes("competitive") || s.includes("sport")) return "Competitive dog sport";
  return "Chilled canine companion";
}

function mapBehaviorYepNope(v: any): boolean {
  const s = asString(v)?.toLowerCase().trim() ?? "";
  if (!s) return false;
  return s.startsWith("y"); // yep / yes
}

function mapHealthText(v: any): { has: boolean; details: string | null } {
  const raw = asString(v)?.trim() ?? "";
  if (!raw) return { has: false, details: null };
  const lower = raw.toLowerCase();
  const negatives = ["no", "nope", "none", "n/a", "na", "no health issues", "nothing", "no problems"];
  if (negatives.includes(lower)) return { has: false, details: null };
  return { has: true, details: raw };
}

function mapClassType(v: any): { type: string; other?: string } {
  const s = asString(v)?.toLowerCase() ?? "";
  if (!s) return { type: "Puppy" };
  if (s.includes("puppy")) return { type: "Puppy" };
  if (s.includes("elementary")) return { type: "Elementary" };
  if (s.includes("bronze")) return { type: "CGC Bronze" };
  if (s.includes("obedience")) return { type: "Obedience" };
  if (s.includes("yoga")) return { type: "Other", other: "K9 Yoga" };
  return { type: "Other", other: asString(v) };
}

// Parse social grid: Google sends row->column as separate keys. We pull
// answers for our 4 rows directly from raw answers via prefix matching.
function extractSocialGrid(answers: Record<string, any>): {
  dogs: string; animals: string; people: string; sights: string;
} {
  const mapVal = (raw: any): string => {
    const s = asString(raw)?.toLowerCase() ?? "";
    if (s.includes("cool") || s.includes("cucumber") || s.includes("great")) return "Great";
    if (s.includes("mostly") || s.includes("ok")) return "OK";
    if (s.includes("not a fan") || s.includes("not good")) return "Not good";
    return "";
  };
  const findRow = (label: RegExp): any => {
    for (const [k, v] of Object.entries(answers)) {
      if (label.test(k)) return v;
    }
    return undefined;
  };
  return {
    dogs: mapVal(findRow(/get along.*\[\s*dogs\s*\]|^dogs\b|\bdogs\s*$/i)),
    animals: mapVal(findRow(/\banimals\b/i)),
    people: mapVal(findRow(/\bpeople\b/i)),
    sights: mapVal(findRow(/sights/i)),
  };
}

// Pull acknowledgement grid answers. Same approach: each row is its own answer.
function extractAcknowledgements(answers: Record<string, any>): Record<string, boolean> {
  const out: Record<string, boolean> = {
    onleadSocializingAcknowledged: false,
    equipmentSupervisionAcknowledged: false,
    trainingEquipmentAcknowledged: false,
    treatsAcknowledged: false,
    wasteDisposalAcknowledged: false,
  };
  for (const [k, v] of Object.entries(answers)) {
    const hasValue = !!asString(v)?.trim();
    if (!hasValue) continue;
    for (const [rx, field] of ACK_ROW_TO_FIELD) {
      if (rx.test(k)) { out[field] = true; break; }
    }
  }
  return out;
}

// Branch resolution from `source` (e.g. "delta", "randburg", "honeydew", "mobility").
async function resolveBranchFromSource(supabase: any, source: string): Promise<string | null> {
  const { data: branches } = await supabase
    .from("branches").select("id, name").eq("is_active", true);
  if (!branches?.length) return null;
  const s = source.toLowerCase().trim();
  const match = branches.find((b: any) => b.name.toLowerCase().includes(s) || s.includes(b.name.toLowerCase()));
  return match?.id ?? null;
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
        await supabase.from("google_form_submissions").update({ status: "duplicate" }).eq("id", logId);
        return new Response(JSON.stringify({ ok: true, status: "duplicate" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const ownerName = asString(getAnswer(answers, "ownerName"));
    if (!email) throw new Error("Missing email in submission");
    if (!ownerName) throw new Error("Missing owner name in submission");

    const dogName = asString(getAnswer(answers, "dogName")) || "Unknown";
    const breed = asString(getAnswer(answers, "breed")) || "Unknown";
    const phone = asString(getAnswer(answers, "phone")) || "";

    // Resolve branch: explicit `branch` answer first, then `source`, then default.
    let branchId: string | null = null;
    const branchAnswer = asString(getAnswer(answers, "branch"));
    if (branchAnswer) {
      branchId = await resolveBranchFromSource(supabase, branchAnswer);
    }
    if (!branchId && source) {
      branchId = await resolveBranchFromSource(supabase, source);
    }
    if (!branchId) {
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

    // ---- Normalised dog fields ----
    const birthDateRaw = asString(getAnswer(answers, "birthDate"));
    const birthDateISO = birthDateRaw
      ? (/^\d{4}-\d{2}-\d{2}/.test(birthDateRaw)
          ? birthDateRaw.slice(0, 10)
          // dd/mm/yyyy → yyyy-mm-dd
          : (/^(\d{2})\/(\d{2})\/(\d{4})$/.test(birthDateRaw)
              ? birthDateRaw.replace(/^(\d{2})\/(\d{2})\/(\d{4})$/, "$3-$2-$1")
              : null))
      : null;

    const social = extractSocialGrid(answers);
    const socialDetailsRaw = asString(getAnswer(answers, "socialBehaviorDetails")) || "";
    const socialDetails = social.sights
      ? `${socialDetailsRaw}${socialDetailsRaw ? " | " : ""}Sights and sounds: ${social.sights}`.trim()
      : socialDetailsRaw || null;

    const health = mapHealthText(getAnswer(answers, "healthProblemsDetails"));

    const { data: newDog, error: dErr } = await supabase.from("dogs").insert({
      client_id: clientId,
      name: dogName, breed,
      date_of_birth: birthDateISO,
      gender: mapGender(getAnswer(answers, "gender")),
      spay_neuter_status: mapSpayNeuter(getAnswer(answers, "spayNeuterStatus")),
      acquired_from: mapAcquiredFrom(getAnswer(answers, "acquiredFrom")),
      acquired_from_other: asString(getAnswer(answers, "acquiredFromOther")) || null,
      age_at_acquisition: mapAgeAtAcquisition(getAnswer(answers, "ageAtAcquisition")),
      other_pets: mapOtherPets(getAnswer(answers, "otherPets")),
      children_at_home: mapChildrenAtHome(getAnswer(answers, "childrenAtHome")),
      social_behavior: { dogs: social.dogs, animals: social.animals, people: social.people },
      social_behavior_details: socialDetails,
      training_goal: mapTrainingGoal(getAnswer(answers, "trainingGoal")),
      has_behavior_problems: mapBehaviorYepNope(getAnswer(answers, "hasBehaviorProblems")),
      behavior_problems_details: asString(getAnswer(answers, "behaviorProblemsDetails")) || null,
      has_health_problems: health.has,
      health_problems_details: health.details,
    }).select("id").single();
    if (dErr) throw new Error("Dog insert failed: " + dErr.message);
    const dogId = newDog.id;

    // ---- Enrollment ----
    const { type: classType, other: classTypeOther } = mapClassType(getAnswer(answers, "classType"));
    const acks = extractAcknowledgements(answers);
    const vetClearanceUrl = asString(getAnswer(answers, "vaccinationUpload")) || null;

    const { data: enr, error: eErr } = await supabase.from("enrollment_registrations").insert({
      client_id: clientId, dog_id: dogId, branch_id: branchId,
      class_type: classType,
      class_type_other: classTypeOther || null,
      heard_from: mapHeardFrom(getAnswer(answers, "heardFrom")),
      whatsapp_permission: asPermission(getAnswer(answers, "whatsappPermission")),
      photo_permission: asPermission(getAnswer(answers, "photoPermission")),
      vet_clearance_url: vetClearanceUrl,
      onlead_socializing_acknowledged: acks.onleadSocializingAcknowledged,
      equipment_supervision_acknowledged: acks.equipmentSupervisionAcknowledged,
      training_equipment_acknowledged: acks.trainingEquipmentAcknowledged,
      treats_acknowledged: acks.treatsAcknowledged,
      waste_disposal_acknowledged: acks.wasteDisposalAcknowledged,
      terms_agreed: !!asString(getAnswer(answers, "termsAgreed"))?.trim() ||
        asBool(getAnswer(answers, "termsAgreed")),
      // Form's preamble says "By submitting this form you agree to our Privacy Policy"
      privacy_policy_agreed: true,
      signature_name: asString(getAnswer(answers, "signatureName")) || ownerName,
      signature_date: asString(getAnswer(answers, "signatureDate"))
        || (submittedAt ? submittedAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
      status: "submitted",
      submitted_at: submittedAt || new Date().toISOString(),
    }).select("id").single();
    if (eErr) throw new Error("Enrollment insert failed: " + eErr.message);

    await supabase.from("google_form_submissions").update({
      status: "ingested",
      client_id: clientId,
      dog_ids: [dogId],
      enrollment_ids: [enr.id],
      branch_id: branchId,
    }).eq("id", logId);

    return new Response(JSON.stringify({
      ok: true, status: "ingested", clientId, dogId, enrollmentId: enr.id, branchId,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("google-form-intake ingest error:", err);
    await supabase.from("google_form_submissions").update({
      status: "failed",
      error_message: err?.message || String(err),
    }).eq("id", logId);
    return new Response(JSON.stringify({ ok: false, status: "failed", error: err?.message }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

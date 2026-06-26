import { supabase } from "@/integrations/supabase/client";
import { ExtractedData } from "@/components/intake-scans/types";

export interface SaveEnrollmentResult {
  clientId: string;
  dogIds: string[];
  enrollmentIds: string[];
  branchId: string | null;
}

/**
 * Shared save path for any enrollment submission that has been
 * normalised into the ExtractedData shape (intake-scans + google-form review).
 *
 * Finds-or-creates the client, inserts dogs, inserts enrollment_registrations.
 * Does NOT touch the source-specific log table.
 */
export async function saveEnrollmentSubmission(
  extracted: ExtractedData
): Promise<SaveEnrollmentResult> {
  const { owner, dogs } = extracted;

  if (!owner?.email) throw new Error("Missing owner email");
  const email = owner.email.toLowerCase().trim();

  // Load active branches once
  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .eq("is_active", true)
    .limit(50);

  const resolveBranchId = (name: string | undefined): string | undefined => {
    if (!name || !branches) return branches?.[0]?.id;
    const needle = name.toLowerCase().trim();
    const match = branches.find(
      (b) =>
        b.name.toLowerCase().includes(needle) ||
        needle.includes(b.name.toLowerCase())
    );
    return match?.id ?? branches?.[0]?.id;
  };

  // Determine default branch from first dog (used for client.branch_id)
  const defaultBranchId = resolveBranchId(dogs[0]?.branch_name);

  // Find or create client
  let clientId: string;
  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingClient) {
    clientId = existingClient.id;
    await supabase
      .from("clients")
      .update({
        first_name: owner.first_name || undefined,
        last_name: owner.last_name || undefined,
        account_holder_name: owner.account_holder_name || undefined,
        phone: owner.phone || undefined,
        occupation: owner.occupation || undefined,
        vet_name: owner.vet_name || undefined,
        branch_id: defaultBranchId,
        onboarding_status: "completed",
      })
      .eq("id", clientId);
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert({
        first_name: owner.first_name || "Unknown",
        last_name: owner.last_name || "Handler",
        email,
        account_holder_name: owner.account_holder_name,
        phone: owner.phone,
        occupation: owner.occupation,
        vet_name: owner.vet_name,
        branch_id: defaultBranchId,
        onboarding_status: "completed",
      })
      .select("id")
      .single();
    if (clientError) throw clientError;
    clientId = newClient.id;
  }

  const dogIds: string[] = [];
  const enrollmentIds: string[] = [];

  for (const dog of dogs) {
    const branchId = resolveBranchId(dog.branch_name);

    const { data: newDog, error: dogError } = await supabase
      .from("dogs")
      .insert({
        client_id: clientId,
        name: dog.name || "Unknown",
        breed: dog.breed || "Unknown",
        date_of_birth: dog.date_of_birth || null,
        gender: dog.gender || null,
        spay_neuter_status: dog.spay_neuter_status || null,
        acquired_from: dog.acquired_from || null,
        acquired_from_other: dog.acquired_from_other || null,
        age_at_acquisition: dog.age_at_acquisition || null,
        other_pets: dog.other_pets || [],
        children_at_home: dog.children_at_home || null,
        social_behavior: dog.social_behavior || {},
        training_goal: dog.training_goal || null,
        has_behavior_problems: dog.has_behavior_problems || false,
        behavior_problems_details: dog.behavior_problems_details || null,
        has_health_problems: dog.has_health_problems || false,
        health_problems_details: dog.health_problems_details || null,
      })
      .select("id")
      .single();
    if (dogError) throw dogError;
    dogIds.push(newDog.id);

    if (!branchId) continue;
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollment_registrations")
      .insert({
        client_id: clientId,
        dog_id: newDog.id,
        branch_id: branchId,
        class_type: dog.class_type || "Puppy",
        class_type_other: dog.class_type_other || null,
        heard_from: dog.heard_from || [],
        whatsapp_permission: dog.whatsapp_permission || "unsure",
        photo_permission: dog.photo_permission || "unsure",
        training_equipment_acknowledged:
          dog.acknowledgements?.training_equipment || false,
        treats_acknowledged: dog.acknowledgements?.treats || false,
        waste_disposal_acknowledged:
          dog.acknowledgements?.waste_disposal || false,
        onlead_socializing_acknowledged:
          dog.acknowledgements?.onlead_socializing || false,
        equipment_supervision_acknowledged:
          dog.acknowledgements?.equipment_supervision || false,
        signature_name: dog.signature_name || null,
        signature_date: dog.signature_date || null,
        privacy_policy_agreed: true,
        terms_agreed: true,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (enrollmentError) {
      console.error("Enrollment insert error:", enrollmentError);
      continue;
    }
    enrollmentIds.push(enrollment.id);
  }

  return { clientId, dogIds, enrollmentIds, branchId: defaultBranchId ?? null };
}

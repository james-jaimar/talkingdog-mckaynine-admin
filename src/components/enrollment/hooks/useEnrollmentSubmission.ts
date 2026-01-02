import { supabase } from "@/integrations/supabase/client";
import { FullEnrollmentFormValues } from "../types";

interface SubmissionResult {
  clientId: string;
  dogId: string;
  enrollmentId: string;
}

export function useEnrollmentSubmission() {
  
  const uploadVetClearance = async (file: File): Promise<string> => {
    // Get current user for folder-based separation (compliance/security)
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    
    if (!userId) {
      throw new Error("User must be authenticated to upload documents");
    }
    
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("vet-clearance-docs")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload vet clearance document");
    }

    // Since bucket is private, we need to generate a signed URL for admin access
    // Store the path for later retrieval by admins
    const { data: urlData } = supabase.storage
      .from("vet-clearance-docs")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const findOrCreateClient = async (
    data: FullEnrollmentFormValues,
    branchId: string
  ): Promise<{ id: string; isNew: boolean }> => {
    // Get current user for auth_user_id linking
    const { data: authData } = await supabase.auth.getUser();
    const authUserId = authData?.user?.id;
    
    // Check if client with email already exists
    const { data: existingClient, error: checkError } = await supabase
      .from("clients")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking for existing client:", checkError);
      throw new Error("Failed to check for existing client");
    }

    if (existingClient) {
      // Update existing client with new details and mark onboarding complete
      const { error: updateError } = await supabase
        .from("clients")
        .update({
          first_name: data.ownerName.split(" ")[0] || data.ownerName,
          last_name: data.ownerName.split(" ").slice(1).join(" ") || "",
          phone: data.phone,
          occupation: data.occupation || null,
          vet_name: data.vetName,
          account_holder_name: data.accountHolderName || null,
          auth_user_id: authUserId || undefined,
          onboarding_status: 'completed',
        })
        .eq("id", existingClient.id);

      if (updateError) {
        console.error("Error updating client:", updateError);
        throw new Error("Failed to update client details");
      }

      console.log("Updated existing client:", existingClient.id);
      return { id: existingClient.id, isNew: false };
    }

    // Create new client
    const clientData = {
      first_name: data.ownerName.split(" ")[0] || data.ownerName,
      last_name: data.ownerName.split(" ").slice(1).join(" ") || "",
      email: data.email,
      phone: data.phone,
      occupation: data.occupation || null,
      vet_name: data.vetName,
      account_holder_name: data.accountHolderName || null,
      branch_id: branchId,
      auth_user_id: authUserId || undefined,
      onboarding_status: 'completed',
    };

    const { data: newClient, error: insertError } = await supabase
      .from("clients")
      .insert(clientData)
      .select("id")
      .single();

    if (insertError) {
      console.error("Error creating client:", insertError);
      throw new Error(`Failed to create client: ${insertError.message}`);
    }

    console.log("Created new client:", newClient.id);
    return { id: newClient.id, isNew: true };
  };

  const createDog = async (
    data: FullEnrollmentFormValues,
    clientId: string
  ): Promise<string> => {
    const dogData = {
      client_id: clientId,
      name: data.dogName,
      breed: data.breed,
      date_of_birth: data.birthDate || null,
      gender: data.gender,
      spay_neuter_status: data.spayNeuterStatus,
      acquired_from: data.acquiredFrom,
      acquired_from_other: data.acquiredFrom === "Other" ? data.acquiredFromOther : null,
      age_at_acquisition: data.ageAtAcquisition,
      other_pets: data.otherPets,
      children_at_home: data.childrenAtHome,
      social_behavior: data.socialBehavior,
      social_behavior_details: data.socialBehaviorDetails || null,
      training_goal: data.trainingGoal,
      has_behavior_problems: data.hasBehaviorProblems,
      behavior_problems_details: data.hasBehaviorProblems ? data.behaviorProblemsDetails : null,
      has_health_problems: data.hasHealthProblems,
      health_problems_details: data.hasHealthProblems ? data.healthProblemsDetails : null,
    };

    const { data: newDog, error } = await supabase
      .from("dogs")
      .insert(dogData)
      .select("id")
      .single();

    if (error) {
      console.error("Error creating dog:", error);
      throw new Error(`Failed to create dog: ${error.message}`);
    }

    console.log("Created dog:", newDog.id);
    return newDog.id;
  };

  const createEnrollmentRegistration = async (
    data: FullEnrollmentFormValues,
    clientId: string,
    dogId: string,
    vetClearanceUrl: string
  ): Promise<string> => {
    const enrollmentData = {
      client_id: clientId,
      dog_id: dogId,
      branch_id: data.branchId,
      class_type: data.classType,
      class_type_other: data.classType === "Other" ? data.classTypeOther : null,
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
      vet_clearance_url: vetClearanceUrl,
      signature_name: data.signatureName,
      signature_date: data.signatureDate,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    };

    const { data: enrollment, error } = await supabase
      .from("enrollment_registrations")
      .insert(enrollmentData)
      .select("id")
      .single();

    if (error) {
      console.error("Error creating enrollment registration:", error);
      throw new Error(`Failed to create enrollment: ${error.message}`);
    }

    console.log("Created enrollment registration:", enrollment.id);
    return enrollment.id;
  };

  const completeOnboarding = async (clientId: string): Promise<void> => {
    // Get current user
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    
    if (!userId) {
      console.log("No authenticated user, skipping onboarding completion");
      return;
    }

    // Update handler_onboarding status
    const { error } = await supabase
      .from("handler_onboarding")
      .update({
        status: 'completed',
        client_id: clientId,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating handler onboarding:", error);
      // Don't throw - this is a non-critical update
    } else {
      console.log("Handler onboarding marked as completed");
    }
  };

  const submitEnrollment = async (
    data: FullEnrollmentFormValues,
    vetClearanceFile: File
  ): Promise<SubmissionResult> => {
    console.log("Starting enrollment submission...");

    // 1. Upload vet clearance document
    const vetClearanceUrl = await uploadVetClearance(vetClearanceFile);
    console.log("Vet clearance uploaded:", vetClearanceUrl);

    // 2. Find or create client (also updates onboarding_status)
    const { id: clientId } = await findOrCreateClient(data, data.branchId);

    // 3. Create dog record
    const dogId = await createDog(data, clientId);

    // 4. Create enrollment registration
    const enrollmentId = await createEnrollmentRegistration(
      data,
      clientId,
      dogId,
      vetClearanceUrl
    );

    // 5. Complete onboarding tracking
    await completeOnboarding(clientId);

    return { clientId, dogId, enrollmentId };
  };

  return { submitEnrollment };
}

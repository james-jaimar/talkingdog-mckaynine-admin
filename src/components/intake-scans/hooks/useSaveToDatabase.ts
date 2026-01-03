import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExtractedData, ScanProcessingJob } from "../types";
import { toast } from "sonner";

interface SaveResult {
  clientId: string;
  dogIds: string[];
  enrollmentIds: string[];
}

export function useSaveToDatabase() {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async ({ job, extractedData }: { job: ScanProcessingJob; extractedData: ExtractedData }): Promise<SaveResult> => {
      const { owner, dogs } = extractedData;
      
      // Get the default branch
      const { data: branches } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true)
        .limit(10);
      
      // Find or create client by email
      let clientId: string;
      
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', owner.email.toLowerCase().trim())
        .maybeSingle();
      
      if (existingClient) {
        // Update existing client
        clientId = existingClient.id;
        await supabase
          .from('clients')
          .update({
            first_name: owner.first_name || undefined,
            last_name: owner.last_name || undefined,
            account_holder_name: owner.account_holder_name || undefined,
            phone: owner.phone || undefined,
            occupation: owner.occupation || undefined,
            vet_name: owner.vet_name || undefined,
            onboarding_status: 'completed'
          })
          .eq('id', clientId);
      } else {
        // Create new client
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            first_name: owner.first_name || 'Unknown',
            last_name: owner.last_name || 'Handler',
            email: owner.email.toLowerCase().trim(),
            account_holder_name: owner.account_holder_name,
            phone: owner.phone,
            occupation: owner.occupation,
            vet_name: owner.vet_name,
            onboarding_status: 'completed'
          })
          .select('id')
          .single();
        
        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      // Create dogs
      const dogIds: string[] = [];
      const enrollmentIds: string[] = [];

      for (const dog of dogs) {
        // Find matching branch
        let branchId = branches?.[0]?.id;
        if (dog.branch_name && branches) {
          const matchingBranch = branches.find(b => 
            b.name.toLowerCase().includes(dog.branch_name.toLowerCase()) ||
            dog.branch_name.toLowerCase().includes(b.name.toLowerCase())
          );
          if (matchingBranch) branchId = matchingBranch.id;
        }

        // Create dog record
        const { data: newDog, error: dogError } = await supabase
          .from('dogs')
          .insert({
            client_id: clientId,
            name: dog.name || 'Unknown',
            breed: dog.breed || 'Unknown',
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
            health_problems_details: dog.health_problems_details || null
          })
          .select('id')
          .single();
        
        if (dogError) throw dogError;
        dogIds.push(newDog.id);

        // Create enrollment registration
        if (branchId) {
          const { data: enrollment, error: enrollmentError } = await supabase
            .from('enrollment_registrations')
            .insert({
              client_id: clientId,
              dog_id: newDog.id,
              branch_id: branchId,
              class_type: dog.class_type || 'Puppy',
              class_type_other: dog.class_type_other || null,
              heard_from: dog.heard_from || [],
              whatsapp_permission: dog.whatsapp_permission || 'unsure',
              photo_permission: dog.photo_permission || 'unsure',
              training_equipment_acknowledged: dog.acknowledgements?.training_equipment || false,
              treats_acknowledged: dog.acknowledgements?.treats || false,
              waste_disposal_acknowledged: dog.acknowledgements?.waste_disposal || false,
              onlead_socializing_acknowledged: dog.acknowledgements?.onlead_socializing || false,
              equipment_supervision_acknowledged: dog.acknowledgements?.equipment_supervision || false,
              signature_name: dog.signature_name || null,
              signature_date: dog.signature_date || null,
              privacy_policy_agreed: true,
              terms_agreed: true,
              status: 'submitted',
              submitted_at: new Date().toISOString()
            })
            .select('id')
            .single();
          
          if (enrollmentError) {
            console.error('Enrollment error:', enrollmentError);
          } else {
            enrollmentIds.push(enrollment.id);
          }
        }
      }

      // Update the job with saved IDs
      await supabase
        .from('scan_processing_jobs')
        .update({
          status: 'saved',
          matched_client_id: clientId,
          created_dog_ids: dogIds,
          enrollment_ids: enrollmentIds
        })
        .eq('id', job.id);

      return { clientId, dogIds, enrollmentIds };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['scan-processing-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['handlers'] });
      toast.success(`Saved: 1 handler, ${result.dogIds.length} dog(s), ${result.enrollmentIds.length} enrollment(s)`);
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast.error(`Failed to save: ${error.message}`);
    }
  });

  return {
    saveToDatabase: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending
  };
}


import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useBranch } from "@/context/BranchContext";
import { formSchema, type FormValues } from "../form/handlerAddFormSchema";

export function useAddHandlerForm(onSuccess: () => void) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      dogName: "",
      breed: "",
      dogDob: "",
      assessment: "",
      comments: "",
      whatsApp: false,
      photoPermission: false,
      classEnrollment: "",
      puppyClass: "",
      eoClass: "",
      bronzeCgcClass: "",
      silverCgcClass: "",
      beginnerNoviceClass: "",
      wtClass: "",
      yogaClass: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    console.log("Form submitted with data:", data);

    try {
      // Check if the currentBranch exists
      if (!currentBranch?.id) {
        toast({
          title: "Error",
          description: "No branch selected. Please select a branch to add a handler.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Check if client with this email already exists
      console.log("Checking if client exists with email:", data.email);
      const { data: existingClient, error: checkError } = await supabase
        .from("clients")
        .select("id")
        .eq("email", data.email)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing client:", checkError);
        throw new Error(`Error checking existing client: ${checkError.message}`);
      }

      if (existingClient) {
        console.log("Client already exists:", existingClient);
        toast({
          title: "Client already exists",
          description: "A client with this email already exists.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      console.log("Creating new client with branch ID:", currentBranch.id);
      // Insert client data with branch_id
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .insert({
          first_name: data.name,
          last_name: "", // Empty last name field
          email: data.email,
          phone: data.phone || null,
          notes: data.comments || null,
          branch_id: currentBranch.id
        })
        .select("id")
        .single();

      if (clientError) {
        console.error("Client insertion error:", clientError);
        throw new Error(`Failed to create client: ${clientError.message}`);
      }

      console.log("Client created successfully:", clientData);

      if (!clientData?.id) {
        throw new Error("Client was created but no ID was returned");
      }

      // Insert dog data
      const dogData = {
        name: data.dogName,
        breed: data.breed,
        client_id: clientData.id,
        behavior_notes: data.assessment || null,
        notes: data.dogDob ? `DOB: ${data.dogDob}` : null,
      };
      
      console.log("Inserting dog data:", dogData);
      
      const { data: dogData2, error: dogError } = await supabase
        .from("dogs")
        .insert(dogData)
        .select("id")
        .single();

      if (dogError) {
        console.error("Dog insertion error:", dogError);
        throw new Error(`Failed to create dog: ${dogError.message}`);
      }

      console.log("Dog created successfully:", dogData2);

      if (!dogData2?.id) {
        throw new Error("Dog was created but no ID was returned");
      }

      // Insert class enrollment data only if at least one class has data
      const enrollmentData = {
        dog_id: dogData2.id,
        puppy_class: data.puppyClass || null,
        eo_class: data.eoClass || null,
        bronze_cgc_class: data.bronzeCgcClass || null,
        silver_cgc_class: data.silverCgcClass || null,
        beginner_novice_class: data.beginnerNoviceClass || null,
        wt_class: data.wtClass || null,
        yoga_class: data.yogaClass || null
      };

      const hasClasses = Object.entries(enrollmentData).some(
        ([key, value]) => key !== 'dog_id' && value !== null && value !== ''
      );

      if (hasClasses) {
        console.log("Inserting class enrollment data:", enrollmentData);
        
        const { error: enrollmentError } = await supabase
          .from("class_enrollments")
          .insert(enrollmentData);

        if (enrollmentError) {
          console.error("Enrollment error:", enrollmentError);
          // We don't throw here as this is optional data
          toast({
            title: "Warning",
            description: "Handler and dog created, but there was an issue with class enrollments.",
            variant: "default",
          });
        } else {
          console.log("Class enrollment created successfully");
        }
      }

      // Create notes for WhatsApp and photo permission
      let notes = data.comments || "";
      if (data.whatsApp) {
        notes += (notes ? "\n" : "") + "WhatsApp: yes";
      }
      if (data.photoPermission) {
        notes += (notes ? "\n" : "") + "Photo Permission: yes";
      }

      if (notes && notes !== data.comments) {
        // Update client with the notes
        const { error: updateError } = await supabase
          .from("clients")
          .update({ notes })
          .eq("id", clientData.id);

        if (updateError) {
          console.error("Error updating notes:", updateError);
          // We don't throw as this is just updating additional info
        }
      }

      console.log("Handler creation complete, refreshing data");
      
      // Force immediate data refresh
      await queryClient.invalidateQueries({ queryKey: ["handlers"] });
      
      toast({
        title: "Handler added successfully",
        description: "The new handler and dog have been added to the system.",
      });

      // Reset form
      form.reset();
      
      console.log("Calling onSuccess to close modal");
      // Close the modal
      onSuccess();
    } catch (error: any) {
      console.error("Error adding handler:", error);
      toast({
        title: "Failed to add handler",
        description: error.message || "There was an error adding the handler. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    form,
    isSubmitting,
    onSubmit
  };
}


import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { HandlerPersonalInfoFields } from "./form/HandlerPersonalInfoFields";
import { DogInfoFields } from "./form/DogInfoFields";
import { ClassAndPreferencesFields } from "./form/ClassAndPreferencesFields";
import { Separator } from "@/components/ui/separator";
import { useBranch } from "@/context/BranchContext";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  dogName: z.string().min(1, {
    message: "Dog name is required.",
  }),
  breed: z.string().min(1, {
    message: "Breed is required.",
  }),
  dogDob: z.string().optional(),
  assessment: z.string().optional(),
  comments: z.string().optional(),
  whatsApp: z.boolean().default(false),
  photoPermission: z.boolean().default(false),
  classEnrollment: z.string().optional(),
  puppyClass: z.string().optional(),
  eoClass: z.string().optional(),
  bronzeCgcClass: z.string().optional(),
  silverCgcClass: z.string().optional(),
  beginnerNoviceClass: z.string().optional(),
  wtClass: z.string().optional(),
  yogaClass: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddHandlerFormProps {
  onSuccess: () => void;
}

export function AddHandlerForm({ onSuccess }: AddHandlerFormProps) {
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
      // Insert client data with branch_id
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .insert({
          first_name: data.name,
          last_name: "", // Empty last name field
          email: data.email,
          phone: data.phone || null,
          notes: data.comments || null,
          branch_id: currentBranch?.id || null
        })
        .select("id")
        .single();

      if (clientError) {
        console.error("Client error:", clientError);
        throw clientError;
      }

      console.log("Client created successfully:", clientData);

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
        console.error("Dog error:", dogError);
        throw dogError;
      }

      console.log("Dog created successfully:", dogData2);

      // Insert class enrollment data
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

      // Only insert if at least one class has data
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
          throw enrollmentError;
        }

        console.log("Class enrollment created successfully");
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
        }
      }

      toast({
        title: "Handler added successfully",
        description: "The new handler and dog have been added to the system.",
      });

      // Reset form
      form.reset();

      // Refresh the handlers list
      queryClient.invalidateQueries({ queryKey: ["handlers"] });
      
      // Close the modal
      onSuccess();
    } catch (error) {
      console.error("Error adding handler:", error);
      toast({
        title: "Failed to add handler",
        description: "There was an error adding the handler. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h3 className="text-lg font-medium mb-4">Handler Information</h3>
          <HandlerPersonalInfoFields control={form.control} />
        </div>
        
        <Separator className="my-6" />
        
        <div>
          <h3 className="text-lg font-medium mb-4">Dog Information</h3>
          <DogInfoFields control={form.control} />
        </div>
        
        <Separator className="my-6" />
        
        <div>
          <h3 className="text-lg font-medium mb-4">Class & Preferences</h3>
          <ClassAndPreferencesFields control={form.control} />
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            variant="mckaynine"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding Handler..." : "Add Handler"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

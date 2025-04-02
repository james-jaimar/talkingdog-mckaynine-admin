
import { supabase } from "@/integrations/supabase/client";
import { FormValues } from "../../form/handlerAddFormSchema";
import { useToast } from "@/hooks/use-toast";

export const useEnrollmentCreation = () => {
  const { toast } = useToast();

  const createEnrollment = async (data: FormValues, dogId: string): Promise<void> => {
    // Insert class enrollment data only if at least one class has data
    const enrollmentData = {
      dog_id: dogId,
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
  };

  return { createEnrollment };
};


import { supabase } from "@/integrations/supabase/client";
import { FormValues } from "../../form/handlerAddFormSchema";
import { useToast } from "@/hooks/use-toast";

export const useEnrollmentCreation = () => {
  const { toast } = useToast();

  const createEnrollment = async (data: FormValues, dogId: string): Promise<void> => {
    try {
      // Insert class enrollment data only if at least one class has data
      const enrollmentData = {
        dog_id: dogId,
        puppy_class: data.puppyClass || null,
        eo_class: data.eoClass || null,
        bronze_cgc_class: data.bronzeCgcClass || null,
        silver_cgc_class: data.silverCgcClass || null,
        beginner_novice_class: data.beginnerNoviceClass || null,
        wt_class: data.wtClass || null,
        a_test_class: data.aTestClass || null,
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
          // We notify about enrollment issues but don't throw since this is optional data
          if (enrollmentError.code === "23503") {
            toast({
              title: "Warning",
              description: "Handler and dog created, but unable to save class enrollments. The dog record may have issues.",
              variant: "default",
            });
          } else if (enrollmentError.code === "23505") {
            toast({
              title: "Warning",
              description: "Handler and dog created, but there was a duplicate enrollment issue.",
              variant: "default",
            });
          } else {
            toast({
              title: "Warning", 
              description: `Handler and dog created, but there was an issue with class enrollments: ${enrollmentError.message}`,
              variant: "default",
            });
          }
        } else {
          console.log("Class enrollment created successfully");
        }
      }
    } catch (error: any) {
      console.error("Enrollment creation failed:", error);
      // We don't throw here as enrollment is considered optional data
      toast({
        title: "Warning",
        description: `Handler and dog created, but there was an unexpected issue with class enrollments: ${error.message}`,
        variant: "default",
      });
    }
  };

  return { createEnrollment };
};

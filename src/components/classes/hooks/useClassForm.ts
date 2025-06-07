
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Class } from "../types/class";
import { classFormSchema, ClassFormValues, CLASS_TYPES } from "../schemas/classFormSchema";
import { ClassWithSchedules } from "./types/class-with-schedules";
import { useTerm } from "@/context/TermContext";
import { useNavigate } from "react-router-dom";
import {
  showClassCreatedToast,
  showClassUpdatedToast,
  showClassErrorToast
} from "./utils/toast-actions";

// Branch option type
type BranchOption = {
  label: string;
  value: string;
};

// Define a union type that can be either Class or ClassWithSchedules
type ClassData = Class | ClassWithSchedules;

interface UseClassFormProps {
  classData: ClassData | null;
  onSuccess?: () => void;
}

export function useClassForm({ classData, onSuccess }: UseClassFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const queryClient = useQueryClient();
  const { termData } = useTerm(); // Get current term context
  const navigate = useNavigate();
  
  // Pre-populate form with class data or set defaults
  const defaultValues: ClassFormValues = classData
    ? {
        name: classData.name || "",
        description: classData.description || "",
        class_type: (classData.class_type && CLASS_TYPES.includes(classData.class_type as any)) 
          ? classData.class_type as typeof CLASS_TYPES[number]
          : "Puppy",
        course_fee: typeof classData.course_fee === 'number' ? classData.course_fee : 
                    parseFloat(String(classData.course_fee)) || 0,
        enrollment_fee: typeof classData.enrollment_fee === 'number' ? classData.enrollment_fee : 
                        parseFloat(String(classData.enrollment_fee)) || 0,
        mckaynine_commission_type: classData.mckaynine_commission_type || "percentage",
        mckaynine_commission_value: typeof classData.mckaynine_commission_value === 'number' ? classData.mckaynine_commission_value :
                                  parseFloat(String(classData.mckaynine_commission_value)) || 0,
        admin_fee_type: classData.admin_fee_type || "percentage",
        admin_fee_value: typeof classData.admin_fee_value === 'number' ? classData.admin_fee_value :
                        parseFloat(String(classData.admin_fee_value)) || 0,
        trainer_fee_type: classData.trainer_fee_type || "percentage",
        trainer_fee_value: typeof classData.trainer_fee_value === 'number' ? classData.trainer_fee_value :
                          parseFloat(String(classData.trainer_fee_value)) || 0,
        duration: typeof classData.duration === 'number' ? classData.duration :
                 parseInt(String(classData.duration)) || 60,
        capacity: typeof classData.capacity === 'number' ? classData.capacity :
                 parseInt(String(classData.capacity)) || 8,
        branchId: classData.branch_id || "",
      }
    : {
        name: "",
        description: "",
        class_type: "Puppy",
        course_fee: 0,
        enrollment_fee: 0,
        mckaynine_commission_type: "percentage",
        mckaynine_commission_value: 0,
        admin_fee_type: "percentage",
        admin_fee_value: 0,
        trainer_fee_type: "percentage",
        trainer_fee_value: 0,
        duration: 60,
        capacity: 8,
        branchId: "",
      };
  
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues,
  });

  // Make sure form gets updated if classData changes
  useEffect(() => {
    if (classData) {
      form.reset({
        name: classData.name || "",
        description: classData.description || "",
        class_type: (classData.class_type && CLASS_TYPES.includes(classData.class_type as any)) 
          ? classData.class_type as typeof CLASS_TYPES[number]
          : "Puppy",
        course_fee: typeof classData.course_fee === 'number' ? classData.course_fee : 
                    parseFloat(String(classData.course_fee)) || 0,
        enrollment_fee: typeof classData.enrollment_fee === 'number' ? classData.enrollment_fee : 
                        parseFloat(String(classData.enrollment_fee)) || 0,
        mckaynine_commission_type: classData.mckaynine_commission_type || "percentage",
        mckaynine_commission_value: typeof classData.mckaynine_commission_value === 'number' ? classData.mckaynine_commission_value :
                                  parseFloat(String(classData.mckaynine_commission_value)) || 0,
        admin_fee_type: classData.admin_fee_type || "percentage",
        admin_fee_value: typeof classData.admin_fee_value === 'number' ? classData.admin_fee_value :
                        parseFloat(String(classData.admin_fee_value)) || 0,
        trainer_fee_type: classData.trainer_fee_type || "percentage",
        trainer_fee_value: typeof classData.trainer_fee_value === 'number' ? classData.trainer_fee_value :
                          parseFloat(String(classData.trainer_fee_value)) || 0,
        duration: typeof classData.duration === 'number' ? classData.duration :
                parseInt(String(classData.duration)) || 60,
        capacity: typeof classData.capacity === 'number' ? classData.capacity :
                parseInt(String(classData.capacity)) || 8,
        branchId: classData.branch_id || "",
      });
    }
  }, [classData, form]);
  
  // Fetch branches for dropdown
  useEffect(() => {
    const fetchBranches = async () => {
      setIsLoadingBranches(true);
      try {
        const { data, error } = await supabase
          .from("branches")
          .select("id, name")
          .order("name");
        
        if (error) {
          throw error;
        }
        
        if (data && Array.isArray(data)) {
          const branchOptions = data.map(branch => ({
            value: branch.id,
            label: branch.name
          }));
          
          setBranches(branchOptions);
        } else {
          setBranches([]);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
        toast({
          title: "Failed to load branches",
          description: "Please try again or contact support.",
          variant: "destructive",
        });
        setBranches([]);
      } finally {
        setIsLoadingBranches(false);
      }
    };
    
    fetchBranches();
  }, []);
  
  const onSubmit = async (values: ClassFormValues) => {
    setIsSubmitting(true);
    console.log("Submitting form with values:", values);
    
    // Add validation for branch ID
    if (!values.branchId) {
      toast({
        title: "Branch is required",
        description: "Please select a branch for this class.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Log if we have termData available
    console.log("Current termData during class submission:", termData);
    
    try {
      let classId: string;
      
      if (classData) {
        // Update existing class
        const { data: updatedClass, error } = await supabase
          .from("classes")
          .update({
            name: values.name,
            description: values.description,
            class_type: values.class_type,
            course_fee: values.course_fee,
            enrollment_fee: values.enrollment_fee,
            mckaynine_commission_type: values.mckaynine_commission_type,
            mckaynine_commission_value: values.mckaynine_commission_value, 
            admin_fee_type: values.admin_fee_type,
            admin_fee_value: values.admin_fee_value,
            trainer_fee_type: values.trainer_fee_type,
            trainer_fee_value: values.trainer_fee_value,
            duration: values.duration,
            capacity: values.capacity,
            branch_id: values.branchId,
          })
          .eq("id", classData.id)
          .select()
          .single();
        
        if (error) throw error;
        classId = classData.id;
        
        showClassUpdatedToast(values.name);
      } else {
        // Create new class
        console.log("Creating new class with branch:", values.branchId);
        const { data: newClass, error } = await supabase
          .from("classes")
          .insert({
            name: values.name,
            description: values.description,
            class_type: values.class_type,
            course_fee: values.course_fee,
            enrollment_fee: values.enrollment_fee,
            mckaynine_commission_type: values.mckaynine_commission_type,
            mckaynine_commission_value: values.mckaynine_commission_value, 
            admin_fee_type: values.admin_fee_type,
            admin_fee_value: values.admin_fee_value,
            trainer_fee_type: values.trainer_fee_type,
            trainer_fee_value: values.trainer_fee_value,
            duration: values.duration,
            capacity: values.capacity,
            branch_id: values.branchId,
            // Removed term_id as it doesn't exist in classes table
          })
          .select()
          .single();
        
        if (error) {
          console.error("Database error creating class:", error);
          throw error;
        }
        
        if (!newClass) {
          throw new Error("Failed to retrieve the newly created class data");
        }
        
        classId = newClass.id;
        console.log("Successfully created class with ID:", classId);
        
        // Show success toast
        showClassCreatedToast(values.name, classId);
        
        // Navigate to schedule creation page after a short delay
        // This is where the term association will happen correctly, through class_schedules.term_id
        console.log(`Will navigate to schedule creation for class ${classId} in 500ms`);
        setTimeout(() => {
          navigate(`/classes/${classId}/schedules`);
        }, 500);
      }
      
      // Invalidate all class-related queries to ensure UI is updated
      console.log("Invalidating class queries...");
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      
      // If a term is selected, also invalidate any term-specific queries
      if (termData?.id) {
        console.log(`Invalidating term-specific queries for term ${termData.id}...`);
        await queryClient.invalidateQueries({ 
          queryKey: ["classes", termData.id]
        });
      }
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        console.log("Calling onSuccess callback");
        onSuccess();
      }
      
    } catch (error) {
      console.error("Error saving class:", error);
      showClassErrorToast(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    form,
    isSubmitting,
    branches,
    isLoadingBranches,
    onSubmit
  };
}

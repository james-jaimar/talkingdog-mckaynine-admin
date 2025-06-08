
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
  const { termData } = useTerm();
  const navigate = useNavigate();
  
  // Pre-populate form with class data or set defaults
  const defaultValues: ClassFormValues = classData
    ? {
        name: classData.name || "",
        description: classData.description || "",
        class_type: (classData.class_type && CLASS_TYPES.includes(classData.class_type as any)) 
          ? classData.class_type as typeof CLASS_TYPES[number]
          : "Puppy",
        course_fee: Number(classData.course_fee) || 0,
        enrollment_fee: Number(classData.enrollment_fee) || 0,
        mckaynine_commission_type: classData.mckaynine_commission_type || "percentage",
        mckaynine_commission_value: Number(classData.mckaynine_commission_value) || 0,
        admin_fee_type: classData.admin_fee_type || "percentage",
        admin_fee_value: Number(classData.admin_fee_value) || 0,
        trainer_fee_type: classData.trainer_fee_type || "percentage",
        trainer_fee_value: Number(classData.trainer_fee_value) || 0,
        duration: Number(classData.duration) || 60,
        capacity: Number(classData.capacity) || 8,
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

  // Update form when classData changes
  useEffect(() => {
    if (classData) {
      const updateValues: ClassFormValues = {
        name: classData.name || "",
        description: classData.description || "",
        class_type: (classData.class_type && CLASS_TYPES.includes(classData.class_type as any)) 
          ? classData.class_type as typeof CLASS_TYPES[number]
          : "Puppy",
        course_fee: Number(classData.course_fee) || 0,
        enrollment_fee: Number(classData.enrollment_fee) || 0,
        mckaynine_commission_type: classData.mckaynine_commission_type || "percentage",
        mckaynine_commission_value: Number(classData.mckaynine_commission_value) || 0,
        admin_fee_type: classData.admin_fee_type || "percentage",
        admin_fee_value: Number(classData.admin_fee_value) || 0,
        trainer_fee_type: classData.trainer_fee_type || "percentage",
        trainer_fee_value: Number(classData.trainer_fee_value) || 0,
        duration: Number(classData.duration) || 60,
        capacity: Number(classData.capacity) || 8,
        branchId: classData.branch_id || "",
      };
      form.reset(updateValues);
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
        
        if (error) throw error;
        
        const branchOptions = data?.map(branch => ({
          value: branch.id,
          label: branch.name
        })) || [];
        
        setBranches(branchOptions);
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
    
    // Validate branch ID
    if (!values.branchId) {
      toast({
        title: "Branch is required",
        description: "Please select a branch for this class.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const classPayload = {
        name: values.name,
        description: values.description || null,
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
      };

      console.log("Submitting class payload:", classPayload);
      
      if (classData) {
        // Update existing class
        const { data: updatedClass, error } = await supabase
          .from("classes")
          .update(classPayload)
          .eq("id", classData.id)
          .select()
          .single();
        
        if (error) throw error;
        showClassUpdatedToast(values.name);
      } else {
        // Create new class
        const { data: newClass, error } = await supabase
          .from("classes")
          .insert(classPayload)
          .select()
          .single();
        
        if (error) {
          console.error("Database error creating class:", error);
          throw error;
        }
        
        if (!newClass) {
          throw new Error("Failed to retrieve the newly created class data");
        }
        
        console.log("Successfully created class:", newClass);
        showClassCreatedToast(values.name, newClass.id);
        
        // Navigate to schedule creation after a short delay
        setTimeout(() => {
          navigate(`/classes/${newClass.id}/schedules`);
        }, 500);
      }
      
      // Invalidate queries to refresh UI
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      
      if (termData?.id) {
        await queryClient.invalidateQueries({ 
          queryKey: ["classes", termData.id]
        });
      }
      
      // Call success callback
      if (onSuccess) {
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

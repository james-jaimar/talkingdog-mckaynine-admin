
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useBranch } from "@/context/BranchContext";
import { supabase } from "@/integrations/supabase/client";
import { EditClassForm } from "./EditClassForm";
import { Class } from "./types/class";

interface EditClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData: Class;
  onSuccess?: () => void;
}

export function EditClassModal({ open, onOpenChange, classData, onSuccess }: EditClassModalProps) {
  const [processedClassData, setProcessedClassData] = useState<Class | null>(null);
  const [branchName, setBranchName] = useState<string | null>(null);
  
  // Fetch the branch name when the modal opens
  useEffect(() => {
    if (open && classData && classData.branch_id) {
      const fetchBranchName = async () => {
        const { data, error } = await supabase
          .from('branches')
          .select('name')
          .eq('id', classData.branch_id)
          .single();
        
        if (data && !error) {
          setBranchName(data.name);
        } else {
          console.error("Error fetching branch name:", error);
        }
      };
      
      fetchBranchName();
    }
  }, [open, classData]);

  // Process class data when the modal opens or classData changes
  useEffect(() => {
    if (open && classData) {
      console.log("EditClassModal - Processing class data:", classData);
      
      // Create a copy of classData with properly typed fee values
      const processedData: Class = {
        ...classData,
        // Ensure numeric values are properly parsed
        course_fee: typeof classData.course_fee === 'number' ? classData.course_fee : 
                   parseFloat(String(classData.course_fee)) || 0,
        enrollment_fee: typeof classData.enrollment_fee === 'number' ? classData.enrollment_fee : 
                       parseFloat(String(classData.enrollment_fee)) || 0,
        mckaynine_commission_value: typeof classData.mckaynine_commission_value === 'number' ? classData.mckaynine_commission_value :
                                  parseFloat(String(classData.mckaynine_commission_value)) || 0,
        admin_fee_value: typeof classData.admin_fee_value === 'number' ? classData.admin_fee_value :
                        parseFloat(String(classData.admin_fee_value)) || 0,
        trainer_fee_value: typeof classData.trainer_fee_value === 'number' ? classData.trainer_fee_value :
                          parseFloat(String(classData.trainer_fee_value)) || 0,
        // Ensure proper types for enum fields
        mckaynine_commission_type: classData.mckaynine_commission_type || 'percentage',
        admin_fee_type: classData.admin_fee_type || 'percentage',
        trainer_fee_type: classData.trainer_fee_type || 'percentage',
      };
      
      console.log("EditClassModal - Processed class data:", processedData);
      setProcessedClassData(processedData);
    }
  }, [open, classData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
          <DialogDescription>
            Make changes to your class here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        {processedClassData && (
          <EditClassForm 
            classData={processedClassData}
            currentBranchName={branchName}
            onSuccess={onSuccess} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

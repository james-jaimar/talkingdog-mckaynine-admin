
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type BranchOption = {
  label: string;
  value: string;
};

export function useBranchOptions() {
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);

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

  return { branches, isLoadingBranches };
}

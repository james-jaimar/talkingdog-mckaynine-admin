
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BranchOption } from "./types";

export function useBranches() {
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  
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

  return { branches, isLoadingBranches };
}


import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Branch {
  id: string;
  name: string;
}

interface BranchContextType {
  branches: Branch[];
  currentBranch: Branch | null;
  setCurrentBranch: (branch: Branch | null) => void;
  isLoading: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  
  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches-basic'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data as Branch[];
    }
  });

  // Set first branch as default when branches load if none is selected
  useEffect(() => {
    if (branches && branches.length > 0 && !currentBranch) {
      // Try to load from localStorage first
      const savedBranchId = localStorage.getItem('currentBranchId');
      if (savedBranchId) {
        const savedBranch = branches.find(branch => branch.id === savedBranchId);
        if (savedBranch) {
          setCurrentBranch(savedBranch);
          return;
        }
      }
      
      // Default to first branch if no saved branch
      setCurrentBranch(branches[0]);
    }
  }, [branches, currentBranch]);

  // Save selected branch to localStorage when it changes
  useEffect(() => {
    if (currentBranch) {
      localStorage.setItem('currentBranchId', currentBranch.id);
    }
  }, [currentBranch]);

  return (
    <BranchContext.Provider 
      value={{ 
        branches: branches || [], 
        currentBranch, 
        setCurrentBranch,
        isLoading
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
}

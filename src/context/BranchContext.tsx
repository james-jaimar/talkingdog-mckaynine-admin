
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  const [currentBranch, setCurrentBranchState] = useState<Branch | null>(null);
  
  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches-basic'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error("Error fetching branches:", error);
        throw error;
      }
      
      console.log("Fetched branches:", data);
      return data as Branch[];
    }
  });

  // Wrapped setCurrentBranch to ensure localStorage is updated
  const setCurrentBranch = useCallback((branch: Branch | null) => {
    console.log("Setting current branch to:", branch?.name);
    setCurrentBranchState(branch);
    
    if (branch) {
      localStorage.setItem('currentBranchId', branch.id);
      console.log("Saved branch ID to localStorage:", branch.id);
    }
  }, []);

  // Set first branch as default when branches load if none is selected
  useEffect(() => {
    if (branches && branches.length > 0 && !currentBranch) {
      console.log("No current branch, trying to load from localStorage or set default");
      
      // Try to load from localStorage first
      const savedBranchId = localStorage.getItem('currentBranchId');
      if (savedBranchId) {
        const savedBranch = branches.find(branch => branch.id === savedBranchId);
        if (savedBranch) {
          console.log("Using branch from localStorage:", savedBranch.name);
          setCurrentBranchState(savedBranch);
          return;
        }
      }
      
      // Default to first branch if no saved branch
      console.log("Using default branch:", branches[0].name);
      setCurrentBranchState(branches[0]);
      localStorage.setItem('currentBranchId', branches[0].id);
    }
  }, [branches, currentBranch]);

  const contextValue = {
    branches: branches || [], 
    currentBranch, 
    setCurrentBranch,
    isLoading
  };

  return (
    <BranchContext.Provider value={contextValue}>
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

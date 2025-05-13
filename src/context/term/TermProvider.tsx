
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TermData } from "./types";
import { useTermQuery } from "./useTermQuery";
import { useTermSelection } from "./useTermSelection";
import { useTermCacheInvalidation } from "./useTermCacheInvalidation";

type TermContextType = {
  termData: TermData | null;
  loading: boolean;
  error: Error | null;
  refreshTerms: () => void;
  selectTerm: (termId: string | null) => void;
  availableTerms: TermData[];
};

const TermContext = createContext<TermContextType | undefined>(undefined);

export const TermProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const { termQuery, availableTerms, refreshTerms } = useTermQuery();
  const { selectTerm } = useTermSelection({ setSelectedTermId });
  
  // Use the cache invalidation hook
  useTermCacheInvalidation();
  
  // Effect to select current term on initial load or when terms change
  useEffect(() => {
    if (availableTerms.length > 0 && !selectedTermId) {
      // Find current term or first available term
      const currentTerm = availableTerms.find(term => term.current) || availableTerms[0];
      if (currentTerm) {
        setSelectedTermId(currentTerm.id);
      }
    }
  }, [availableTerms, selectedTermId]);

  // Get the data for the selected term
  const termData = selectedTermId
    ? availableTerms.find(term => term.id === selectedTermId) || null
    : availableTerms.find(term => term.current) || availableTerms[0] || null;

  return (
    <TermContext.Provider
      value={{
        termData,
        loading: termQuery.isPending,
        error: termQuery.error as Error | null,
        refreshTerms,
        selectTerm,
        availableTerms,
      }}
    >
      {children}
    </TermContext.Provider>
  );
};

export const useTerm = (): TermContextType => {
  const context = useContext(TermContext);
  if (context === undefined) {
    throw new Error("useTerm must be used within a TermProvider");
  }
  return context;
};

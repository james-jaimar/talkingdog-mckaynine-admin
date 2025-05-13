
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TermData, TermNumber } from "./types";
import { useTermQuery } from "./useTermQuery";
import { useTermCacheInvalidation } from "./useTermCacheInvalidation";

type TermContextType = {
  termData: TermData | null;
  loading: boolean;
  error: Error | null;
  refreshTerms: () => void;
  selectTerm: (termId: string | null) => void;
  availableTerms: TermData[];
  // Additional fields needed by components
  isTermLoading: boolean;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedTermNumber: TermNumber;
  setSelectedTermNumber: (termNumber: TermNumber) => void;
  years: number[];
  terms: TermNumber[];
  refetchTerm: () => void;
  termDateRange: { startDate: string; endDate: string } | null;
};

const TermContext = createContext<TermContextType | undefined>(undefined);

export const TermProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedTermNumber, setSelectedTermNumber] = useState<TermNumber>("1");
  
  const { termQuery, availableTerms, refreshTerms } = useTermQuery();
  
  // Use the cache invalidation hook
  useTermCacheInvalidation();
  
  // Effect to select current term on initial load or when terms change
  useEffect(() => {
    if (availableTerms.length > 0 && !selectedTermId) {
      // Find current term or first available term
      const currentTerm = availableTerms.find(term => term.current) || availableTerms[0];
      if (currentTerm) {
        setSelectedTermId(currentTerm.id);
        setSelectedYear(currentTerm.year);
        setSelectedTermNumber(currentTerm.termNumber as TermNumber);
      }
    }
  }, [availableTerms, selectedTermId]);

  // Calculate date range for selected term
  const termDateRange = termData ? {
    startDate: termData.startDate,
    endDate: termData.endDate
  } : null;

  // Get the data for the selected term
  const termData = selectedTermId
    ? availableTerms.find(term => term.id === selectedTermId) || null
    : availableTerms.find(term => term.current) || availableTerms[0] || null;

  // Get available years and terms for the selector
  const years = Array.from(
    new Set(availableTerms.map(term => term.year))
  ).sort((a, b) => b - a); // Sort descending

  const terms: TermNumber[] = ["1", "2", "3", "4"];

  // Select a term by ID
  const selectTerm = (termId: string | null) => {
    setSelectedTermId(termId);
    if (termId) {
      const term = availableTerms.find(t => t.id === termId);
      if (term) {
        setSelectedYear(term.year);
        setSelectedTermNumber(term.termNumber as TermNumber);
      }
    }
  };

  return (
    <TermContext.Provider
      value={{
        termData,
        loading: termQuery.isPending,
        isTermLoading: termQuery.isPending,
        error: termQuery.error as Error | null,
        refreshTerms,
        refetchTerm: refreshTerms,
        selectTerm,
        availableTerms,
        selectedYear,
        setSelectedYear,
        selectedTermNumber,
        setSelectedTermNumber,
        years,
        terms,
        termDateRange
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

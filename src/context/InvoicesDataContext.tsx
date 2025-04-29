
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/hooks/invoices/types";
import { useBranch } from "./BranchContext";
import { toast } from "sonner";

interface InvoicesContextType {
  invoices: Invoice[];
  isLoading: boolean;
  error: Error | null;
  refreshInvoices: () => Promise<void>;
  currentPage: number;
  totalPages: number;
  setPage: (page: number) => void;
  loadingState: 'idle' | 'loading' | 'success' | 'error';
}

const InvoicesContext = createContext<InvoicesContextType | undefined>(undefined);

export const INVOICES_PER_PAGE = 25;

export function InvoicesProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const { currentBranch } = useBranch();
  
  // Calculate total pages
  const totalPages = Math.ceil(totalInvoices / INVOICES_PER_PAGE);
  
  // Function to set the current page
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Get invoice count for pagination
  const fetchInvoiceCount = useCallback(async () => {
    if (!currentBranch?.id) return 0;
    
    try {
      const { count, error } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('clients.branch_id', currentBranch.id)
        .limit(0)
        .throwOnError();
        
      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.error("Error fetching invoice count:", err);
      return 0;
    }
  }, [currentBranch?.id]);

  // The main function to fetch invoices
  const fetchInvoices = useCallback(async () => {
    if (!currentBranch?.id) {
      setInvoices([]);
      setIsLoading(false);
      return;
    }
    
    setLoadingState('loading');
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching invoices for page ${currentPage + 1}, branch: ${currentBranch.name}`);
      
      // Calculate pagination range
      const from = currentPage * INVOICES_PER_PAGE;
      const to = from + INVOICES_PER_PAGE - 1;
      
      // Get total count if needed
      if (totalInvoices === 0) {
        const count = await fetchInvoiceCount();
        setTotalInvoices(count);
      }
      
      // Fetch invoices with simplified join structure
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (id, first_name, last_name, email, phone)
        `)
        .eq('clients.branch_id', currentBranch.id)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      if (data) {
        // Transform data to match Invoice type (only essential processing)
        const processedInvoices = data.map(invoice => ({
          ...invoice,
          client: invoice.clients || null,
        }));
        
        setInvoices(processedInvoices as Invoice[]);
        setLoadingState('success');
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError(err instanceof Error ? err : new Error('Failed to fetch invoices'));
      setLoadingState('error');
      toast.error("Failed to load invoices. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentBranch, currentPage, fetchInvoiceCount, totalInvoices]);

  // Refresh function (exposed in context)
  const refreshInvoices = useCallback(async () => {
    // Reset pagination to first page
    setCurrentPage(0);
    // Reset total count to force a recount
    setTotalInvoices(0);
    // Fetch invoices
    await fetchInvoices();
  }, [fetchInvoices]);

  // Fetch invoices when branch or page changes
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices, currentBranch, currentPage]);

  const contextValue: InvoicesContextType = {
    invoices,
    isLoading,
    error,
    refreshInvoices,
    currentPage,
    totalPages,
    setPage,
    loadingState
  };

  return (
    <InvoicesContext.Provider value={contextValue}>
      {children}
    </InvoicesContext.Provider>
  );
}

export const useInvoicesData = () => {
  const context = useContext(InvoicesContext);
  
  if (context === undefined) {
    throw new Error("useInvoicesData must be used within an InvoicesProvider");
  }
  
  return context;
};

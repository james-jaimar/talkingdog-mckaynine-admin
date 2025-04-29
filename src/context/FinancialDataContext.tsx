
import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FinancialData, ClassFinance } from "@/hooks/financial/types";
import { toast } from "sonner";
import { useFinancialProcessor } from "@/hooks/financial/useFinancialProcessor";
import { supabase } from "@/integrations/supabase/client";

interface FinancialDataContextType {
  isLoading: boolean;
  isRefreshing: boolean;
  classFinances: ClassFinance[];
  totalRevenue: number;
  totalDiscounts: number;
  totalInvoiceCount: number;
  invalidInvoicesCount: number;
  fetchFinancialData: (branchId: string, fromDate: string, toDate: string) => Promise<void>;
  refreshData: () => Promise<void>;
  clearFinancialData: () => void;
}

const FinancialDataContext = createContext<FinancialDataContextType | undefined>(undefined);

export function FinancialDataProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [currentParams, setCurrentParams] = useState<{
    branchId?: string;
    fromDate?: string;
    toDate?: string;
  }>({});

  // Process financial data using the existing processor
  const {
    classFinances,
    totalInvoiceCount,
    invalidInvoicesCount
  } = useFinancialProcessor(financialData);

  // Create new abort controller for each request
  const getNewAbortController = useCallback(() => {
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
        console.log("Aborted previous financial data request");
      } catch (err) {
        console.log("Error aborting previous request", err);
      }
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  }, []);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (err) {
          console.log("Error during cleanup", err);
        }
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Clear financial data
  const clearFinancialData = useCallback(() => {
    setFinancialData(null);
  }, []);

  // Main function to fetch financial data
  const fetchFinancialData = useCallback(
    async (branchId: string, fromDate: string, toDate: string) => {
      if (!branchId) return;
      
      setIsLoading(true);
      setCurrentParams({ branchId, fromDate, toDate });
      
      const controller = getNewAbortController();
      const signal = controller.signal;

      try {
        console.log(`Fetching financial data for branch ${branchId} from ${fromDate} to ${toDate}`);

        // Reset any existing queries to ensure fresh data
        await queryClient.resetQueries({
          queryKey: ["financial-bookings", branchId, fromDate, toDate]
        });

        // Get total revenue data
        console.log("Fetching total revenue data...");
        let totalRevenueQuery = supabase
          .from('invoices')
          .select('id, total, status, subtotal, monetary_discount, client:clients(branch_id)')
          .eq('clients.branch_id', branchId)
          .in('status', ['sent', 'paid', 'overdue']);

        if (fromDate && toDate) {
          totalRevenueQuery = totalRevenueQuery.gte('issued_date', fromDate).lte('issued_date', toDate);
        }

        // Apply abort signal
        totalRevenueQuery = totalRevenueQuery.abortSignal(signal);

        // Execute query
        const { data: invoicesTotal, error: invoiceTotalError } = await totalRevenueQuery;

        if (signal.aborted) {
          console.log("Revenue query was aborted, stopping execution");
          return;
        }

        if (invoiceTotalError) {
          console.error("Error fetching invoice totals:", invoiceTotalError);
          throw invoiceTotalError;
        }

        // Calculate revenue totals
        const totalRevenueFromInvoices = invoicesTotal?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
        const totalDiscounts = invoicesTotal?.reduce((sum, inv) => sum + (inv.monetary_discount || 0), 0) || 0;

        // Get bookings data
        console.log("Fetching bookings data...");
        let bookingsQuery = supabase
          .from('bookings')
          .select(`
            id,
            payment_status,
            class_schedules:class_schedule_id (
              classes:class_id (
                id,
                name,
                course_fee,
                mckaynine_commission_value,
                mckaynine_commission_type,
                admin_fee_value,
                admin_fee_type,
                trainer_fee_value,
                trainer_fee_type
              )
            )
          `)
          .eq('class_schedules.classes.branch_id', branchId)
          .eq('status', 'confirmed');

        if (fromDate && toDate) {
          bookingsQuery = bookingsQuery.gte('created_at', fromDate).lte('created_at', toDate);
        }

        bookingsQuery = bookingsQuery.abortSignal(signal);

        const { data: bookings, error: bookingsError } = await bookingsQuery;

        if (signal.aborted) {
          console.log("Bookings query was aborted, stopping execution");
          return;
        }

        if (bookingsError) {
          console.error("Error fetching booking data:", bookingsError);
          throw bookingsError;
        }

        // Get invoice items
        console.log("Fetching invoice items...");
        let invoiceQuery = supabase
          .from('invoice_items')
          .select(`
            id,
            invoice_id,
            booking_id,
            amount,
            unit_price,
            quantity,
            description,
            invoices:invoice_id (
              id,
              status,
              payment_received,
              total,
              subtotal,
              tax_amount,
              discount_amount,
              discount_type,
              monetary_discount,
              client_id,
              issued_date,
              invoice_number,
              client:client_id (
                branch_id
              )
            )
          `)
          .in('invoices.status', ['sent', 'paid', 'overdue']);

        if (fromDate && toDate) {
          invoiceQuery = invoiceQuery
            .gte('invoices.issued_date', fromDate)
            .lte('invoices.issued_date', toDate);
        }

        invoiceQuery = invoiceQuery.abortSignal(signal);

        const { data: invoiceItems, error: invoiceItemsError } = await invoiceQuery;

        if (signal.aborted) {
          console.log("Invoice items query was aborted, stopping execution");
          return;
        }

        if (invoiceItemsError) {
          console.error("Error fetching invoice items:", invoiceItemsError);
          throw invoiceItemsError;
        }

        // Get invoice counts
        console.log("Fetching invoice counts...");
        const invalidCountPromise = supabase
          .from('invoices')
          .select('id, client_id, clients!inner(branch_id)', { count: 'exact' })
          .eq('status', 'invalid')
          .eq('clients.branch_id', branchId)
          .gte(fromDate ? 'issued_date' : 'created_at', fromDate || '1970-01-01')
          .lte(toDate ? 'issued_date' : 'created_at', toDate || '2100-01-01')
          .abortSignal(signal);

        const allInvoicesCountPromise = supabase
          .from('invoices')
          .select('id, client_id, clients!inner(branch_id)', { count: 'exact' })
          .eq('clients.branch_id', branchId)
          .in('status', ['sent', 'paid', 'overdue'])
          .gte(fromDate ? 'issued_date' : 'created_at', fromDate || '1970-01-01')
          .lte(toDate ? 'issued_date' : 'created_at', toDate || '2100-01-01')
          .abortSignal(signal);

        const [invalidResult, allResult] = await Promise.all([
          invalidCountPromise,
          allInvoicesCountPromise
        ]);

        if (signal.aborted) {
          console.log("Count queries were aborted, stopping execution");
          return;
        }

        // Filter invoice items to match branch
        const filteredInvoiceItems = invoiceItems?.filter(item => 
          item.invoices?.client?.branch_id === branchId
        ) || [];

        // Create financial data object
        const financialDataResult: FinancialData = {
          bookingsWithInvoices: bookings || [],
          allInvoicesCount: allResult.count || 0,
          invalidInvoicesCount: invalidResult.count || 0,
          totalRevenue: totalRevenueFromInvoices,
          totalDiscounts,
          invoiceItems: filteredInvoiceItems,
          classInvoiceMap: []
        };

        // Update state with the fresh data
        setFinancialData(financialDataResult);
        console.log("Successfully fetched financial data", {
          bookingsCount: bookings?.length || 0,
          invoiceItemsCount: filteredInvoiceItems.length,
          totalRevenue: totalRevenueFromInvoices
        });
      } catch (error) {
        // Only handle non-abort errors
        if (
          !(error instanceof DOMException && error.name === 'AbortError') &&
          !(error?.name === 'CancelledError') &&
          !(error?.message?.includes?.('cancelled')) &&
          !(error?.message?.includes?.('aborted'))
        ) {
          console.error("Error fetching financial data:", error);
          toast.error("Failed to load financial data");
        } else {
          console.log("Financial data request was cancelled");
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [getNewAbortController, queryClient]
  );

  // Refresh data using current parameters
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    const { branchId, fromDate, toDate } = currentParams;
    
    if (!branchId || !fromDate || !toDate) {
      setIsRefreshing(false);
      return;
    }
    
    try {
      await fetchFinancialData(branchId, fromDate, toDate);
      toast.success("Financial data refreshed");
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [currentParams, fetchFinancialData]);

  const value = {
    isLoading,
    isRefreshing,
    classFinances,
    totalRevenue: financialData?.totalRevenue || 0,
    totalDiscounts: financialData?.totalDiscounts || 0,
    totalInvoiceCount,
    invalidInvoicesCount,
    fetchFinancialData,
    refreshData,
    clearFinancialData
  };

  return (
    <FinancialDataContext.Provider value={value}>
      {children}
    </FinancialDataContext.Provider>
  );
}

export function useFinancialData() {
  const context = useContext(FinancialDataContext);
  if (context === undefined) {
    throw new Error("useFinancialData must be used within a FinancialDataProvider");
  }
  return context;
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/hooks/invoices/types";
import { useBranch } from "@/context/BranchContext";

interface AllocationData {
  totalRevenue: number;
  trainerFees: number;
  franchiseFees: number;
  adminFees: number;
}

const calculateBreakdown = (invoices: Invoice[]): AllocationData => {
  // Initialize counters
  let totalRevenue = 0;
  let trainerFees = 0;
  let franchiseFees = 0;
  let adminFees = 0;
  
  // Process each invoice
  invoices.forEach(invoice => {
    if (invoice.status === 'paid') {
      // Add to total revenue
      totalRevenue += invoice.total;
      
      // Add trainer fee if available
      if (invoice.trainer_fee !== undefined) {
        trainerFees += invoice.trainer_fee;
      }
      
      // Add franchise fee if available
      if (invoice.franchise_fee !== undefined) {
        franchiseFees += invoice.franchise_fee;
      }
      
      // Add admin fee if available
      if (invoice.admin_fee !== undefined) {
        adminFees += invoice.admin_fee;
      }
    }
  });
  
  return {
    totalRevenue,
    trainerFees,
    franchiseFees,
    adminFees
  };
};

export function useAllocationChartData() {
  const { currentBranch } = useBranch();
  
  return useQuery({
    queryKey: ['allocation-chart-data', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) {
        return {
          totalRevenue: 0,
          trainerFees: 0,
          franchiseFees: 0,
          adminFees: 0
        };
      }
      
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('clients.branch_id', currentBranch.id)
        .eq('status', 'paid');
      
      if (error) {
        console.error("Error fetching invoices:", error);
        throw new Error("Failed to fetch invoices for allocation chart");
      }
      
      return calculateBreakdown(invoices as Invoice[]);
    },
    enabled: !!currentBranch?.id,
  });
}

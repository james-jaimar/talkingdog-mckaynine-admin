import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StarterKitBatch {
  id: string;
  quantity_added: number;
  quantity_remaining: number;
  purchase_date: string;
  unit_cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StarterKitAllocation {
  id: string;
  inventory_batch_id: string;
  branch_id: string | null;
  invoice_item_id: string | null;
  handler_id: string | null;
  dog_name: string | null;
  allocated_at: string;
  // Joined data
  handler?: {
    first_name: string;
    last_name: string;
  } | null;
  branch?: {
    name: string;
  } | null;
}

export interface AddStockData {
  quantity_added: number;
  purchase_date: string;
  unit_cost?: number | null;
  notes?: string | null;
}

export const useStarterKitInventory = () => {
  const queryClient = useQueryClient();

  // Fetch all batches
  const {
    data: batches = [],
    isLoading: batchesLoading,
    error: batchesError,
  } = useQuery({
    queryKey: ["starter-kit-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("starter_kit_inventory")
        .select("*")
        .order("purchase_date", { ascending: false });

      if (error) throw error;
      return data as StarterKitBatch[];
    },
  });

  // Fetch recent allocations with handler and branch info
  const {
    data: allocations = [],
    isLoading: allocationsLoading,
    error: allocationsError,
  } = useQuery({
    queryKey: ["starter-kit-allocations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("starter_kit_allocations")
        .select(`
          *,
          handler:clients(first_name, last_name),
          branch:branches(name)
        `)
        .order("allocated_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as StarterKitAllocation[];
    },
  });

  // Calculate total stock
  const totalStock = batches.reduce((sum, batch) => sum + batch.quantity_remaining, 0);
  const isLowStock = totalStock < 5;

  // Add stock mutation
  const addStockMutation = useMutation({
    mutationFn: async (data: AddStockData) => {
      const { data: result, error } = await supabase
        .from("starter_kit_inventory")
        .insert({
          quantity_added: data.quantity_added,
          quantity_remaining: data.quantity_added, // Initially all are available
          purchase_date: data.purchase_date,
          unit_cost: data.unit_cost || null,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["starter-kit-inventory"] });
      toast.success("Stock added successfully");
    },
    onError: (error) => {
      console.error("Error adding stock:", error);
      toast.error("Failed to add stock");
    },
  });

  // Update stock mutation (for editing)
  const updateStockMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<StarterKitBatch> & { id: string }) => {
      const { data: result, error } = await supabase
        .from("starter_kit_inventory")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["starter-kit-inventory"] });
      toast.success("Stock updated successfully");
    },
    onError: (error) => {
      console.error("Error updating stock:", error);
      toast.error("Failed to update stock");
    },
  });

  // Delete stock mutation
  const deleteStockMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("starter_kit_inventory")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["starter-kit-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["starter-kit-allocations"] });
      toast.success("Stock batch deleted");
    },
    onError: (error) => {
      console.error("Error deleting stock:", error);
      toast.error("Failed to delete stock batch");
    },
  });

  return {
    batches,
    allocations,
    totalStock,
    isLowStock,
    isLoading: batchesLoading || allocationsLoading,
    error: batchesError || allocationsError,
    addStock: addStockMutation.mutate,
    addStockAsync: addStockMutation.mutateAsync,
    isAddingStock: addStockMutation.isPending,
    updateStock: updateStockMutation.mutate,
    isUpdatingStock: updateStockMutation.isPending,
    deleteStock: deleteStockMutation.mutate,
    isDeletingStock: deleteStockMutation.isPending,
  };
};

// Helper function to allocate a starter kit (called after enrollment fee is created)
export const allocateStarterKit = async (
  invoiceItemId: string,
  handlerId: string,
  dogName: string,
  branchId: string
): Promise<{ success: boolean; remainingStock: number; message: string }> => {
  try {
    const { data, error } = await supabase.rpc("allocate_starter_kit", {
      p_invoice_item_id: invoiceItemId,
      p_handler_id: handlerId,
      p_dog_name: dogName,
      p_branch_id: branchId,
    });

    if (error) {
      console.error("Error allocating starter kit:", error);
      return { success: false, remainingStock: 0, message: error.message };
    }

    // The function returns a table, so data is an array
    const result = Array.isArray(data) ? data[0] : data;
    
    return {
      success: result?.success ?? false,
      remainingStock: result?.remaining_total ?? 0,
      message: result?.message ?? "Unknown error",
    };
  } catch (error) {
    console.error("Error calling allocate_starter_kit:", error);
    return { success: false, remainingStock: 0, message: "Failed to allocate starter kit" };
  }
};

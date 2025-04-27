
import { supabase } from "@/integrations/supabase/client";

export async function saveOrderToDatabase(classIds: string[], branchId: string) {
  try {
    console.log(`Saving order for branch ${branchId} with ${classIds.length} class IDs`);
    
    // Validation checks
    if (!branchId) {
      throw new Error("Branch ID is required");
    }
    
    if (!Array.isArray(classIds) || classIds.length === 0) {
      console.error("Cannot save empty class order");
      throw new Error("Cannot save empty class order");
    }
    
    // Check for duplicates in the order array
    const uniqueIds = new Set(classIds);
    if (uniqueIds.size !== classIds.length) {
      console.error("Duplicate class IDs in order array");
      throw new Error("Duplicate class IDs in order array");
    }
    
    // Check if an order record already exists for this branch
    const { data: existingOrder, error: checkError } = await supabase
      .from('class_tab_order')
      .select('id')
      .eq('branch_id', branchId)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking order existence:", checkError);
      throw checkError;
    }

    if (existingOrder) {
      console.log(`Updating existing order record ${existingOrder.id} with ${classIds.length} classes`);
      const { data, error } = await supabase
        .from('class_tab_order')
        .update({ 
          class_ids: classIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingOrder.id)
        .select();
        
      if (error) {
        console.error("Error updating order:", error);
        throw error;
      }
      
      console.log("Order updated successfully:", data);
      return data;
    } else {
      console.log(`Creating new order record for branch ${branchId} with ${classIds.length} classes`);
      const { data, error } = await supabase
        .from('class_tab_order')
        .insert({
          branch_id: branchId,
          class_ids: classIds
        })
        .select();
        
      if (error) {
        console.error("Error creating order:", error);
        throw error;
      }
      
      console.log("Order created successfully:", data);
      return data;
    }
  } catch (error) {
    console.error("Database operation failed:", error);
    throw error;
  }
}

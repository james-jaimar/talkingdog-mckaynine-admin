
import { supabase } from "@/integrations/supabase/client";

export async function saveOrderToDatabase(classIds: string[], branchId: string) {
  try {
    console.log(`Saving order for branch ${branchId} with class IDs:`, classIds);
    
    const { data: existingOrder, error: checkError } = await supabase
      .from('class_tab_order')
      .select('id')
      .eq('branch_id', branchId)
      .maybeSingle();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking order existence:", checkError);
      throw checkError;
    }

    if (existingOrder) {
      console.log(`Updating existing order record ${existingOrder.id}`);
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
    } else {
      console.log("Creating new order record");
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
    }
    
    return classIds;
  } catch (error) {
    console.error("Database operation failed:", error);
    throw error;
  }
}

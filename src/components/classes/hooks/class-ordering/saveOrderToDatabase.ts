
import { supabase } from "@/integrations/supabase/client";

export async function saveOrderToDatabase(classIds: string[], branchId: string) {
  try {
    // First check if an order already exists
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
      // Update existing order
      const { error: updateError } = await supabase
        .from('class_tab_order')
        .update({ class_ids: classIds })
        .eq('id', existingOrder.id);
        
      if (updateError) {
        console.error("Error updating class order:", updateError);
        throw updateError;
      }
    } else {
      // Create new order
      const { error: insertError } = await supabase
        .from('class_tab_order')
        .insert({
          branch_id: branchId,
          class_ids: classIds
        });
        
      if (insertError) {
        console.error("Error creating class order:", insertError);
        throw insertError;
      }
    }
    
    return classIds;
  } catch (error) {
    console.error("Database operation failed:", error);
    throw error;
  }
}

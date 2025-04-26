
import { supabase } from "@/integrations/supabase/client";

export async function saveOrderToDatabase(classIds: string[], branchId: string) {
  try {
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
      const { error } = await supabase
        .from('class_tab_order')
        .update({ 
          class_ids: classIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingOrder.id);
        
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('class_tab_order')
        .insert({
          branch_id: branchId,
          class_ids: classIds
        });
        
      if (error) throw error;
    }
    
    return classIds;
  } catch (error) {
    console.error("Database operation failed:", error);
    throw error;
  }
}

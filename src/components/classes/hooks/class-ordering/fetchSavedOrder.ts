
import { supabase } from "@/integrations/supabase/client";

export async function fetchSavedOrder(branchId: string | undefined) {
  if (!branchId) return null;
  
  try {
    const { data, error } = await supabase
      .from('class_tab_order')
      .select('*')
      .eq('branch_id', branchId)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching class order:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
}

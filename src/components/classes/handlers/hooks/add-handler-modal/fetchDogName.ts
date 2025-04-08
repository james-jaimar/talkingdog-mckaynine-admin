
import { supabase } from "@/integrations/supabase/client";

// Get dog name for the invoice
export const fetchDogName = async (dogId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('dogs')
      .select('name')
      .eq('id', dogId)
      .single();
    
    if (error) throw error;
    return data.name;
  } catch (err) {
    console.error("Error fetching dog name:", err);
    return "your dog";
  }
};

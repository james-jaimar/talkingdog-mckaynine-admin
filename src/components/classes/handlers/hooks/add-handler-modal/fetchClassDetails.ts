
import { supabase } from "@/integrations/supabase/client";

// Fetch class details including price and name
export const fetchClassDetails = async (classId: string): Promise<{ name: string; price: number } | null> => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('name, price')
      .eq('id', classId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error fetching class details:", err);
    return null;
  }
};

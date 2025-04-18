
import { supabase } from "@/integrations/supabase/client";

// Fetch class details including course fee and name
export const fetchClassDetails = async (classId: string): Promise<{ name: string; price: number } | null> => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('name, course_fee')
      .eq('id', classId)
      .single();
    
    if (error) throw error;
    
    // Map course_fee to price for backward compatibility
    return data ? { name: data.name, price: data.course_fee } : null;
  } catch (err) {
    console.error("Error fetching class details:", err);
    return null;
  }
};

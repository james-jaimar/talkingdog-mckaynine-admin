
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if a column exists in a table
 */
export async function checkColumnExists(table: string, column: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('check-column-exists', {
      body: { table, column }
    });
    
    if (error) {
      console.error(`Error checking if ${column} exists in ${table}:`, error);
      return false;
    }
    
    return !!data?.exists;
  } catch (e) {
    console.error(`Exception checking if ${column} exists in ${table}:`, e);
    return false;
  }
}

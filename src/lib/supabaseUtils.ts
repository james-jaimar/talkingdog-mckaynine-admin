
import { PostgrestError } from '@supabase/supabase-js';

// Check if a Supabase error is due to a missing relation/table
export function isTableNotExistError(error: PostgrestError | null): boolean {
  return !!error && (error.code === '42P01' || error.message?.includes('relation') && error.message?.includes('does not exist'));
}

// Handle cases where we might be trying to access a table that doesn't exist yet
export async function safeTableQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  fallbackValue: T
): Promise<T> {
  try {
    const { data, error } = await queryFn();
    
    if (isTableNotExistError(error)) {
      console.info("Table doesn't exist yet, using fallback value");
      return fallbackValue;
    }
    
    if (error) {
      console.error("Error executing query:", error);
      throw error;
    }
    
    return data || fallbackValue;
  } catch (error) {
    console.error("Error in safeTableQuery:", error);
    return fallbackValue;
  }
}

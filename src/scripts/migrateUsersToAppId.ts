
/**
 * Migration script to update existing users with the app_id
 * 
 * This is meant to be run once manually if needed
 */
import { supabase } from "@/integrations/supabase/client";
import { APP_ID } from "@/constants/app";

export const migrateUsersToAppId = async () => {
  try {
    console.log("Starting migration to update users with app_id:", APP_ID);
    
    // Check if there are users without app_id
    const { data: usersWithoutAppId, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .is('app_id', null);
    
    if (checkError) {
      throw checkError;
    }
    
    console.log(`Found ${usersWithoutAppId?.length || 0} users without app_id`);
    
    if (usersWithoutAppId && usersWithoutAppId.length > 0) {
      // Update all users without app_id
      const { data, error } = await supabase
        .from('profiles')
        .update({ app_id: APP_ID })
        .is('app_id', null)
        .select('id');
      
      if (error) {
        throw error;
      }
      
      console.log(`Successfully updated ${data?.length || 0} users with app_id`);
      return {
        success: true,
        message: `Successfully updated ${data?.length || 0} users with app_id: ${APP_ID}`
      };
    } else {
      return {
        success: true,
        message: "No users found without app_id, all users are already set."
      };
    }
  } catch (error) {
    console.error("Error migrating users to app_id:", error);
    return {
      success: false,
      message: `Failed to migrate users: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

export default migrateUsersToAppId;

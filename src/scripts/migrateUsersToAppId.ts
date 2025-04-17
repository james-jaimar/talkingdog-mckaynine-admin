
/**
 * Migration script to update existing users with the app_id
 */
import { supabase } from "@/integrations/supabase/client";
import { APP_ID } from "@/constants/app";

export const migrateUsersToAppId = async () => {
  try {
    console.log("Starting migration to update users with app_id:", APP_ID);
    
    // Check if there are users without app_id
    const { data: usersWithoutAppId, error: checkError } = await supabase
      .from('profiles')
      .select('id, username, role')
      .is('app_id', null);
    
    if (checkError) {
      console.error("Error checking for users without app_id:", checkError);
      throw checkError;
    }
    
    const usersCount = usersWithoutAppId?.length || 0;
    console.log(`Found ${usersCount} users without app_id`);
    
    if (usersCount === 0) {
      return {
        success: true,
        message: "No users found without app_id, all users are already set."
      };
    }
    
    console.log("Users without app_id:", usersWithoutAppId?.map(u => `${u.username} (${u.id})`));
    
    // Update all users without app_id
    const { data, error } = await supabase
      .from('profiles')
      .update({ app_id: APP_ID })
      .is('app_id', null)
      .select('id, username');
    
    if (error) {
      console.error("Error updating users with app_id:", error);
      throw error;
    }
    
    const updatedCount = data?.length || 0;
    console.log(`Successfully updated ${updatedCount} users with app_id:`, data);
    
    return {
      success: true,
      message: `Successfully updated ${updatedCount} users with app_id: ${APP_ID}`
    };
  } catch (error) {
    console.error("Error migrating users to app_id:", error);
    return {
      success: false,
      message: `Failed to migrate users: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

export default migrateUsersToAppId;

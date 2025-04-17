
/**
 * Migration script to update existing users with the app_id
 */
import { supabase } from "@/integrations/supabase/client";
import { APP_ID } from "@/constants/app";

export const migrateUsersToAppId = async () => {
  try {
    console.log("Starting migration to update users with app_id:", APP_ID);
    
    // Get all users that need updating (either null app_id or different app_id)
    const { data: usersToUpdate, error: checkError } = await supabase
      .from('profiles')
      .select('id, username, app_id')
      .or(`app_id.is.null,app_id.neq.${APP_ID}`);
    
    if (checkError) {
      console.error("Error checking for users to update:", checkError);
      throw checkError;
    }
    
    const usersCount = usersToUpdate?.length || 0;
    console.log(`Found ${usersCount} users that need app_id updates`);
    
    if (usersCount === 0) {
      return {
        success: true,
        message: "All users already have correct app_id configured."
      };
    }
    
    // Log the users that need updating
    console.log("Users needing app_id update:", usersToUpdate?.map(u => 
      `${u.username || u.id} (current app_id: ${u.app_id || 'null'})`
    ));
    
    // Do a single batch update - simpler and more efficient
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ app_id: APP_ID })
      .or(`app_id.is.null,app_id.neq.${APP_ID}`)
      .select('id, username');
    
    if (updateError) {
      console.error("Error updating users with app_id:", updateError);
      throw updateError;
    }
    
    const updatedCount = updated?.length || 0;
    console.log(`Successfully updated ${updatedCount} users with app_id:`, updated);
    
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

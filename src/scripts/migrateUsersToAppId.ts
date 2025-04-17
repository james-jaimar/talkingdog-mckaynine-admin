
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
      // Also check if there might be users with a different app_id that need updating
      const { data: usersWithDifferentAppId, error: diffAppError } = await supabase
        .from('profiles')
        .select('id, username, role, app_id')
        .neq('app_id', APP_ID);
      
      if (diffAppError) {
        console.error("Error checking for users with different app_id:", diffAppError);
        throw diffAppError;
      }
      
      const differentAppCount = usersWithDifferentAppId?.length || 0;
      
      if (differentAppCount > 0) {
        console.log(`Found ${differentAppCount} users with different app_id. Current app_id: ${APP_ID}`);
        console.log("Users with different app_id:", usersWithDifferentAppId?.map(u => `${u.username} (${u.id}) - app_id: ${u.app_id}`));
        
        // Update users with different app_id
        const { data: updatedDiff, error: updateDiffError } = await supabase
          .from('profiles')
          .update({ app_id: APP_ID })
          .neq('app_id', APP_ID)
          .select('id, username');
        
        if (updateDiffError) {
          console.error("Error updating users with different app_id:", updateDiffError);
          throw updateDiffError;
        }
        
        const updatedDiffCount = updatedDiff?.length || 0;
        console.log(`Successfully updated ${updatedDiffCount} users with correct app_id:`, updatedDiff);
        
        return {
          success: true,
          message: `Successfully updated ${updatedDiffCount} users with app_id: ${APP_ID}`
        };
      }
      
      return {
        success: true,
        message: "No users found that need app_id updates, all users are already set correctly."
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


import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a file attachment for a message
 */
export const uploadMessageAttachment = async (file: File) => {
  try {
    console.log("Uploading file:", file.name, "Size:", file.size, "Type:", file.type);
    
    // Get current auth session
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Check if user is authenticated
    if (!sessionData.session) {
      console.error("No active session found");
      throw new Error("You must be logged in to upload files");
    }
    
    // Create unique file path to avoid collisions
    const fileExt = file.name.split('.').pop();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `${randomId}_${Date.now()}.${fileExt}`;
    const userId = sessionData.session.user.id;
    const filePath = `${userId}/${fileName}`;
    
    console.log("Uploading to path:", filePath);
    
    // Upload the file with proper content type and cacheControl
    const { data, error } = await supabase
      .storage
      .from('message-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type, // Explicitly set content type
        upsert: false
      });
      
    if (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
    
    console.log("File uploaded successfully:", data.path);
    
    // Get a public URL for the file
    const { data: publicUrlData } = await supabase
      .storage
      .from('message-attachments')
      .getPublicUrl(data.path);
      
    if (!publicUrlData?.publicUrl) {
      throw new Error("Could not generate public URL");
    }
    
    console.log("Public URL generated:", publicUrlData.publicUrl);
      
    return {
      url: publicUrlData.publicUrl,
      type: file.type
    };
  } catch (error) {
    console.error("Error in uploadMessageAttachment:", error);
    throw error;
  }
};

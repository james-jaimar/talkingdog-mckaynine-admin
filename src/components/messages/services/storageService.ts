
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    
    // Upload to the message-attachments bucket
    const { data, error } = await supabase
      .storage
      .from('message-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false
      });
      
    if (error) {
      console.error("Error uploading file:", error);
      
      // Show more user-friendly error message
      if (error.message.includes("bucket") || error.message.includes("not found")) {
        toast.error("Storage configuration issue", {
          description: "The message attachments storage is not properly configured. Please contact support."
        });
      } else if (error.message.includes("permission") || error.message.includes("policy")) {
        toast.error("Permission denied", {
          description: "You don't have permission to upload this file. Please log out and log back in."
        });
      } else {
        toast.error("Upload failed", {
          description: error.message
        });
      }
      throw error;
    }
    
    console.log("File uploaded successfully:", data.path);
    
    // Get the correct public URL for the file
    // Use the full URL format to ensure it works properly
    const { data: publicUrlData } = supabase
      .storage
      .from('message-attachments')
      .getPublicUrl(data.path);
      
    if (!publicUrlData?.publicUrl) {
      throw new Error("Could not generate public URL");
    }
    
    // Log the full URL to help with debugging
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

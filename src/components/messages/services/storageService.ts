
import { supabase } from "@/integrations/supabase/client";

/**
 * Create message attachments bucket if it doesn't exist
 */
export const createBucketIfNotExists = async (bucketName: string): Promise<void> => {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase
      .storage
      .listBuckets();
      
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Bucket '${bucketName}' does not exist, attempting to create it`);
      const { error } = await supabase
        .storage
        .createBucket(bucketName, {
          public: true, // Make bucket publicly accessible
          fileSizeLimit: 10485760, // 10MB limit
        });
        
      if (error) {
        console.error("Error creating bucket:", error);
        throw new Error(`Failed to create bucket: ${error.message}`);
      }
      
      console.log(`Bucket '${bucketName}' created successfully`);
    } else {
      console.log(`Bucket '${bucketName}' already exists`);
    }
  } catch (error) {
    console.error("Error in createBucketIfNotExists:", error);
    throw error;
  }
};

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
    
    // Ensure bucket exists
    const bucketName = 'message-attachments';
    await createBucketIfNotExists(bucketName);
    
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
      .from(bucketName)
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
      .from(bucketName)
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

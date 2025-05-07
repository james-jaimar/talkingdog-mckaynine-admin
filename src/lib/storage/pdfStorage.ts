
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Uploads a PDF file to Supabase Storage and returns the URL
 * @param pdfBase64 - PDF in base64 format (including data:application/pdf;base64, prefix)
 * @param filename - The name to save the file as
 * @returns The URL of the uploaded file
 */
export async function uploadPaymentPDF(
  pdfBase64: string, 
  filename: string
): Promise<{ url: string; name: string } | null> {
  try {
    if (!pdfBase64) {
      console.error("No PDF data provided for upload");
      return null;
    }
    
    // Remove the data:application/pdf;base64, prefix if present
    const base64Data = pdfBase64.includes("base64,") ? pdfBase64.split(",")[1] : pdfBase64;
    
    if (!base64Data) {
      console.error("Invalid PDF data format");
      return null;
    }
    
    // Convert base64 to Uint8Array for upload
    const pdfData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Generate a unique filename with timestamp
    const timestamp = new Date().getTime();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFilename = `trainer-payments/${timestamp}-${sanitizedFilename}`;
    
    console.log(`Attempting to upload PDF to payment-documents/${uniqueFilename}`);
    
    // Try to create the bucket first if it doesn't exist
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (!bucketError) {
        const bucketExists = buckets?.some(b => b.id === 'payment-documents');
        
        if (!bucketExists) {
          console.log("Creating payment-documents bucket");
          await supabase.storage.createBucket('payment-documents', {
            public: true
          });
        }
      }
    } catch (bucketErr) {
      console.error("Error checking/creating bucket:", bucketErr);
    }
    
    // Upload the file to the payment-documents bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-documents')
      .upload(uniqueFilename, pdfData, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error("Error uploading PDF to storage:", uploadError);
      
      // If the file already exists, try with a different name
      if (uploadError.message.includes("already exists")) {
        const newTimestamp = new Date().getTime() + 1;
        const newFilename = `trainer-payments/${newTimestamp}-${sanitizedFilename}`;
        
        console.log(`Retrying upload with new filename: ${newFilename}`);
        
        const { data: retryData, error: retryError } = await supabase.storage
          .from('payment-documents')
          .upload(newFilename, pdfData, {
            contentType: 'application/pdf',
            cacheControl: '3600',
            upsert: false
          });
          
        if (retryError) {
          console.error("Error on retry upload:", retryError);
          return null;
        }
        
        // Use the data from the retry
        const { data } = supabase.storage
          .from('payment-documents')
          .getPublicUrl(newFilename);
        
        return { 
          url: data.publicUrl,
          name: sanitizedFilename
        };
      }
      
      return null;
    }
    
    // Generate a public URL for the file
    const { data } = supabase.storage
      .from('payment-documents')
      .getPublicUrl(uniqueFilename);
    
    console.log("Generated public URL:", data?.publicUrl);
    
    return { 
      url: data.publicUrl,
      name: sanitizedFilename
    };
  } catch (error) {
    console.error("Error in PDF upload process:", error);
    toast.error("Failed to upload payment document");
    return null;
  }
}

/**
 * Generates a unique PDF filename for a trainer payment
 * @param trainerName - The name of the trainer
 * @param date - Optional date for the filename
 * @returns A formatted filename string
 */
export function generatePaymentPDFFilename(trainerName: string, date?: Date): string {
  const formattedDate = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const sanitizedName = trainerName.replace(/\s+/g, '_').toLowerCase();
  return `payment_${sanitizedName}_${formattedDate}.pdf`;
}

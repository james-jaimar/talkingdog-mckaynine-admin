
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
    const base64Data = pdfBase64.split(",")[1];
    if (!base64Data) {
      console.error("Invalid PDF data format");
      return null;
    }
    
    // Convert base64 to Uint8Array for upload
    const pdfData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Generate a unique filename with timestamp
    const timestamp = new Date().getTime();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFilename = `trainer-payments/payment-document-${timestamp}-${sanitizedFilename}`;
    
    console.log(`Uploading PDF to payment-documents/${uniqueFilename}`);
    
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
      
      // If the error is because the bucket doesn't exist, try to create it
      if (uploadError.message.includes("bucket") && uploadError.message.includes("not found")) {
        console.log("Bucket not found, attempting to create it");
        const { error: createError } = await supabase.storage.createBucket('payment-documents', {
          public: true
        });
        
        if (createError) {
          console.error("Error creating bucket:", createError);
          return null;
        }
        
        // Try upload again
        const { data: retryData, error: retryError } = await supabase.storage
          .from('payment-documents')
          .upload(uniqueFilename, pdfData, {
            contentType: 'application/pdf',
            cacheControl: '3600',
            upsert: false
          });
          
        if (retryError) {
          console.error("Error on retry upload:", retryError);
          return null;
        }
        
        uploadData = retryData;
      } else {
        return null;
      }
    }
    
    // Generate a public URL for the file that doesn't expire (or with a long expiry)
    const { data: publicUrlData } = supabase.storage
      .from('payment-documents')
      .getPublicUrl(uniqueFilename);
    
    console.log("Generated public URL:", publicUrlData?.publicUrl);
    
    return { 
      url: publicUrlData.publicUrl,
      name: sanitizedFilename // Return the sanitized filename for display
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

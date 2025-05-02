
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileIcon, Loader2, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PaymentFileUploaderProps {
  onFileUpload: (fileUrl: string, fileName: string) => void;
  onFileRemove: () => void;
  existingFile: { url: string; name: string } | null;
  disabled?: boolean;
}

export function PaymentFileUploader({
  onFileUpload,
  onFileRemove,
  existingFile,
  disabled = false
}: PaymentFileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF only)
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are allowed");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      // Generate a unique file name
      const timestamp = new Date().getTime();
      const fileName = `payment-document-${timestamp}-${file.name.replace(/\s+/g, '-')}`;
      
      // Ensure the bucket exists
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('payment-documents');
      if (bucketError && bucketError.message.includes('does not exist')) {
        await supabase.storage.createBucket('payment-documents', {
          public: false // Make it private requiring signed URLs
        });
      }
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from('payment-documents')
        .upload(`trainer-payments/${fileName}`, file);

      if (error) {
        console.error("Error uploading file:", error);
        setUploadError(error.message || "Failed to upload file");
        return;
      }

      // Get a URL for the uploaded file
      const { data: urlData, error: urlError } = await supabase.storage
        .from('payment-documents')
        .createSignedUrl(`trainer-payments/${fileName}`, 60 * 60 * 24 * 7); // 7 days expiry

      if (urlError) {
        console.error("Error generating signed URL:", urlError);
        setUploadError(urlError.message || "Failed to generate document URL");
        return;
      }

      // Call the callback with file URL and name
      onFileUpload(urlData.signedUrl, file.name);
    } catch (error) {
      console.error("Exception during file upload:", error);
      setUploadError("An unexpected error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    onFileRemove();
    setUploadError("");
  };

  if (existingFile) {
    return (
      <div className="flex items-center justify-between p-2 border rounded-md">
        <div className="flex items-center space-x-2">
          <FileIcon className="h-5 w-5 text-blue-500" />
          <a 
            href={existingFile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:underline truncate max-w-[200px]"
          >
            {existingFile.name}
          </a>
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveFile}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <Input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={isUploading || disabled}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
        />
      </div>
      {isUploading && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading document...</span>
        </div>
      )}
      {uploadError && (
        <p className="text-sm text-red-500">{uploadError}</p>
      )}
    </div>
  );
}

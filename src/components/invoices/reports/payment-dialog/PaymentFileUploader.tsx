
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentFileUploaderProps {
  onFileUpload: (fileUrl: string, fileName: string) => void;
  existingFile?: { url: string; name: string } | null;
  onFileRemove?: () => void;
  disabled?: boolean;
}

export function PaymentFileUploader({ 
  onFileUpload, 
  existingFile, 
  onFileRemove,
  disabled = false 
}: PaymentFileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Validate file type (PDF only)
    if (file.type !== 'application/pdf') {
      toast.error("Only PDF files are allowed");
      return;
    }
    
    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      toast.error("File size should be less than 5MB");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `trainer-payments/${fileName}`;
      
      // Create storage bucket if it doesn't exist yet
      const { data: bucketExists } = await supabase.storage.getBucket('payment-documents');
      if (!bucketExists) {
        await supabase.storage.createBucket('payment-documents', {
          public: false,
          allowedMimeTypes: ['application/pdf'],
          fileSizeLimit: MAX_SIZE
        });
      }
      
      // Upload file
      const { error, data } = await supabase.storage
        .from('payment-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = await supabase.storage
        .from('payment-documents')
        .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days validity
      
      if (urlData?.signedUrl) {
        onFileUpload(urlData.signedUrl, file.name);
        toast.success("File uploaded successfully");
      } else {
        throw new Error("Failed to get signed URL");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Upload failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onFileUpload]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isUploading || disabled
  });
  
  const handleRemoveFile = () => {
    if (onFileRemove) {
      onFileRemove();
    }
  };
  
  // If there's an existing file, show it
  if (existingFile?.url) {
    return (
      <div className="border rounded-md p-3 bg-slate-50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
          <a 
            href={existingFile.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline truncate"
          >
            {existingFile.name || "Payment document.pdf"}
          </a>
        </div>
        {!disabled && onFileRemove && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRemoveFile}
            className="h-7 w-7 p-0 rounded-full"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove file</span>
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-6 transition-colors ${
          isDragActive 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-300 hover:border-blue-400"
        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-600">Uploading payment document...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600">
                {isDragActive 
                  ? "Drop the PDF file here"
                  : "Drag & drop a PDF file here, or click to select"
                }
              </p>
              <p className="text-xs text-gray-500">
                PDF only, max 5MB
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import mammoth from "mammoth";

interface WordUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversionComplete: (htmlContent: string, suggestedName: string) => void;
}

export function WordUploadModal({ open, onOpenChange, onConversionComplete }: WordUploadModalProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxFiles: 1,
  });

  const handleConvert = async () => {
    if (!uploadedFile) return;

    setIsConverting(true);
    
    try {
      // Read the file and extract text using mammoth
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const documentText = result.value;

      if (!documentText || documentText.trim().length === 0) {
        toast.error("Could not extract text from the document. Please ensure it contains readable text.");
        setIsConverting(false);
        return;
      }

      console.log("Extracted text length:", documentText.length);

      // Call the edge function to convert to HTML
      const { data, error } = await supabase.functions.invoke('convert-word-to-template', {
        body: {
          document_text: documentText,
          file_name: uploadedFile.name,
        },
      });

      if (error) {
        console.error("Conversion error:", error);
        toast.error(`Conversion failed: ${error.message}`);
        return;
      }

      if (!data?.success || !data?.html_content) {
        toast.error(data?.error || "Conversion failed. Please try again.");
        return;
      }

      toast.success("Document converted successfully! You can now edit the template.");
      onConversionComplete(data.html_content, data.suggested_name || uploadedFile.name.replace(/\.(docx?|doc)$/i, ''));
      onOpenChange(false);
      setUploadedFile(null);

    } catch (error) {
      console.error("Error converting document:", error);
      toast.error("Failed to convert document. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleClose = () => {
    if (!isConverting) {
      setUploadedFile(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Import from Word Document
          </DialogTitle>
          <DialogDescription>
            Upload a Word document and we'll convert it into a beautiful, styled email template with colored info boxes, proper formatting, and merge fields.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
              ${uploadedFile ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {uploadedFile ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-12 w-12 text-green-600" />
                <p className="font-medium text-green-700 dark:text-green-400">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Click or drop to replace
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-12 w-12 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-primary font-medium">Drop your Word document here...</p>
                ) : (
                  <>
                    <p className="font-medium">Drag & drop a Word document</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Supports .docx and .doc files
                </p>
              </div>
            )}
          </div>

          {uploadedFile && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">What happens next:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>AI will analyze your document content</li>
                <li>Important info gets styled colored boxes</li>
                <li>Merge fields (like {`{{handler_name}}`}) are added</li>
                <li>You can edit the result in the visual editor</li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isConverting}>
            Cancel
          </Button>
          <Button 
            onClick={handleConvert} 
            disabled={!uploadedFile || isConverting}
          >
            {isConverting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Convert to Template
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

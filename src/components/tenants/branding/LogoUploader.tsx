
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LogoUploaderProps {
  currentLogoUrl?: string | null;
  onLogoUploaded: (url: string) => Promise<void>;
}

export function LogoUploader({ currentLogoUrl, onLogoUploaded }: LogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Logo image must be smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Create a temporary preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Upload to Supabase storage
      const fileName = `tenant-logos/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('tenant-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('tenant-assets')
        .getPublicUrl(fileName);

      // Update tenant branding with new logo URL
      await onLogoUploaded(urlData.publicUrl);

      toast({
        title: "Logo uploaded",
        description: "Your new logo has been uploaded and applied",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your logo. Please try again.",
        variant: "destructive",
      });
      
      // Revert preview if there was an error
      setPreviewUrl(currentLogoUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      setIsUploading(true);
      await onLogoUploaded('');
      setPreviewUrl(null);
      toast({
        title: "Logo removed",
        description: "The logo has been removed",
      });
    } catch (error) {
      console.error("Error removing logo:", error);
      toast({
        title: "Error",
        description: "Failed to remove logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Tenant Logo</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your company logo. Recommended size: 200x50px. Max 2MB.
        </p>
      </div>

      {previewUrl ? (
        <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
          <div className="bg-gray-50 p-4 rounded-md flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Tenant Logo"
              className="max-h-24 max-w-full object-contain"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => document.getElementById('logo-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Change Logo
            </Button>
            <Button
              variant="destructive"
              size="sm"
              type="button"
              onClick={handleRemoveLogo}
              disabled={isUploading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center p-6 border-dashed border-2 cursor-pointer">
          <div className="text-center" onClick={() => document.getElementById('logo-upload')?.click()}>
            {isUploading ? (
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-2" />
            ) : (
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            )}
            <p className="font-medium">Click to upload logo</p>
            <p className="text-xs text-muted-foreground mt-1">
              SVG, PNG or JPG (max 2MB)
            </p>
          </div>
        </Card>
      )}

      <input
        id="logo-upload"
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  );
}

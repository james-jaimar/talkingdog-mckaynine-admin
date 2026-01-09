import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCw, Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ScanViewerProps {
  fileUrl: string;
  filename: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ScanViewer({ fileUrl, filename, isOpen, onClose }: ScanViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getSignedUrl() {
      if (!fileUrl || !isOpen) return;
      
      setIsLoading(true);
      try {
        // The fileUrl stored in the job is just the filename/path within the bucket,
        // NOT a full URL. So we can use it directly with createSignedUrl.
        let filePath = fileUrl;
        
        // If for some reason it IS a full URL, extract just the path part
        if (fileUrl.includes('/scanned-forms/')) {
          const urlParts = fileUrl.split('/scanned-forms/');
          if (urlParts.length >= 2) {
            // Get the path and remove any query params
            filePath = urlParts[1].split('?')[0];
          }
        }
        
        console.log('Creating signed URL for path:', filePath);
        
        const { data, error } = await supabase.storage
          .from('scanned-forms')
          .createSignedUrl(filePath, 3600); // 1 hour expiry
        
        if (error) {
          console.error('Error creating signed URL:', error);
          // Don't fall back to raw fileUrl - that won't work
          setSignedUrl(null);
        } else {
          console.log('Signed URL created successfully');
          setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('Error getting signed URL:', err);
        setSignedUrl(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    getSignedUrl();
  }, [fileUrl, isOpen]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const isPDF = filename.toLowerCase().endsWith('.pdf');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{filename}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-12 text-center">{zoom}%</span>
              <Button variant="outline" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              {!isPDF && (
                <Button variant="outline" size="icon" onClick={handleRotate}>
                  <RotateCw className="h-4 w-4" />
                </Button>
              )}
              {signedUrl && (
                <Button variant="outline" size="icon" asChild>
                  <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-auto max-h-[70vh] flex items-center justify-center bg-muted/30 rounded-lg p-4">
          {isLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : signedUrl ? (
            isPDF ? (
              <iframe
                src={signedUrl}
                className="w-full h-[60vh] border-0"
                title={filename}
              />
            ) : (
              <img
                src={signedUrl}
                alt={filename}
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease'
                }}
                className="max-w-full object-contain"
              />
            )
          ) : (
            <div className="text-muted-foreground">Failed to load file</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ScanThumbnailProps {
  fileUrl: string;
  filename: string;
  onClick: () => void;
}

export function ScanThumbnail({ fileUrl, filename, onClick }: ScanThumbnailProps) {
  const isPDF = filename.toLowerCase().endsWith('.pdf');
  
  return (
    <button
      onClick={onClick}
      className="w-20 h-20 border rounded-md overflow-hidden hover:ring-2 hover:ring-primary transition-all bg-muted flex items-center justify-center"
    >
      {isPDF ? (
        <div className="text-xs text-muted-foreground text-center p-2">
          PDF<br />Click to view
        </div>
      ) : (
        <div className="text-xs text-muted-foreground text-center p-2">
          IMG<br />Click to view
        </div>
      )}
    </button>
  );
}

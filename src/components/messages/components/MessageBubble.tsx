
import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClientMessage } from "@/components/messages/types";
import { formatMessageTime, getInitials } from "@/components/messages/utils/messageFormatters";
import { FileIcon, ImageIcon, FileText, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface MessageBubbleProps {
  message: ClientMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [imageError, setImageError] = useState(false);
  const [attachmentError, setAttachmentError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const isImage = message.attachment_type?.startsWith('image/');
  const isPdf = message.attachment_type === 'application/pdf';
  const imageRef = useRef<HTMLImageElement>(null);
  
  const getAttachmentFilename = (url: string) => {
    try {
      // Extract just the filename part
      const pathParts = url.split('/');
      const fileNameWithParams = pathParts[pathParts.length - 1];
      // Remove any query parameters
      const fileName = fileNameWithParams.split('?')[0];
      // Decode URI components
      return decodeURIComponent(fileName);
    } catch (e) {
      return 'attachment';
    }
  };
  
  const handleAttachmentClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (attachmentError) {
      e.preventDefault();
      toast.error("This attachment is currently unavailable", {
        description: "The file may have been deleted or there might be an issue with the storage bucket."
      });
      return;
    }
    
    // For images that are displaying correctly, let the browser handle the click
    if (isImage && !imageError) return;
    
    // For PDFs and other documents, open in a new tab
    if (isPdf || !isImage) {
      // Don't prevent default - allow the browser to open the file
      console.log("Opening attachment in new tab:", message.attachment_url);
    }
  };

  // Try to reload the image if it fails
  const retryLoadImage = () => {
    if (!imageRef.current || !message.attachment_url) return;
    
    setIsRetrying(true);
    
    // Add a cache buster to the URL
    const timestamp = Date.now();
    const cacheBuster = `t=${timestamp}`;
    const url = new URL(message.attachment_url);
    url.searchParams.set('t', timestamp.toString());
      
    imageRef.current.src = url.toString();
    
    // Reset retry state after a timeout
    setTimeout(() => {
      setIsRetrying(false);
    }, 3000);
  };

  // Check if attachment exists when component mounts
  useEffect(() => {
    if (!message.attachment_url) return;
    
    // Create a direct download URL with anti-cache parameter
    const timestamp = Date.now();
    let downloadUrl;
    
    try {
      const url = new URL(message.attachment_url);
      url.searchParams.set('t', timestamp.toString());
      downloadUrl = url.toString();
    } catch (e) {
      // If URL parsing fails, fallback to string manipulation
      downloadUrl = message.attachment_url.includes('?')
        ? `${message.attachment_url}&t=${timestamp}`
        : `${message.attachment_url}?t=${timestamp}`;
    }
    
    // For images, we can use an Image object to check if they load
    if (isImage) {
      const img = new Image();
      
      img.onload = () => {
        console.log("Image loaded successfully:", downloadUrl);
        setImageError(false);
        setAttachmentError(false);
      };
      
      img.onerror = () => {
        console.error("Image failed to load:", downloadUrl);
        setImageError(true);
        setAttachmentError(true);
      };
      
      img.src = downloadUrl;
    } 
    // For non-image files, try a fetch with HEAD method to check availability
    else if (!isImage) {
      // Start by assuming the file exists to avoid blocking the UI
      setAttachmentError(false);
      
      fetch(downloadUrl, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            console.error("Attachment unavailable:", downloadUrl, "Status:", response.status);
            setAttachmentError(true);
          } else {
            console.log("Attachment available:", downloadUrl);
            setAttachmentError(false);
          }
        })
        .catch(error => {
          console.error("Error checking attachment:", error);
          // Set as error since we couldn't verify
          setAttachmentError(true);
        });
    }
  }, [message.attachment_url, isImage]);

  return (
    <div 
      className={`flex ${message.is_from_client ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`flex ${message.is_from_client ? 'flex-row' : 'flex-row-reverse'} max-w-[80%] gap-2`}>
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback className={message.is_from_client ? "bg-mckaynine-100" : "bg-blue-100"}>
            {getInitials(message.sender_name || 'User')}
          </AvatarFallback>
        </Avatar>
        <div>
          <div
            className={`rounded-lg p-3 ${
              message.is_from_client
                ? 'bg-gray-100 text-gray-800'
                : 'bg-mckaynine-600 text-white'
            }`}
          >
            {message.content}
            
            {message.attachment_url && (
              <div className="mt-2">
                {isImage && !imageError ? (
                  <a 
                    href={message.attachment_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                    onClick={handleAttachmentClick}
                  >
                    <img 
                      ref={imageRef}
                      src={message.attachment_url} 
                      alt="Attached image" 
                      className="max-w-full rounded border border-gray-200 max-h-[200px] object-contain bg-white"
                      onError={() => {
                        console.error("Image failed to load in img tag:", message.attachment_url);
                        setImageError(true);
                        setAttachmentError(true);
                      }}
                      onLoad={() => {
                        console.log("Image loaded successfully in img tag");
                        setImageError(false);
                        setAttachmentError(false);
                      }}
                    />
                  </a>
                ) : (
                  <a 
                    href={message.attachment_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 p-2 rounded ${
                      message.is_from_client ? 'bg-white' : 'bg-mckaynine-500'
                    } hover:bg-opacity-90 transition-colors ${attachmentError ? 'opacity-60' : ''}`}
                    onClick={handleAttachmentClick}
                  >
                    <div className="flex-shrink-0">
                      {attachmentError ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : isPdf ? (
                        <FileText className="h-5 w-5" />
                      ) : isImage ? (
                        <ImageIcon className="h-5 w-5" />
                      ) : (
                        <FileIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span className="text-sm truncate flex-1">
                      {getAttachmentFilename(message.attachment_url)}
                    </span>
                    <ExternalLink className="h-4 w-4 flex-shrink-0 opacity-70" />
                  </a>
                )}
                
                {(imageError || attachmentError) && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-red-500">File unavailable</span>
                    <button 
                      onClick={retryLoadImage}
                      disabled={isRetrying}
                      className={`text-xs flex items-center gap-1 ${isRetrying ? 'text-gray-400' : 'text-blue-500 hover:underline'}`}
                    >
                      <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
                      {isRetrying ? 'Retrying...' : 'Retry'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {message.sender_name} · {formatMessageTime(message.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}

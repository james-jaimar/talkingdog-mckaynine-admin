
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClientMessage } from "@/components/messages/types";
import { formatMessageTime, getInitials } from "@/components/messages/utils/messageFormatters";
import { FileIcon, ImageIcon, FileText, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface MessageBubbleProps {
  message: ClientMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [imageError, setImageError] = useState(false);
  const [attachmentError, setAttachmentError] = useState(false);
  const isImage = message.attachment_type?.startsWith('image/');
  const isPdf = message.attachment_type === 'application/pdf';
  
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
    }
  };

  // Check if attachment exists when component mounts
  useEffect(() => {
    if (message.attachment_url) {
      // For images, we can use an Image object to check if they load
      if (isImage) {
        const img = new Image();
        img.onload = () => setAttachmentError(false);
        img.onerror = () => {
          setImageError(true);
          setAttachmentError(true);
          console.error("Image failed to load:", message.attachment_url);
        };
        img.src = message.attachment_url;
      } 
      // For other attachments, we'll check if the URL contains common error indicators
      // or if it does not point to our Supabase bucket
      else if (!message.attachment_url.includes("message-attachments") || 
               message.attachment_url.includes("error") || 
               message.attachment_url.includes("not found")) {
        setAttachmentError(true);
        console.error("Attachment URL appears invalid:", message.attachment_url);
      }
      
      // Additional check - fetch the headers to see if the file exists
      fetch(message.attachment_url, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            setAttachmentError(true);
            console.error("Attachment HEAD request failed:", response.status, response.statusText);
          }
        })
        .catch(err => {
          setAttachmentError(true);
          console.error("Error checking attachment availability:", err);
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
                      src={message.attachment_url} 
                      alt="Attached image" 
                      className="max-w-full rounded border border-gray-200 max-h-[200px] object-contain bg-white"
                      onError={() => {
                        setImageError(true);
                        setAttachmentError(true);
                        console.error("Image failed to load in img tag:", message.attachment_url);
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
                    {attachmentError && (
                      <span className="text-xs text-red-500">(unavailable)</span>
                    )}
                  </a>
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

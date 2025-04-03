
import { useState } from "react";
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
      const filename = url.split('/').pop() || 'attachment';
      // Remove any query parameters
      return decodeURIComponent(filename.split('?')[0]);
    } catch (e) {
      return 'attachment';
    }
  };
  
  const handleAttachmentClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    // Don't try to validate URLs - just open in new tab
    // This avoids HEAD requests which may fail with CORS errors
    if (attachmentError) {
      e.preventDefault();
      toast.error("This attachment is currently unavailable", {
        description: "The file may have been deleted or you may not have permission to access it."
      });
    }
  };

  // Check if attachment exists when component mounts
  useState(() => {
    if (message.attachment_url) {
      const img = new Image();
      img.onload = () => setAttachmentError(false);
      img.onerror = () => setAttachmentError(true);
      
      if (isImage) {
        img.src = message.attachment_url;
      }
    }
  });

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
                    onClick={(e) => handleAttachmentClick(e, message.attachment_url!)}
                  >
                    <img 
                      src={message.attachment_url} 
                      alt="Attached image" 
                      className="max-w-full rounded border border-gray-200 max-h-[200px] object-contain bg-white"
                      onError={() => {
                        setImageError(true);
                        setAttachmentError(true);
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
                    onClick={(e) => handleAttachmentClick(e, message.attachment_url!)}
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

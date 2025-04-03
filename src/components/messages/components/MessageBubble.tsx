
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClientMessage } from "@/components/messages/types";
import { formatMessageTime, getInitials } from "@/components/messages/utils/messageFormatters";
import { FileIcon, ImageIcon, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MessageBubbleProps {
  message: ClientMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const isImage = message.attachment_type?.startsWith('image/');
  const isPdf = message.attachment_type === 'application/pdf';
  
  useEffect(() => {
    // Get a fresh signed URL for attachments when the component mounts
    const getSignedUrl = async () => {
      if (!message.attachment_url) return;
      
      try {
        // Check if it's already a signed URL
        if (message.attachment_url.includes('token=')) {
          setSignedUrl(message.attachment_url);
          return;
        }
        
        // Extract path for direct upload to the bucket
        const directUploadToStorage = async (fullUrl: string) => {
          console.log("Processing URL:", fullUrl);
          
          // Get the file path after the bucket name
          const userId = fullUrl.split('/').filter(Boolean)[6]; // Extract user ID
          const fileName = fullUrl.split('/').pop(); // Get filename
          
          if (!userId || !fileName) {
            console.error("Could not parse URL components:", fullUrl);
            return null;
          }
          
          const filePath = `${userId}/${fileName}`;
          console.log("Extracted file path:", filePath);
          
          const { data, error } = await supabase
            .storage
            .from('message-attachments')
            .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
            
          if (error) {
            console.error("Error creating signed URL:", error);
            return null;
          }
          
          return data.signedUrl;
        };
        
        const signedFileUrl = await directUploadToStorage(message.attachment_url);
        if (signedFileUrl) {
          setSignedUrl(signedFileUrl);
        } else {
          console.error("Failed to get signed URL for:", message.attachment_url);
        }
      } catch (error) {
        console.error("Error processing attachment URL:", error);
      }
    };
    
    if (message.attachment_url) {
      getSignedUrl();
    }
  }, [message.attachment_url]);
  
  const getAttachmentFilename = (url: string) => {
    try {
      // Extract the filename from the URL
      const urlParts = url.split('/').pop()?.split('_') || [];
      // Return the last part which should be the original filename
      return urlParts.length > 1 ? urlParts.slice(1).join('_') : 'attachment';
    } catch (e) {
      return 'attachment';
    }
  };
  
  const getAttachmentUrl = () => {
    return signedUrl || message.attachment_url || '';
  };
  
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
                {isImage ? (
                  <a 
                    href={getAttachmentUrl()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img 
                      src={getAttachmentUrl()} 
                      alt="Attached image" 
                      className="max-w-full rounded border border-gray-200 max-h-[200px] object-contain bg-white"
                    />
                  </a>
                ) : (
                  <a 
                    href={getAttachmentUrl()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 p-2 rounded ${
                      message.is_from_client ? 'bg-white' : 'bg-mckaynine-500'
                    }`}
                  >
                    {isPdf ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <FileIcon className="h-5 w-5" />
                    )}
                    <span className="text-sm truncate">
                      {getAttachmentFilename(message.attachment_url)}
                    </span>
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

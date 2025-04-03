
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, Loader2 } from "lucide-react";

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileSelect: (file: File) => void;
  isSending: boolean;
  isUploading: boolean;
  selectedFile: File | null;
  onClearFile: () => void;
}

export function MessageComposer({ 
  value, 
  onChange, 
  onSend, 
  onFileSelect,
  isSending,
  isUploading,
  selectedFile,
  onClearFile
}: MessageComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4 border-t mt-auto">
      {selectedFile && (
        <div className="mb-2 p-2 bg-gray-100 rounded flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-700 overflow-hidden">
            <div className="flex-shrink-0 mr-2">
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </div>
            <span className="truncate">{selectedFile.name}</span>
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={onClearFile}
            disabled={isUploading}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove file</span>
          </Button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className="flex gap-2"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />
        
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={triggerFileInput}
          disabled={isSending || isUploading || !!selectedFile}
          className="flex-shrink-0"
        >
          <Paperclip className="h-4 w-4" />
          <span className="sr-only">Attach file</span>
        </Button>
        
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your message..."
          className="resize-none min-h-[60px]"
        />
        
        <Button
          type="submit"
          variant="mckaynine"
          disabled={(!value.trim() && !selectedFile) || isSending || isUploading}
          className="flex-shrink-0"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}

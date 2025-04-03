
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
}

export function MessageComposer({ 
  value, 
  onChange, 
  onSend, 
  isSending
}: MessageComposerProps) {
  return (
    <div className="p-4 border-t mt-auto">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className="flex gap-2"
      >
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your message..."
          className="resize-none min-h-[60px]"
        />
        
        <Button
          type="submit"
          variant="mckaynine"
          disabled={!value.trim() || isSending}
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

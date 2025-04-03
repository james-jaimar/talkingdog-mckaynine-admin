
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { getClientMessages, sendClientMessage, subscribeToClientMessages } from "@/components/messages/messageService";
import { ClientMessage } from "@/components/messages/types";

interface HandlerCommunicationsProps {
  clientId: string;
  clientName: string;
}

export function HandlerCommunications({ clientId, clientName }: HandlerCommunicationsProps) {
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch messages for this client
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const messagesData = await getClientMessages(clientId);
        
        // Format messages with sender name
        const formattedMessages = messagesData.map((msg) => ({
          ...msg,
          sender_name: msg.is_from_client ? clientName : msg.profiles?.full_name || 'Staff'
        }));
        
        setMessages(formattedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error loading messages",
          description: "There was a problem loading the conversation history.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (clientId) {
      fetchMessages();
    }
  }, [clientId, clientName, toast]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!clientId) return;
    
    const handleNewMessage = async (newMsg: ClientMessage) => {
      try {
        if (!newMsg.is_from_client) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newMsg.sender_id)
            .single();
            
          newMsg.sender_name = data?.full_name || 'Staff';
        } else {
          newMsg.sender_name = clientName;
        }
        
        // Add new message to state
        setMessages(prev => [...prev, newMsg]);
      } catch (error) {
        console.error("Error processing new message:", error);
      }
    };
    
    const channel = subscribeToClientMessages(clientId, handleNewMessage);
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, clientName]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    setIsSending(true);
    try {
      await sendClientMessage({
        client_id: clientId,
        sender_id: user.id,
        content: newMessage.trim(),
        is_from_client: false
      });
      
      // Clear input field
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Calculate time display for messages
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
           ' · ' + date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4 border-b">
        <CardTitle>Communications</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto max-h-[500px] p-4 space-y-4">
          {isLoading ? (
            <div className="py-10 text-center text-gray-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No messages yet. Send a message to start the conversation.
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
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
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {message.sender_name} · {formatMessageTime(message.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t mt-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="resize-none min-h-[60px]"
            />
            <Button
              type="submit"
              variant="mckaynine"
              disabled={!newMessage.trim() || isSending}
              className="flex-shrink-0"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

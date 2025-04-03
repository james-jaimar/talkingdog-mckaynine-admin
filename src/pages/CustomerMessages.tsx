
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { DashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  id: string;
  client_id: string;
  sender_id: string;
  content: string;
  is_from_client: boolean;
  created_at: string;
  sender_name?: string;
}

export default function CustomerMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Get client ID from user email
  useEffect(() => {
    if (!user) return;
    
    const getClientId = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id')
          .eq('email', user.email)
          .single();
          
        if (error) throw error;
        setClientId(data.id);
      } catch (error) {
        console.error("Error fetching client ID:", error);
      }
    };
    
    getClientId();
  }, [user]);
  
  // Fetch messages for this client
  useEffect(() => {
    if (!clientId) return;
    
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('client_messages')
          .select(`
            id,
            client_id,
            sender_id,
            content,
            is_from_client,
            created_at,
            profiles:sender_id (full_name)
          `)
          .eq('client_id', clientId)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        // Format messages with sender name
        const formattedMessages = data.map((msg: any) => ({
          ...msg,
          sender_name: msg.is_from_client ? 'You' : msg.profiles?.full_name || 'Staff'
        }));
        
        setMessages(formattedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error loading messages",
          description: "There was a problem loading your conversation history.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [clientId, toast]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!clientId) return;
    
    const channel = supabase
      .channel('client-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_messages',
          filter: `client_id=eq.${clientId}`
        },
        async (payload) => {
          // Get sender name for new message
          const newMsg = payload.new as Message;
          try {
            if (!newMsg.is_from_client) {
              const { data } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', newMsg.sender_id)
                .single();
                
              newMsg.sender_name = data?.full_name || 'Staff';
            } else {
              newMsg.sender_name = 'You';
            }
            
            // Add new message to state
            setMessages(prev => [...prev, newMsg]);
          } catch (error) {
            console.error("Error processing new message:", error);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !clientId) return;
    
    setIsSending(true);
    try {
      const { error } = await supabase
        .from('client_messages')
        .insert({
          client_id: clientId,
          sender_id: user?.id || '',
          content: newMessage.trim(),
          is_from_client: true
        });
        
      if (error) throw error;
      
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
    <DashboardLayout>
      <Helmet>
        <title>Messages - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        
        <Card className="min-h-[500px] flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0">
            <div className="flex-1 overflow-y-auto max-h-[500px] p-4 space-y-4">
              {isLoading ? (
                <div className="py-10 text-center text-gray-500">Loading messages...</div>
              ) : !clientId ? (
                <div className="py-10 text-center text-gray-500">
                  Unable to load your profile. Please contact support.
                </div>
              ) : messages.length === 0 ? (
                <div className="py-10 text-center text-gray-500">
                  No messages yet. Send a message to our team and we'll get back to you as soon as possible.
                </div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.is_from_client ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex ${message.is_from_client ? 'flex-row-reverse' : 'flex-row'} max-w-[80%] gap-2`}>
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className={message.is_from_client ? "bg-mckaynine-100" : "bg-blue-100"}>
                          {getInitials(message.sender_name || 'User')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div
                          className={`rounded-lg p-3 ${
                            message.is_from_client
                              ? 'bg-mckaynine-600 text-white'
                              : 'bg-gray-100 text-gray-800'
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
            
            {clientId && (
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

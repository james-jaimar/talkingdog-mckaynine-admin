import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Clock, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

interface EmailLogEntry {
  id: string;
  recipient_email: string;
  subject: string | null;
  sent_at: string;
  status: string | null;
  template_id: string | null;
  template?: {
    name: string | null;
    type: string;
  } | null;
}

interface HandlerEmailHistoryProps {
  handlerId: string;
}

export function HandlerEmailHistory({ handlerId }: HandlerEmailHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailLogEntry | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: emails, isLoading } = useQuery({
    queryKey: ["handler-email-history", handlerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_log")
        .select(`
          id,
          recipient_email,
          subject,
          sent_at,
          status,
          template_id,
          branch_email_templates:template_id (
            name,
            type
          )
        `)
        .eq("handler_id", handlerId)
        .order("sent_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map(email => ({
        ...email,
        template: email.branch_email_templates
      })) as EmailLogEntry[];
    },
    enabled: !!handlerId,
  });

  const displayedEmails = isExpanded ? emails : emails?.slice(0, 3);
  const hasMoreEmails = (emails?.length || 0) > 3;

  const handleViewEmail = (email: EmailLogEntry) => {
    setSelectedEmail(email);
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!emails || emails.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No emails sent yet</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email History
            <Badge variant="secondary" className="ml-auto">
              {emails.length} sent
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {displayedEmails?.map((email) => (
            <div
              key={email.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleViewEmail(email)}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {email.subject || "(No subject)"}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(email.sent_at), "MMM d, yyyy 'at' h:mm a")}
                  {email.template?.name && (
                    <Badge variant="outline" className="text-xs">
                      {email.template.name}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={email.status === "sent" ? "default" : "destructive"}
                  className="text-xs"
                >
                  {email.status || "sent"}
                </Badge>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {hasMoreEmails && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show all ({emails.length} emails)
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Details
            </DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">To:</span>
                    <div className="font-medium">{selectedEmail.recipient_email}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sent:</span>
                    <div className="font-medium">
                      {format(new Date(selectedEmail.sent_at), "PPpp")}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Subject:</span>
                    <div className="font-medium">{selectedEmail.subject || "(No subject)"}</div>
                  </div>
                  {selectedEmail.template?.name && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Template Used:</span>
                      <div className="font-medium">{selectedEmail.template.name}</div>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge 
                      variant={selectedEmail.status === "sent" ? "default" : "destructive"}
                      className="ml-2"
                    >
                      {selectedEmail.status || "sent"}
                    </Badge>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Note: Email content is not stored for privacy reasons. Only metadata is logged.
                  </p>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

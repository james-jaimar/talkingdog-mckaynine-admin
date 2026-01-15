import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Inbox, Send, RefreshCw, Play, Trash2, RotateCcw, Mail, Clock, AlertCircle, CheckCircle2, Search, X } from "lucide-react";
import { useEmailQueue, QueuedEmail } from "@/hooks/useEmailQueue";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function EmailPage() {
  const {
    outbox,
    sent,
    isLoadingOutbox,
    isLoadingSent,
    processQueue,
    retryEmail,
    deleteFromQueue,
    resendEmail,
    refetchOutbox,
    refetchSent,
  } = useEmailQueue();

  const [selectedEmail, setSelectedEmail] = useState<QueuedEmail | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Sent tab filters
  const [sentSearchQuery, setSentSearchQuery] = useState("");
  const [sentDateFilter, setSentDateFilter] = useState<Date | undefined>(undefined);

  // Filter sent emails
  const filteredSent = useMemo(() => {
    return sent.filter((email) => {
      // Search filter - check handler name, email address, and subject
      const searchLower = sentSearchQuery.toLowerCase();
      const handlerName = email.handler 
        ? `${email.handler.first_name} ${email.handler.last_name}`.toLowerCase() 
        : "";
      const matchesSearch = !sentSearchQuery || 
        email.to_email.toLowerCase().includes(searchLower) ||
        email.subject.toLowerCase().includes(searchLower) ||
        handlerName.includes(searchLower);

      // Date filter
      let matchesDate = true;
      if (sentDateFilter && email.sent_at) {
        const emailDate = parseISO(email.sent_at);
        matchesDate = isWithinInterval(emailDate, {
          start: startOfDay(sentDateFilter),
          end: endOfDay(sentDateFilter)
        });
      }

      return matchesSearch && matchesDate;
    });
  }, [sent, sentSearchQuery, sentDateFilter]);

  const clearSentFilters = () => {
    setSentSearchQuery("");
    setSentDateFilter(undefined);
  };

  const getStatusBadge = (status: string, retryCount?: number) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "sending":
        return <Badge variant="default" className="gap-1 bg-blue-500"><RefreshCw className="h-3 w-3 animate-spin" /> Sending</Badge>;
      case "sent":
        return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle2 className="h-3 w-3" /> Sent</Badge>;
      case "failed":
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Failed {retryCount ? `(${retryCount} retries)` : ""}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = outbox.filter(e => e.status === "pending").length;
  const failedCount = outbox.filter(e => e.status === "failed").length;
  const sendingCount = outbox.filter(e => e.status === "sending").length;

  return (
    <DashboardLayout>
      <Helmet>
        <title>Email Manager | McKaynine</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Email Manager
          </h1>
          <p className="text-muted-foreground">
            Manage your email queue and sent messages
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              refetchOutbox();
              refetchSent();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => processQueue.mutate()}
            disabled={processQueue.isPending || pendingCount === 0}
          >
            <Play className="h-4 w-4 mr-2" />
            Process Queue ({pendingCount})
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sending</CardDescription>
            <CardTitle className="text-2xl">{sendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-2xl text-destructive">{failedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sent Today</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {sent.filter(e => {
                const today = new Date();
                const sentDate = e.sent_at ? new Date(e.sent_at) : null;
                return sentDate && sentDate.toDateString() === today.toDateString();
              }).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="outbox" className="space-y-4">
        <TabsList>
          <TabsTrigger value="outbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            Outbox
            {outbox.length > 0 && (
              <Badge variant="secondary" className="ml-1">{outbox.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="h-4 w-4" />
            Sent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outbox">
          <Card>
            <CardHeader>
              <CardTitle>Email Queue</CardTitle>
              <CardDescription>
                Emails waiting to be sent. Queue processes with a 2-second delay between sends.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOutbox ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : outbox.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No emails in queue</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {outbox.map((email) => (
                      <div
                        key={email.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedEmail(email)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(email.status, email.retry_count)}
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(email.created_at), "MMM d, HH:mm")}
                            </span>
                          </div>
                          <p className="font-medium truncate">{email.subject}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            To: {email.to_email}
                            {email.handler && ` (${email.handler.first_name} ${email.handler.last_name})`}
                          </p>
                          {email.error_message && (
                            <p className="text-sm text-destructive mt-1 truncate">
                              Error: {email.error_message}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {email.status === "failed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                retryEmail.mutate(email.id);
                              }}
                              disabled={retryEmail.isPending}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(email.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Sent Emails</CardTitle>
                  <CardDescription>
                    Recently sent emails. Click to view details or resend.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search handler, email, subject..."
                      value={sentSearchQuery}
                      onChange={(e) => setSentSearchQuery(e.target.value)}
                      className="pl-8 w-[220px]"
                    />
                  </div>
                  
                  {/* Date Filter */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Clock className="h-4 w-4" />
                        {sentDateFilter ? format(sentDateFilter, "MMM d, yyyy") : "Filter by date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={sentDateFilter}
                        onSelect={setSentDateFilter}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Clear Filters */}
                  {(sentSearchQuery || sentDateFilter) && (
                    <Button variant="ghost" size="sm" onClick={clearSentFilters} className="gap-1">
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              {/* Filter summary */}
              {(sentSearchQuery || sentDateFilter) && (
                <div className="text-sm text-muted-foreground mt-2">
                  Showing {filteredSent.length} of {sent.length} emails
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isLoadingSent ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSent.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Send className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{sent.length === 0 ? "No sent emails" : "No emails match your filters"}</p>
                  {sent.length > 0 && (
                    <Button variant="link" onClick={clearSentFilters} className="mt-2">
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredSent.map((email) => (
                      <div
                        key={email.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedEmail(email)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(email.status)}
                            <span className="text-sm text-muted-foreground">
                              {email.sent_at && format(new Date(email.sent_at), "MMM d, HH:mm")}
                            </span>
                          </div>
                          <p className="font-medium truncate">{email.subject}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            To: {email.to_email}
                            {email.handler && ` (${email.handler.first_name} ${email.handler.last_name})`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              resendEmail.mutate(email.id);
                            }}
                            disabled={resendEmail.isPending}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Resend
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Preview Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEmail && getStatusBadge(selectedEmail.status, selectedEmail.retry_count)}
              Email Details
            </DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">To:</span> {selectedEmail.to_email}
                </div>
                <div>
                  <span className="font-medium">From:</span> {selectedEmail.from_email || "Default"}
                </div>
                <div>
                  <span className="font-medium">Created:</span>{" "}
                  {format(new Date(selectedEmail.created_at), "MMM d, yyyy HH:mm")}
                </div>
                {selectedEmail.sent_at && (
                  <div>
                    <span className="font-medium">Sent:</span>{" "}
                    {format(new Date(selectedEmail.sent_at), "MMM d, yyyy HH:mm")}
                  </div>
                )}
              </div>
              <div>
                <span className="font-medium text-sm">Subject:</span>
                <p className="mt-1">{selectedEmail.subject}</p>
              </div>
              {selectedEmail.error_message && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <span className="font-medium text-sm text-destructive">Error:</span>
                  <p className="text-sm text-destructive mt-1">{selectedEmail.error_message}</p>
                </div>
              )}
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Attachments:</span>
                  <div className="flex gap-2 mt-1">
                    {selectedEmail.attachments.map((att: any, idx: number) => (
                      <Badge key={idx} variant="outline">{att.name || att.filename}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="font-medium text-sm">Content Preview:</span>
                <ScrollArea className="h-[300px] mt-2 border rounded-lg">
                  <div
                    className="p-4"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.html_content }}
                  />
                </ScrollArea>
              </div>
              <div className="flex justify-end gap-2">
                {selectedEmail.status === "failed" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      retryEmail.mutate(selectedEmail.id);
                      setSelectedEmail(null);
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                )}
                {selectedEmail.status === "sent" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      resendEmail.mutate(selectedEmail.id);
                      setSelectedEmail(null);
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Resend
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email from Queue?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this email from the queue. It will not be sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  deleteFromQueue.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

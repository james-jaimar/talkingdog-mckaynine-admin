import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Inbox, Send, RefreshCw, Play, Trash2, RotateCcw, Mail, Clock, AlertCircle, CheckCircle2, Search, X, Download, Paperclip, FileText } from "lucide-react";
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

// Email Templates imports
import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";
import { Eye, Check, Plus, Edit } from "lucide-react";
import { TemplatePreviewModal } from "@/components/email-templates/TemplatePreviewModal";
import { TemplateEditorModal } from "@/components/email-templates/TemplateEditorModal";
import { AttachmentLibrary } from "@/components/email-templates/AttachmentLibrary";

function EmailTemplatesTab() {
  const { templates, isLoading, deleteTemplate, updateTemplate } = useEmailTemplates();
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);

  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsEditorOpen(true);
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleDelete = async () => {
    if (templateToDelete) {
      await deleteTemplate.mutateAsync(templateToDelete.id);
      setTemplateToDelete(null);
    }
  };

  const handleToggleActive = async (template: EmailTemplate) => {
    await updateTemplate.mutateAsync({ id: template.id, is_active: !template.is_active });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="attachments" className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Attachments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : templates.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-3 rounded-full bg-muted mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No email templates yet</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-4">
                  Create reusable email templates with merge fields for personalized handler communications.
                </p>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card 
                  key={template.id}
                  className={`relative transition-all ${
                    template.is_active 
                      ? 'border-primary/50 shadow-md' 
                      : 'opacity-80'
                  }`}
                >
                  <div className="absolute top-3 right-3">
                    {template.is_active ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        <Check className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 pr-16">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          {template.subject}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{template.type}</Badge>
                      {template.class_type && (
                        <Badge variant="secondary">{template.class_type}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Updated: {new Date(template.updated_at).toLocaleDateString()}
                    </p>
                  </CardContent>

                  <div className="flex justify-between items-center pt-3 border-t px-6 pb-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={() => handleToggleActive(template)}
                        disabled={updateTemplate.isPending}
                      />
                      <span className="text-sm text-muted-foreground">
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setTemplateToDelete(template)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Card className="bg-muted/30 border-dashed">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-full bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">How it works</h3>
                  <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                    <li>• Create templates with merge fields like <code className="bg-muted px-1 rounded">{"{{handler_name}}"}</code> and <code className="bg-muted px-1 rounded">{"{{dog_name}}"}</code></li>
                    <li>• Merge fields are automatically replaced when you send an email</li>
                    <li>• Active templates appear in the "Use Template" option when emailing handlers</li>
                    <li>• Attach info packs or documents from the Attachments tab when sending</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attachments">
          <AttachmentLibrary />
        </TabsContent>
      </Tabs>

      <TemplateEditorModal
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        template={selectedTemplate}
      />

      <TemplatePreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        template={selectedTemplate}
      />

      <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function EmailPage() {
  const {
    outbox,
    sent,
    isLoadingOutbox,
    isLoadingSent,
    processQueue,
    approveEmail,
    retryEmail,
    deleteFromQueue,
    resendEmail,
    refetchOutbox,
    refetchSent,
  } = useEmailQueue();

  const [selectedEmail, setSelectedEmail] = useState<QueuedEmail | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeMainTab, setActiveMainTab] = useState("queue");
  
  // Sent tab filters
  const [sentSearchQuery, setSentSearchQuery] = useState("");
  const [sentDateFilter, setSentDateFilter] = useState<Date | undefined>(undefined);

  // Filter sent emails
  const filteredSent = useMemo(() => {
    return sent.filter((email) => {
      const searchLower = sentSearchQuery.toLowerCase();
      const handlerName = email.handler 
        ? `${email.handler.first_name} ${email.handler.last_name}`.toLowerCase() 
        : "";
      const matchesSearch = !sentSearchQuery || 
        email.to_email.toLowerCase().includes(searchLower) ||
        email.subject.toLowerCase().includes(searchLower) ||
        handlerName.includes(searchLower);

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
      case "review":
        return <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600"><AlertCircle className="h-3 w-3" /> Review</Badge>;
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

  const reviewCount = outbox.filter(e => e.status === "review").length;
  const pendingCount = outbox.filter(e => e.status === "pending").length;
  const failedCount = outbox.filter(e => e.status === "failed").length;
  const sendingCount = outbox.filter(e => e.status === "sending").length;

  return (
    <DashboardLayout>
      <Helmet>
        <title>Email | McKaynine</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mail className="h-8 w-8" />
              Email
            </h1>
            <p className="text-muted-foreground">
              Manage your email queue, sent messages, and templates
            </p>
          </div>
        </div>

        <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="queue" className="gap-2">
              <Inbox className="h-4 w-4" />
              Email Queue
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-4">
            <div className="flex gap-2 justify-end">
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

            {/* Stats */}
            <div className="grid grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Needs Review</CardDescription>
                  <CardTitle className="text-2xl text-amber-600">{reviewCount}</CardTitle>
                </CardHeader>
              </Card>
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
                                {email.status === "review" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 hover:text-green-700 border-green-500"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      approveEmail.mutate(email.id);
                                    }}
                                    disabled={approveEmail.isPending}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                )}
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
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search handler, email, subject..."
                            value={sentSearchQuery}
                            onChange={(e) => setSentSearchQuery(e.target.value)}
                            className="pl-8 w-[220px]"
                          />
                        </div>
                        
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

                        {(sentSearchQuery || sentDateFilter) && (
                          <Button variant="ghost" size="sm" onClick={clearSentFilters} className="gap-1">
                            <X className="h-4 w-4" />
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
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
          </TabsContent>

          <TabsContent value="templates">
            <EmailTemplatesTab />
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
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {selectedEmail.attachments.map((att: any, idx: number) => {
                        const filename = att.name || att.filename;
                        const hasContent = att.content && (att.encoding === "base64" || att.type);
                        
                        const handleDownload = () => {
                          if (!hasContent) return;
                          
                          try {
                            const byteCharacters = atob(att.content);
                            const byteNumbers = new Array(byteCharacters.length);
                            for (let i = 0; i < byteCharacters.length; i++) {
                              byteNumbers[i] = byteCharacters.charCodeAt(i);
                            }
                            const byteArray = new Uint8Array(byteNumbers);
                            const blob = new Blob([byteArray], { type: att.contentType || att.type || 'application/pdf' });
                            
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = filename;
                            link.click();
                            URL.revokeObjectURL(link.href);
                          } catch (error) {
                            console.error("Error downloading attachment:", error);
                          }
                        };
                        
                        return (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={handleDownload}
                            disabled={!hasContent}
                          >
                            <Paperclip className="h-4 w-4" />
                            {filename}
                            {hasContent && <Download className="h-3 w-3" />}
                          </Button>
                        );
                      })}
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

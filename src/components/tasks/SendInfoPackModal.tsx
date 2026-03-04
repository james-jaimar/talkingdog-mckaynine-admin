import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskWithHandler } from "@/hooks/useAllTasks";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { useEmailAttachments, EmailAttachment } from "@/hooks/useEmailAttachments";
import { useEmailQueue } from "@/hooks/useEmailQueue";
import { renderTemplate, TemplateVariables, getVariablesWithSignature } from "@/lib/email/template-renderer";
import { wrapEmailContent, getEmailSignature } from "@/lib/email/email-wrapper";
import { useBranch } from "@/context/BranchContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Eye, Mail, User, Dog, AlertCircle, Paperclip, FileText, X } from "lucide-react";

interface SendInfoPackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithHandler | null;
}

export function SendInfoPackModal({ open, onOpenChange, task }: SendInfoPackModalProps) {
  const { templates, isLoading: templatesLoading } = useEmailTemplates();
  const { attachments, getAttachmentUrl } = useEmailAttachments();
  const { addToQueue } = useEmailQueue();
  const { currentBranch } = useBranch();
  const queryClient = useQueryClient();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");
  const [isSending, setIsSending] = useState(false);
  const [dogName, setDogName] = useState<string>("");
  const [includeBankingDetails, setIncludeBankingDetails] = useState(true);
  const [selectedAttachments, setSelectedAttachments] = useState<EmailAttachment[]>([]);

  // Show all active templates - admin can choose any template
  const availableTemplates = templates.filter(t => t.is_active);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Fetch dog information when task changes
  useEffect(() => {
    async function fetchDogInfo() {
      if (!task?.handler_id) return;
      
      // Use dog_name from task if available (new tasks have it)
      if (task.dog_name) {
        setDogName(task.dog_name);
        return;
      }
      
      // Fallback: fetch first dog for handler
      const { data: dogs } = await supabase
        .from("dogs")
        .select("id, name")
        .eq("client_id", task.handler_id)
        .limit(1);
      
      if (dogs && dogs.length > 0) {
        setDogName(dogs[0].name);
      }
    }
    
    if (open && task) {
      fetchDogInfo();
      setSelectedTemplateId("");
      setCustomMessage("");
      setActiveTab("compose");
      setIncludeBankingDetails(true);
      setSelectedAttachments([]);
    }
  }, [open, task]);

  // Remove attachment from selection
  const removeAttachment = (id: string) => {
    setSelectedAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Build template variables for preview
  const getTemplateVariables = (): TemplateVariables => {
    const branchName = currentBranch?.name || "McKaynine";
    
    return getVariablesWithSignature({
      handler_name: task?.handler?.first_name || "",
      handler_full_name: task?.handler ? `${task.handler.first_name} ${task.handler.last_name}` : "",
      handler_email: task?.handler?.email || "",
      dog_name: dogName,
      completed_class: task?.class_type || "",
      next_class: selectedTemplate?.class_type || "",
      branch_name: branchName,
      branch_email: (currentBranch as any)?.email || "",
      branch_phone: (currentBranch as any)?.phone || "",
      base_url: "https://mckaynine.talkingdog.co.za",
      enrollment_link: "",
      custom_message: customMessage.replace(/\n/g, '<br>'),
    });
  };

  const handleSend = async () => {
    if (!task || !selectedTemplate || !task.handler?.email) {
      toast.error("Missing required information");
      return;
    }

    setIsSending(true);
    try {
      const branchName = currentBranch?.name || "McKaynine";
      const variables: TemplateVariables = getVariablesWithSignature({
        handler_name: task.handler?.first_name || "",
        handler_full_name: task.handler ? `${task.handler.first_name} ${task.handler.last_name}` : "",
        handler_email: task.handler?.email || "",
        dog_name: dogName,
        completed_class: task.class_type || "",
        next_class: selectedTemplate.class_type || "",
        branch_name: branchName,
        branch_email: (currentBranch as any)?.email || "",
        branch_phone: (currentBranch as any)?.phone || "",
        base_url: "https://mckaynine.talkingdog.co.za",
        enrollment_link: "",
        custom_message: customMessage.replace(/\n/g, '<br>'),
      });
      
      // Render the user-created template content
      const renderedContent = renderTemplate(selectedTemplate.content, variables);
      const renderedSubject = renderTemplate(selectedTemplate.subject, variables);

      // Wrap content with professional template including banking details
      const wrappedHtml = wrapEmailContent(renderedContent, {
        branchName: currentBranch?.name,
        branchEmail: (currentBranch as any)?.email,
        branchPhone: (currentBranch as any)?.phone,
        includeBankingDetails,
      });

      // Get attachment URLs for email
      const attachmentUrls = selectedAttachments.map(a => ({
        name: a.name,
        url: getAttachmentUrl(a),
      }));

      // Add to email queue instead of sending directly
      await addToQueue.mutateAsync({
        to_email: task.handler.email,
        subject: renderedSubject,
        html_content: wrappedHtml,
        from_name: currentBranch?.name ? `${currentBranch.name} McKaynine` : "McKaynine",
        attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
        handler_id: task.handler_id,
        template_id: selectedTemplate.id,
      });

      // Mark task as completed
      await supabase
        .from("handler_tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      // Update handler_class_status if linked
      if (task.class_status_id) {
        await supabase
          .from("handler_class_status")
          .update({
            action_completed: true,
            action_completed_at: new Date().toISOString(),
          })
          .eq("id", task.class_status_id);
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["pending-task-count"] });

      toast.success(`Email queued for ${task.handler.email}`);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error queuing email:", error);
      toast.error(`Failed to queue: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  if (!task) return null;

  // Generate preview using the user-created template
  const getPreview = () => {
    if (!selectedTemplate) return { html: "", subject: "" };
    
    const variables = getTemplateVariables();
    const renderedHtml = renderTemplate(selectedTemplate.content, variables);
    const renderedSubject = renderTemplate(selectedTemplate.subject, variables);
    
    // Wrap for preview
    const wrappedHtml = wrapEmailContent(renderedHtml, {
      branchName: currentBranch?.name,
      branchEmail: (currentBranch as any)?.email,
      branchPhone: (currentBranch as any)?.phone,
      includeBankingDetails,
    });
    
    return { html: wrappedHtml, subject: renderedSubject };
  };

  const preview = getPreview();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Info Pack
          </DialogTitle>
          <DialogDescription>
            Send class information to the handler via email
          </DialogDescription>
        </DialogHeader>

        {/* Handler Info */}
        <div className="flex flex-wrap gap-4 py-2 px-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {task.handler?.first_name} {task.handler?.last_name}
            </span>
            <span className="text-muted-foreground">({task.handler?.email})</span>
          </div>
          {dogName && (
            <div className="flex items-center gap-2">
              <Dog className="h-4 w-4 text-muted-foreground" />
              <span>{dogName}</span>
            </div>
          )}
          {task.class_type && (
            <Badge variant="secondary">{task.class_type}</Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "compose" | "preview")} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2" disabled={!selectedTemplate}>
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="flex-1 overflow-auto space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Template</Label>
              {templatesLoading ? (
                <div className="text-sm text-muted-foreground">Loading templates...</div>
              ) : availableTemplates.length === 0 ? (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      No templates available
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Please create a template in Settings → Email Templates first.
                    </p>
                  </div>
                </div>
              ) : (
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <span>{template.name}</span>
                          {template.class_type && (
                            <Badge variant="outline" className="text-xs">
                              {template.class_type}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-message">Personal Message (Optional)</Label>
              <Textarea
                id="custom-message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a personal note that will appear at the top of the email..."
                className="min-h-[80px]"
              />
            </div>

            {/* Banking Details Toggle */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Checkbox
                id="include-banking"
                checked={includeBankingDetails}
                onCheckedChange={(checked) => setIncludeBankingDetails(!!checked)}
              />
              <label htmlFor="include-banking" className="text-sm cursor-pointer">
                Include banking details in email footer
              </label>
            </div>

            {/* Attachment Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments
              </Label>
              
              {selectedAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedAttachments.map((attachment) => (
                    <Badge 
                      key={attachment.id} 
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3" />
                      {attachment.name}
                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No attachments available. Upload files in Email Templates → Attachments.
                </p>
              ) : (
                <Select onValueChange={(id) => {
                  const attachment = attachments.find(a => a.id === id);
                  if (attachment && !selectedAttachments.some(a => a.id === id)) {
                    setSelectedAttachments(prev => [...prev, attachment]);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add attachment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {attachments
                      .filter(a => !selectedAttachments.some(sa => sa.id === a.id))
                      .map((attachment) => (
                        <SelectItem key={attachment.id} value={attachment.id}>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{attachment.name}</span>
                            {attachment.class_type && (
                              <Badge variant="outline" className="text-xs">
                                {attachment.class_type}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
            {selectedTemplate ? (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted p-3 border-b space-y-1">
                  <div>
                    <strong>To:</strong> {task.handler?.email}
                  </div>
                  <div>
                    <strong>Subject:</strong> {preview.subject}
                  </div>
                  {selectedAttachments.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Paperclip className="h-3 w-3" />
                      <span>{selectedAttachments.length} attachment(s)</span>
                    </div>
                  )}
                </div>
                <iframe
                  srcDoc={preview.html}
                  className="w-full min-h-[400px] bg-white"
                  title="Email Preview"
                />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select a template to preview
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={!selectedTemplate || isSending}
          >
            {isSending ? (
              <>
                <span className="mr-2 animate-spin">⟳</span>
                Queuing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Queue Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

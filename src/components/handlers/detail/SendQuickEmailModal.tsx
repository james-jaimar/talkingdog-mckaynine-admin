import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useTemplateConfigurations } from "@/hooks/useTemplateConfigurations";
import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";
import { useEmailAttachments, EmailAttachment } from "@/hooks/useEmailAttachments";
import { useEmailQueue } from "@/hooks/useEmailQueue";
import { renderTemplate, TemplateVariables, getVariablesWithSignature } from "@/lib/email/template-renderer";
import { generateCourseTableHtml } from "@/components/email-templates/CourseTableEditor";
import { generateCourseDescriptionHtml } from "@/components/email-templates/CourseDescriptionEditor";
import { wrapEmailContent, getEmailSignature } from "@/lib/email/email-wrapper";
import { useBranch } from "@/context/BranchContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Eye, Mail, User, Dog, FileText, Paperclip, X } from "lucide-react";
import { getPrebuiltTemplate } from "@/lib/email/templates";

interface DogInfo {
  id: string;
  name: string;
  breed: string;
}

interface SendQuickEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handler: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    secondary_email?: string;
    secondary_first_name?: string;
  };
}

export function SendQuickEmailModal({ open, onOpenChange, handler }: SendQuickEmailModalProps) {
  const { templatesWithStatus, isLoading: prebuiltLoading } = useTemplateConfigurations();
  const { templates: customTemplates, isLoading: customLoading } = useEmailTemplates();
  const { attachments, getAttachmentUrl } = useEmailAttachments();
  const { addToQueue } = useEmailQueue();
  const { currentBranch } = useBranch();
  
  const [emailMode, setEmailMode] = useState<"template" | "custom">("custom");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateType, setTemplateType] = useState<"prebuilt" | "custom">("custom");
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");
  const [isSending, setIsSending] = useState(false);
  const [includeBankingDetails, setIncludeBankingDetails] = useState(true);
  const [includeSecondaryContact, setIncludeSecondaryContact] = useState(true);
  
  // Dog selection
  const [dogs, setDogs] = useState<DogInfo[]>([]);
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);
  
  // Attachment selection
  const [selectedAttachments, setSelectedAttachments] = useState<EmailAttachment[]>([]);

  const templatesLoading = prebuiltLoading || customLoading;
  
  // Combine prebuilt templates and custom templates
  const availablePrebuiltTemplates = templatesWithStatus.filter(t => t.isConfigured && t.isActive);
  const availableCustomTemplates = customTemplates.filter(t => t.is_active);
  
  // Find selected template based on type
  const selectedPrebuiltTemplate = templateType === "prebuilt" 
    ? templatesWithStatus.find(t => t.code === selectedTemplateId)
    : null;
  const selectedCustomTemplate = templateType === "custom"
    ? customTemplates.find(t => t.id === selectedTemplateId)
    : null;

  // Get selected dog names for display and template
  const selectedDogNames = dogs
    .filter(d => selectedDogIds.includes(d.id))
    .map(d => d.name)
    .join(" & ");

  // Fetch all dogs for this handler
  useEffect(() => {
    async function fetchDogs() {
      if (!handler.id) return;
      
      const { data } = await supabase
        .from("dogs")
        .select("id, name, breed")
        .eq("client_id", handler.id)
        .order("name");
      
      if (data && data.length > 0) {
        setDogs(data);
        // Auto-select all dogs if only one, otherwise none
        if (data.length === 1) {
          setSelectedDogIds([data[0].id]);
        }
      } else {
        setDogs([]);
      }
    }
    
    if (open) {
      fetchDogs();
      setSelectedTemplateId("");
      setTemplateType("custom");
      setCustomSubject("");
      setCustomMessage("");
      setActiveTab("compose");
      setEmailMode("custom");
      setSelectedDogIds([]);
      setSelectedAttachments([]);
      setIncludeBankingDetails(true);
      setIncludeSecondaryContact(!!handler.secondary_email);
    }
  }, [open, handler.id, handler.secondary_email]);

  const toggleDogSelection = (dogId: string) => {
    setSelectedDogIds(prev => 
      prev.includes(dogId) 
        ? prev.filter(id => id !== dogId)
        : [...prev, dogId]
    );
  };

  const toggleAttachment = (attachment: EmailAttachment) => {
    setSelectedAttachments(prev => {
      const isSelected = prev.some(a => a.id === attachment.id);
      if (isSelected) {
        return prev.filter(a => a.id !== attachment.id);
      }
      return [...prev, attachment];
    });
  };

  const removeAttachment = (attachmentId: string) => {
    setSelectedAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  // Build template variables
  const getTemplateVariables = (): TemplateVariables => {
    const configVars = selectedPrebuiltTemplate?.configuration?.variables || {};
    const branchName = currentBranch?.name || "McKaynine";
    
    return getVariablesWithSignature({
      handler_name: handler.first_name || "",
      handler_full_name: `${handler.first_name} ${handler.last_name}`,
      handler_email: handler.email || "",
      dog_name: selectedDogNames || "your dog",
      branch_name: branchName,
      branch_email: (currentBranch as any)?.email || "",
      branch_phone: (currentBranch as any)?.phone || "",
      base_url: "https://mckaynine.talkingdog.co.za",
      // Merge configured template variables (but allow UI fields to override)
      ...configVars,
      custom_message: customMessage.replace(/\n/g, '<br>'),
    });
  };

  const handleSend = async () => {
    if (!handler.email) {
      toast.error("Handler has no email address");
      return;
    }

    if (emailMode === "custom" && (!customSubject.trim() || !customMessage.trim())) {
      toast.error("Please enter a subject and message");
      return;
    }

    if (emailMode === "template" && !selectedTemplateId) {
      toast.error("Please select a template");
      return;
    }

    setIsSending(true);
    try {
      let subject: string;
      let html: string;
      let templateId: string | null = null;

      // Get attachment URLs for email
      const attachmentUrls = selectedAttachments.map(a => ({
        name: a.name,
        url: getAttachmentUrl(a),
      }));

      if (emailMode === "custom") {
        subject = customSubject;
        // Wrap custom message in professional template
        const messageContent = `<div style="white-space: pre-wrap; line-height: 1.8;">${customMessage.replace(/\n/g, '<br>')}</div>`;
        html = wrapEmailContent(messageContent, {
          branchName: currentBranch?.name,
          branchEmail: (currentBranch as any)?.email,
          branchPhone: (currentBranch as any)?.phone,
          includeBankingDetails,
        });
      } else if (templateType === "prebuilt" && selectedPrebuiltTemplate) {
        const template = getPrebuiltTemplate(selectedTemplateId);
        if (!template) throw new Error("Template not found");
        
        const variables = getTemplateVariables();
        const configVars = selectedPrebuiltTemplate.configuration?.variables || {};
        
        const rawHtml = template.getHtml(configVars);
        const renderedContent = renderTemplate(rawHtml, variables);
        // Wrap prebuilt templates with professional wrapper (adds signature + banking)
        html = wrapEmailContent(renderedContent, {
          branchName: currentBranch?.name,
          branchEmail: (currentBranch as any)?.email,
          branchPhone: (currentBranch as any)?.phone,
          includeBankingDetails: true,
        });
        subject = renderTemplate(template.subject, variables);
      } else if (templateType === "custom" && selectedCustomTemplate) {
        // Use custom template from branch_email_templates
        templateId = selectedCustomTemplate.id;
        const variables = getTemplateVariables();
        
        // Inject structured course data if template uses placeholders
        const templateVars = selectedCustomTemplate.variables as any;
        if (templateVars?.course_data && selectedCustomTemplate.content.includes("{{course_table}}")) {
          variables.course_table = generateCourseTableHtml(templateVars.course_data, templateVars.course_footnote);
        }
        if (templateVars?.course_descriptions && selectedCustomTemplate.content.includes("{{course_description}}")) {
          variables.course_description = generateCourseDescriptionHtml(templateVars.course_descriptions);
        }
        
        subject = renderTemplate(selectedCustomTemplate.subject, variables);
        const renderedContent = renderTemplate(selectedCustomTemplate.content, variables);
        html = wrapEmailContent(renderedContent, {
          branchName: currentBranch?.name,
          branchEmail: (currentBranch as any)?.email,
          branchPhone: (currentBranch as any)?.phone,
          includeBankingDetails: true,
        });
      } else {
        throw new Error("No valid template selected");
      }

      const fromEmail = currentBranch?.name?.toLowerCase().includes("randburg")
        ? "randburg@mckaynine.co.za"
        : "delta@mckaynine.co.za";

      // Add to email queue instead of sending directly
      await addToQueue.mutateAsync({
        to_email: handler.email,
        subject,
        html_content: html,
        from_name: currentBranch?.name ? `${currentBranch.name} McKaynine` : "McKaynine",
        from_email: fromEmail,
        attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
        handler_id: handler.id,
        template_id: templateId,
      });

      // Also queue for secondary contact if enabled and exists
      if (includeSecondaryContact && handler.secondary_email) {
        await addToQueue.mutateAsync({
          to_email: handler.secondary_email,
          subject,
          html_content: html,
          from_name: currentBranch?.name ? `${currentBranch.name} McKaynine` : "McKaynine",
          from_email: fromEmail,
          attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
          handler_id: handler.id,
          template_id: templateId,
        });
        toast.success(`Emails queued for ${handler.email} and ${handler.secondary_email}`);
      } else {
        toast.success(`Email queued for ${handler.email}`);
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error queuing email:", error);
      toast.error(`Failed to queue: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Generate preview
  const getPreview = () => {
    if (emailMode === "custom") {
      const messageContent = `<div style="white-space: pre-wrap; line-height: 1.8;">${customMessage.replace(/\n/g, '<br>')}</div>`;
      return {
        subject: customSubject,
        html: wrapEmailContent(messageContent, {
          branchName: currentBranch?.name,
          branchEmail: (currentBranch as any)?.email,
          branchPhone: (currentBranch as any)?.phone,
          includeBankingDetails,
        }),
      };
    }

    // Handle prebuilt templates
    if (templateType === "prebuilt" && selectedPrebuiltTemplate) {
      const template = getPrebuiltTemplate(selectedTemplateId);
      if (!template) return { html: "", subject: "" };
      
      const variables = getTemplateVariables();
      const configVars = selectedPrebuiltTemplate.configuration?.variables || {};
      
      const rawHtml = template.getHtml(configVars);
      const renderedHtml = renderTemplate(rawHtml, variables);
      const renderedSubject = renderTemplate(template.subject, variables);
      
      // Wrap with email template for proper styling
      const html = wrapEmailContent(renderedHtml, {
        branchName: currentBranch?.name,
        branchEmail: (currentBranch as any)?.email,
        branchPhone: (currentBranch as any)?.phone,
        includeBankingDetails: true,
      });
      
      return { html, subject: renderedSubject };
    }

    // Handle custom templates
    if (templateType === "custom" && selectedCustomTemplate) {
      const variables = getTemplateVariables();
      const renderedSubject = renderTemplate(selectedCustomTemplate.subject, variables);
      const renderedContent = renderTemplate(selectedCustomTemplate.content, variables);
      const html = wrapEmailContent(renderedContent, {
        branchName: currentBranch?.name,
        branchEmail: (currentBranch as any)?.email,
        branchPhone: (currentBranch as any)?.phone,
        includeBankingDetails: true,
      });
      
      return { html, subject: renderedSubject };
    }

    return { html: "", subject: "" };
  };

  const preview = getPreview();
  const hasTemplates = availableCustomTemplates.length > 0 || availablePrebuiltTemplates.length > 0;
  const hasSelectedTemplate = templateType === "prebuilt" ? !!selectedPrebuiltTemplate : !!selectedCustomTemplate;
  const canPreview = emailMode === "custom" ? (customSubject && customMessage) : hasSelectedTemplate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Email
          </DialogTitle>
          <DialogDescription>
            Send an email directly to {handler.first_name} {handler.last_name}
          </DialogDescription>
        </DialogHeader>

        {/* Handler & Dog Selection */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-4 py-2 px-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {handler.first_name} {handler.last_name}
              </span>
              <span className="text-muted-foreground">({handler.email})</span>
            </div>
          </div>

          {/* Dog Selection */}
          {dogs.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Dog className="h-4 w-4" />
                {dogs.length === 1 ? "Dog" : "Select Dog(s)"}
              </Label>
              <div className="flex flex-wrap gap-2">
                {dogs.map((dog) => (
                  <label
                    key={dog.id}
                    htmlFor={`dog-${dog.id}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedDogIds.includes(dog.id)
                        ? "bg-primary/10 border-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    <Checkbox
                      id={`dog-${dog.id}`}
                      checked={selectedDogIds.includes(dog.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDogIds(prev => [...prev, dog.id]);
                        } else {
                          setSelectedDogIds(prev => prev.filter(id => id !== dog.id));
                        }
                      }}
                    />
                    <span className="font-medium">{dog.name}</span>
                    <span className="text-xs text-muted-foreground">({dog.breed})</span>
                  </label>
                ))}
              </div>
              {selectedDogNames && (
                <p className="text-sm text-muted-foreground">
                  Email will reference: <strong>{selectedDogNames}</strong>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Email Mode Selection */}
        <div className="flex gap-2">
          <Button
            variant={emailMode === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setEmailMode("custom")}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            Custom Email
          </Button>
          <Button
            variant={emailMode === "template" ? "default" : "outline"}
            size="sm"
            onClick={() => setEmailMode("template")}
            className="flex-1"
          >
            <Mail className="h-4 w-4 mr-2" />
            Use Template
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "compose" | "preview")} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2" disabled={!canPreview}>
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="flex-1 overflow-auto space-y-4 mt-4">
            {emailMode === "custom" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Email subject..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="min-h-[120px]"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Select Template</Label>
                  {templatesLoading ? (
                    <div className="text-sm text-muted-foreground">Loading templates...</div>
                  ) : !hasTemplates ? (
                    <div className="text-sm text-muted-foreground">
                      No templates available. Create templates in Email Templates settings.
                    </div>
                  ) : (
                    <Select 
                      value={selectedTemplateId} 
                      onValueChange={(value) => {
                        // Determine if this is a custom template or prebuilt
                        const isCustom = availableCustomTemplates.some(t => t.id === value);
                        setTemplateType(isCustom ? "custom" : "prebuilt");
                        setSelectedTemplateId(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Custom Templates */}
                        {availableCustomTemplates.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                              Your Templates
                            </div>
                            {availableCustomTemplates.map((template) => (
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
                          </>
                        )}
                        
                        {/* Prebuilt Templates */}
                        {availablePrebuiltTemplates.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                              System Templates
                            </div>
                            {availablePrebuiltTemplates.map((template) => (
                              <SelectItem key={template.code} value={template.code}>
                                <div className="flex items-center gap-2">
                                  <span>{template.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {template.classType}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Show template preview info */}
                {selectedPrebuiltTemplate?.configuration?.variables && (
                  <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                    <p className="font-medium mb-2">Template Details:</p>
                    {selectedPrebuiltTemplate.configuration.variables.class_day_time && (
                      <p><strong>When:</strong> {selectedPrebuiltTemplate.configuration.variables.class_day_time}</p>
                    )}
                    {selectedPrebuiltTemplate.configuration.variables.class_dates && (
                      <p><strong>Dates:</strong> {selectedPrebuiltTemplate.configuration.variables.class_dates}</p>
                    )}
                  </div>
                )}

                {selectedCustomTemplate && (
                  <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                    <p className="font-medium">Subject: {selectedCustomTemplate.subject}</p>
                  </div>
                )}

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
              </>
            )}

            {/* Banking Details Toggle - shown for both modes */}
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

            {/* Attachment Selection - shown for both modes */}
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
                  No attachments available. Upload files in Email Templates &gt; Attachments.
                </p>
              ) : (
                <Select onValueChange={(id) => {
                  const attachment = attachments.find(a => a.id === id);
                  if (attachment && !selectedAttachments.some(a => a.id === id)) {
                    setSelectedAttachments(prev => [...prev, attachment]);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add an attachment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {attachments
                      .filter(a => !selectedAttachments.some(sel => sel.id === a.id))
                      .map((attachment) => (
                        <SelectItem key={attachment.id} value={attachment.id}>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{attachment.name}</span>
                            {attachment.class_type && (
                              <Badge variant="outline" className="text-xs ml-2">
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
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-3 border-b space-y-1">
                <div>
                  <strong>To:</strong> {handler.email}
                </div>
                <div>
                  <strong>Subject:</strong> {preview.subject}
                </div>
                {selectedAttachments.length > 0 && (
                  <div className="flex items-center gap-2">
                    <strong>Attachments:</strong>
                    {selectedAttachments.map(a => (
                      <Badge key={a.id} variant="outline" className="text-xs">
                        <Paperclip className="h-3 w-3 mr-1" />
                        {a.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <iframe
                srcDoc={preview.html}
                className="w-full min-h-[400px] bg-white"
                title="Email Preview"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={isSending || (emailMode === "custom" && (!customSubject || !customMessage)) || (emailMode === "template" && !hasSelectedTemplate)}
          >
          {isSending ? (
              "Queuing..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Queue Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

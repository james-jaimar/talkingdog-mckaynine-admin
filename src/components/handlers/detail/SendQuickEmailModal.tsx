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
import { renderTemplate, TemplateVariables } from "@/lib/email/template-renderer";
import { useBranch } from "@/context/BranchContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Eye, Mail, User, Dog, FileText } from "lucide-react";
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
  };
}

export function SendQuickEmailModal({ open, onOpenChange, handler }: SendQuickEmailModalProps) {
  const { templatesWithStatus, isLoading: templatesLoading } = useTemplateConfigurations();
  const { currentBranch } = useBranch();
  
  const [emailMode, setEmailMode] = useState<"template" | "custom">("custom");
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>("");
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");
  const [isSending, setIsSending] = useState(false);
  
  // Dog selection
  const [dogs, setDogs] = useState<DogInfo[]>([]);
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);

  // Show all configured and active templates
  const availableTemplates = templatesWithStatus.filter(t => t.isConfigured && t.isActive);
  const selectedTemplateData = templatesWithStatus.find(t => t.code === selectedTemplateCode);

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
      setSelectedTemplateCode("");
      setCustomSubject("");
      setCustomMessage("");
      setActiveTab("compose");
      setEmailMode("custom");
      setSelectedDogIds([]);
    }
  }, [open, handler.id]);

  const toggleDogSelection = (dogId: string) => {
    setSelectedDogIds(prev => 
      prev.includes(dogId) 
        ? prev.filter(id => id !== dogId)
        : [...prev, dogId]
    );
  };

  // Build template variables
  const getTemplateVariables = (): TemplateVariables => {
    const configVars = selectedTemplateData?.configuration?.variables || {};
    
    return {
      handler_name: handler.first_name || "",
      handler_full_name: `${handler.first_name} ${handler.last_name}`,
      handler_email: handler.email || "",
      dog_name: selectedDogNames || "your dog",
      branch_name: currentBranch?.name || "McKaynine",
      branch_email: (currentBranch as any)?.email || "",
      branch_phone: (currentBranch as any)?.phone || "",
      base_url: "https://mckaynine.talkingdog.co.za",
      custom_message: customMessage,
      ...configVars,
    };
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

    if (emailMode === "template" && !selectedTemplateData) {
      toast.error("Please select a template");
      return;
    }

    setIsSending(true);
    try {
      let subject: string;
      let html: string;

      if (emailMode === "custom") {
        subject = customSubject;
        // Wrap custom message in a simple HTML template
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="white-space: pre-wrap; line-height: 1.6;">${customMessage.replace(/\n/g, '<br>')}</div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #666; font-size: 14px;">
              Sent from ${currentBranch?.name || "McKaynine"}<br/>
              ${(currentBranch as any)?.email || ""}<br/>
              ${(currentBranch as any)?.phone || ""}
            </p>
          </div>
        `;
      } else {
        const template = getPrebuiltTemplate(selectedTemplateCode);
        if (!template) throw new Error("Template not found");
        
        const variables = getTemplateVariables();
        const configVars = selectedTemplateData?.configuration?.variables || {};
        
        const rawHtml = template.getHtml(configVars);
        html = renderTemplate(rawHtml, variables);
        subject = renderTemplate(template.subject, variables);
      }

      // Send email via edge function
      const { error: emailError } = await supabase.functions.invoke("send-with-smtp", {
        body: {
          to: handler.email,
          subject,
          html,
          from: undefined,
          fromName: currentBranch?.name ? `${currentBranch.name} McKaynine` : "McKaynine",
        },
      });

      if (emailError) throw emailError;

      // Log the email
      await supabase.from("email_log").insert({
        handler_id: handler.id,
        recipient_email: handler.email,
        subject,
        status: "sent",
      });

      toast.success(`Email sent to ${handler.email}`);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(`Failed to send: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Generate preview
  const getPreview = () => {
    if (emailMode === "custom") {
      return {
        subject: customSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="white-space: pre-wrap; line-height: 1.6;">${customMessage.replace(/\n/g, '<br>')}</div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #666; font-size: 14px;">
              Sent from ${currentBranch?.name || "McKaynine"}<br/>
              ${(currentBranch as any)?.email || ""}<br/>
              ${(currentBranch as any)?.phone || ""}
            </p>
          </div>
        `,
      };
    }

    if (!selectedTemplateData) return { html: "", subject: "" };
    
    const template = getPrebuiltTemplate(selectedTemplateCode);
    if (!template) return { html: "", subject: "" };
    
    const variables = getTemplateVariables();
    const configVars = selectedTemplateData.configuration?.variables || {};
    
    const rawHtml = template.getHtml(configVars);
    const renderedHtml = renderTemplate(rawHtml, variables);
    const renderedSubject = renderTemplate(template.subject, variables);
    
    return { html: renderedHtml, subject: renderedSubject };
  };

  const preview = getPreview();
  const canPreview = emailMode === "custom" ? (customSubject && customMessage) : !!selectedTemplateData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
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
                  <div
                    key={dog.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedDogIds.includes(dog.id)
                        ? "bg-primary/10 border-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                    onClick={() => toggleDogSelection(dog.id)}
                  >
                    <Checkbox
                      checked={selectedDogIds.includes(dog.id)}
                      onCheckedChange={() => toggleDogSelection(dog.id)}
                    />
                    <span className="font-medium">{dog.name}</span>
                    <span className="text-xs text-muted-foreground">({dog.breed})</span>
                  </div>
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
                    className="min-h-[200px]"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Select Template</Label>
                  {templatesLoading ? (
                    <div className="text-sm text-muted-foreground">Loading templates...</div>
                  ) : availableTemplates.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No templates configured. Use custom email instead.
                    </div>
                  ) : (
                    <Select value={selectedTemplateCode} onValueChange={setSelectedTemplateCode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTemplates.map((template) => (
                          <SelectItem key={template.code} value={template.code}>
                            <div className="flex items-center gap-2">
                              <span>{template.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {template.classType}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedTemplateData?.configuration?.variables && (
                  <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                    <p className="font-medium mb-2">Template Details:</p>
                    {selectedTemplateData.configuration.variables.class_day_time && (
                      <p><strong>When:</strong> {selectedTemplateData.configuration.variables.class_day_time}</p>
                    )}
                    {selectedTemplateData.configuration.variables.class_dates && (
                      <p><strong>Dates:</strong> {selectedTemplateData.configuration.variables.class_dates}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="custom-message">Personal Message (Optional)</Label>
                  <Textarea
                    id="custom-message"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Add a personal note that will appear at the top of the email..."
                    className="min-h-[100px]"
                  />
                </div>
              </>
            )}
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
            disabled={isSending || (emailMode === "custom" && (!customSubject || !customMessage)) || (emailMode === "template" && !selectedTemplateData)}
          >
            {isSending ? (
              "Sending..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

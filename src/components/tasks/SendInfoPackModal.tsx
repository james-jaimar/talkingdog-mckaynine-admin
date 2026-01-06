import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskWithHandler } from "@/hooks/useAllTasks";
import { useTemplateConfigurations } from "@/hooks/useTemplateConfigurations";
import { renderTemplate, TemplateVariables } from "@/lib/email/template-renderer";
import { useBranch } from "@/context/BranchContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Eye, Mail, User, Dog, AlertCircle } from "lucide-react";
import { getPrebuiltTemplate } from "@/lib/email/templates";

interface SendInfoPackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithHandler | null;
}

export function SendInfoPackModal({ open, onOpenChange, task }: SendInfoPackModalProps) {
  const { templatesWithStatus, isLoading: templatesLoading } = useTemplateConfigurations();
  const { currentBranch } = useBranch();
  const queryClient = useQueryClient();
  
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");
  const [isSending, setIsSending] = useState(false);
  const [dogName, setDogName] = useState<string>("");

  // Show all configured and active templates - admin can choose any template
  const availableTemplates = templatesWithStatus.filter(t => t.isConfigured && t.isActive);

  const selectedTemplateData = templatesWithStatus.find(t => t.code === selectedTemplateCode);

  // Fetch dog information when task changes
  useEffect(() => {
    async function fetchDogInfo() {
      if (!task?.handler_id) return;
      
      const { data: dogs } = await supabase
        .from("dogs")
        .select("name")
        .eq("client_id", task.handler_id)
        .limit(1);
      
      if (dogs && dogs.length > 0) {
        setDogName(dogs[0].name);
      }
    }
    
    if (open && task) {
      fetchDogInfo();
      setSelectedTemplateCode("");
      setCustomMessage("");
      setActiveTab("compose");
    }
  }, [open, task]);

  // Build template variables
  const getTemplateVariables = (): TemplateVariables => {
    const configVars = selectedTemplateData?.configuration?.variables || {};
    
    return {
      handler_name: task?.handler?.first_name || "",
      handler_full_name: task?.handler ? `${task.handler.first_name} ${task.handler.last_name}` : "",
      handler_email: task?.handler?.email || "",
      dog_name: dogName,
      completed_class: task?.class_type || "",
      next_class: selectedTemplateData?.classType || "",
      branch_name: currentBranch?.name || "McKaynine",
      branch_email: (currentBranch as any)?.email || "",
      branch_phone: (currentBranch as any)?.phone || "",
      base_url: "https://mckaynine.talkingdog.co.za",
      custom_message: customMessage,
      // Merge in configured template variables
      ...configVars,
    };
  };

  const handleSend = async () => {
    if (!task || !selectedTemplateData || !task.handler?.email) {
      toast.error("Missing required information");
      return;
    }

    setIsSending(true);
    try {
      const template = getPrebuiltTemplate(selectedTemplateCode);
      if (!template) throw new Error("Template not found");
      
      const variables = getTemplateVariables();
      const configVars = selectedTemplateData.configuration?.variables || {};
      
      // Generate HTML from the pre-built template
      const rawHtml = template.getHtml(configVars);
      const renderedContent = renderTemplate(rawHtml, variables);
      const renderedSubject = renderTemplate(template.subject, variables);

      // Send email via edge function
      const { error: emailError } = await supabase.functions.invoke("send-with-smtp", {
        body: {
          to: task.handler.email,
          subject: renderedSubject,
          html: renderedContent,
          from: undefined,
          fromName: currentBranch?.name,
        },
      });

      if (emailError) throw emailError;

      // Log the email
      await supabase.from("email_log").insert({
        handler_id: task.handler_id,
        task_id: task.id,
        template_id: selectedTemplateData.configuration?.id,
        recipient_email: task.handler.email,
        subject: renderedSubject,
        status: "sent",
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

      toast.success(`Info pack sent to ${task.handler.email}`);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending info pack:", error);
      toast.error(`Failed to send: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  if (!task) return null;

  // Generate preview
  const getPreview = () => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
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
            <TabsTrigger value="preview" className="flex items-center gap-2" disabled={!selectedTemplateData}>
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
                      No templates available for {task.class_type || "this class"}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Please configure a template in Settings → Email Templates first.
                    </p>
                  </div>
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
              <p className="text-xs text-muted-foreground">
                This message will be inserted above the main template content.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
            {selectedTemplateData ? (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted p-3 border-b space-y-1">
                  <div>
                    <strong>To:</strong> {task.handler?.email}
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
            disabled={!selectedTemplateData || isSending}
          >
            {isSending ? (
              <>
                <span className="mr-2 animate-spin">⟳</span>
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

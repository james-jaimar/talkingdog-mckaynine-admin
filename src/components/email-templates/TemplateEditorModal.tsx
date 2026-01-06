
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";
import { AVAILABLE_MERGE_FIELDS, getSampleTemplate, renderTemplate, getSampleVariables } from "@/lib/email/template-renderer";
import { Code, Eye, Plus } from "lucide-react";

interface TemplateEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate | null;
}

const TEMPLATE_TYPES = [
  { value: "info_pack", label: "Info Pack" },
  { value: "welcome", label: "Welcome" },
  { value: "reminder", label: "Reminder" },
  { value: "confirmation", label: "Confirmation" },
  { value: "custom", label: "Custom" },
];

const CLASS_TYPES = [
  { value: "", label: "All Classes" },
  { value: "Puppy", label: "Puppy" },
  { value: "EO", label: "EO" },
  { value: "CGC Bronze", label: "CGC Bronze" },
  { value: "CGC Silver", label: "CGC Silver" },
  { value: "Beginner", label: "Beginner" },
  { value: "Novice", label: "Novice" },
  { value: "WT", label: "WT" },
  { value: "A-Test", label: "A-Test" },
  { value: "Yoga", label: "Yoga" },
];

export function TemplateEditorModal({ open, onOpenChange, template }: TemplateEditorModalProps) {
  const { createTemplate, updateTemplate } = useEmailTemplates();
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  
  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("info_pack");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [classType, setClassType] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Reset form when modal opens/closes or template changes
  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name || "");
        setType(template.type);
        setSubject(template.subject);
        setContent(template.content);
        setClassType(template.class_type || "");
        setIsActive(template.is_active);
      } else {
        // New template - use sample as starting point
        setName("");
        setType("info_pack");
        setSubject("Information about {{next_class}} Class");
        setContent(getSampleTemplate());
        setClassType("");
        setIsActive(true);
      }
      setActiveTab("edit");
    }
  }, [open, template]);

  const insertMergeField = (field: string) => {
    const textarea = document.getElementById("template-content") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + `{{${field}}}` + content.substring(end);
      setContent(newContent);
      // Restore focus and cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + field.length + 4, start + field.length + 4);
      }, 0);
    } else {
      setContent(content + `{{${field}}}`);
    }
  };

  const handleSubmit = async () => {
    const data = {
      name,
      type,
      subject,
      content,
      class_type: classType || undefined,
      is_active: isActive,
    };

    if (template) {
      await updateTemplate.mutateAsync({ id: template.id, ...data });
    } else {
      await createTemplate.mutateAsync(data);
    }
    onOpenChange(false);
  };

  const isValid = name.trim() && subject.trim() && content.trim();
  const previewHtml = renderTemplate(content, getSampleVariables());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "Create Template"}</DialogTitle>
          <DialogDescription>
            {template
              ? "Update the email template settings and content"
              : "Create a new email template with merge fields"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="flex-1 overflow-auto space-y-4 mt-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., EO Class Info Pack"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Template Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="classType">Class Type (Optional)</Label>
                <Select value={classType} onValueChange={setClassType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_TYPES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="active" className="font-normal">
                    {isActive ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Information about {{next_class}} Class"
              />
            </div>

            {/* Merge Fields */}
            <div className="space-y-2">
              <Label>Insert Merge Field</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_MERGE_FIELDS.map((field) => (
                  <Badge
                    key={field.key}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => insertMergeField(field.key)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {field.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="template-content">HTML Content</Label>
              <Textarea
                id="template-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter HTML content with merge fields like {{handler_name}}"
                className="font-mono text-sm min-h-[300px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-3 border-b">
                <strong>Subject:</strong> {renderTemplate(subject, getSampleVariables())}
              </div>
              <iframe
                srcDoc={previewHtml}
                className="w-full min-h-[400px] bg-white"
                title="Email Preview"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid || createTemplate.isPending || updateTemplate.isPending}
          >
            {(createTemplate.isPending || updateTemplate.isPending) && (
              <span className="mr-2 animate-spin">⟳</span>
            )}
            {template ? "Update Template" : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

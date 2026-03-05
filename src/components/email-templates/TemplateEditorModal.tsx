import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";
import { AVAILABLE_MERGE_FIELDS, getSampleTemplate, renderTemplate, getSampleVariables } from "@/lib/email/template-renderer";
import { wrapWithPreviewStyles } from "@/lib/email/preview-styles";
import { EO3_JAN_2026_TEMPLATE, EO3_JAN_2026_SUBJECT } from "@/lib/email/templates/eo3-jan-2026";
import { CONGRATS_TEMPLATES } from "@/lib/email/templates/congrats-templates";
import { Eye, FileDown, Edit3, FileUp } from "lucide-react";
import { RichTextEditor } from "@/components/platform-templates/RichTextEditor";
import { WordUploadModal } from "@/components/platform-templates/WordUploadModal";
import { useBranch } from "@/context/BranchContext";

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
  { value: "all", label: "All Classes" },
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
  const { currentBranch } = useBranch();
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [showWordUpload, setShowWordUpload] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("info_pack");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [classType, setClassType] = useState("all");
  const [isActive, setIsActive] = useState(true);

  // Reset form when modal opens/closes or template changes
  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name || "");
        setType(template.type);
        setSubject(template.subject);
        setContent(template.content);
        setClassType(template.class_type || "all");
        setIsActive(template.is_active);
      } else {
        // New template - use sample as starting point
        setName("");
        setType("info_pack");
        setSubject("Information about {{next_class}} Class");
        setContent(getSampleTemplate());
        setClassType("all");
        setIsActive(true);
      }
      setActiveTab("edit");
    }
  }, [open, template]);

  // Merge field insertion is now handled by the RichTextEditor component

  const loadPresetTemplate = (preset: string) => {
    if (preset === "eo3-jan-2026") {
      setName("EO3 Jan 2026");
      setSubject(EO3_JAN_2026_SUBJECT);
      setContent(EO3_JAN_2026_TEMPLATE);
      setClassType("EO");
      setType("info_pack");
    } else if (preset === "basic") {
      setName("");
      setSubject("Information about {{next_class}} Class");
      setContent(getSampleTemplate());
      setClassType("all");
      setType("info_pack");
    } else {
      // Check if it's a congrats template
      const congratsTemplate = CONGRATS_TEMPLATES.find(t => t.name === preset);
      if (congratsTemplate) {
        setName(congratsTemplate.name);
        setSubject(congratsTemplate.subject);
        setContent(congratsTemplate.content);
        setClassType(congratsTemplate.classType || "all");
        setType("custom");
      }
    }
  };

  const handleSubmit = async () => {
    const data = {
      name,
      type,
      subject,
      content,
      class_type: classType === "all" ? undefined : classType,
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
  const previewHtml = wrapWithPreviewStyles(renderTemplate(content, getSampleVariables(currentBranch?.name)));

  const handleWordConversion = (convertedHtml: string, suggestedName: string) => {
    setContent(convertedHtml);
    if (!name) {
      setName(suggestedName);
    }
    if (!subject) {
      setSubject(`${suggestedName} - {{branch_name}}`);
    }
  };

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
              <Edit3 className="h-4 w-4" />
              Write Email
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="flex-1 overflow-auto space-y-4 mt-4">
            {/* Load Preset Template or Import from Word */}
            {!template && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowWordUpload(true)}>
                  <FileUp className="h-4 w-4 mr-2" />
                  Import from Word
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileDown className="h-4 w-4 mr-2" />
                      Load Preset Template
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-80 overflow-y-auto">
                    <DropdownMenuLabel>Info Packs</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => loadPresetTemplate("eo3-jan-2026")}>
                      EO3 Jan 2026 (Full HTML)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => loadPresetTemplate("basic")}>
                      Basic Template
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Congratulations Templates</DropdownMenuLabel>
                    {CONGRATS_TEMPLATES.map((t) => (
                      <DropdownMenuItem key={t.name} onClick={() => loadPresetTemplate(t.name)}>
                        {t.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

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

            {/* Content - WYSIWYG Editor */}
            <div className="space-y-2">
              <Label>Email Content</Label>
              <p className="text-xs text-muted-foreground">
                Write your email just like you would in any email app. Use the toolbar to format text and insert merge fields (like handler name, dog name, etc.).
              </p>
              <RichTextEditor
                content={content}
                onChange={setContent}
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-3 border-b">
                <strong>Subject:</strong> {renderTemplate(subject, getSampleVariables(currentBranch?.name))}
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

        <WordUploadModal
          open={showWordUpload}
          onOpenChange={setShowWordUpload}
          onConversionComplete={handleWordConversion}
        />
      </DialogContent>
    </Dialog>
  );
}

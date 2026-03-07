
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlatformTemplates, usePlatformTemplate, ConfigurableField } from "@/hooks/usePlatformTemplates";
import { Loader2, Save, Plus, Trash2, Eye, Code, FileUp } from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { ConfigurableFieldsManager } from "./ConfigurableFieldsManager";
import { renderTemplate } from "@/lib/email/template-renderer";
import { WordUploadModal } from "./WordUploadModal";

interface TemplateEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId?: string;
}

// CLASS_TYPES now loaded dynamically via useClassTypes hook
import { useClassTypes } from "@/hooks/useClassTypes";

const DEFAULT_HTML = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Hello {{handler_name}},</h2>
  
  <p>Thank you for your interest in our dog training classes.</p>
  
  <p>Your dog <strong>{{dog_name}}</strong> has been registered for our upcoming class.</p>
  
  <h3>Class Details</h3>
  <p><strong>When:</strong> {{class_day_time}}</p>
  <p><strong>Dates:</strong> {{class_dates}}</p>
  
  <p>We look forward to seeing you!</p>
  
  {{signature}}
</div>`;

export function TemplateEditorModal({ open, onOpenChange, templateId }: TemplateEditorModalProps) {
  const { createTemplate, updateTemplate } = usePlatformTemplates();
  const { data: existingTemplate, isLoading } = usePlatformTemplate(templateId);
  const { classTypeNames } = useClassTypes();
  
  const [activeTab, setActiveTab] = useState("editor");
  const [showWordUpload, setShowWordUpload] = useState(false);
  
  // Form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [classType, setClassType] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState(DEFAULT_HTML);
  const [configurableFields, setConfigurableFields] = useState<ConfigurableField[]>([]);
  const [isActive, setIsActive] = useState(false);

  // Reset form when template changes
  useEffect(() => {
    if (existingTemplate) {
      setCode(existingTemplate.code);
      setName(existingTemplate.name);
      setDescription(existingTemplate.description || "");
      setClassType(existingTemplate.class_type || "");
      setSubject(existingTemplate.subject);
      setHtmlContent(existingTemplate.html_content);
      setConfigurableFields(existingTemplate.configurable_fields);
      setIsActive(existingTemplate.is_active);
    } else if (!templateId) {
      // New template - reset form
      setCode("");
      setName("");
      setDescription("");
      setClassType("");
      setSubject("");
      setHtmlContent(DEFAULT_HTML);
      setConfigurableFields([]);
      setIsActive(false);
    }
  }, [existingTemplate, templateId]);

  const handleSave = () => {
    const templateData = {
      code: code || name.toLowerCase().replace(/\s+/g, "_"),
      name,
      description: description || null,
      class_type: classType || null,
      subject,
      html_content: htmlContent,
      configurable_fields: configurableFields,
      is_active: isActive,
    };

    if (templateId) {
      updateTemplate.mutate({ id: templateId, ...templateData }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      createTemplate.mutate(templateData, {
        onSuccess: () => onOpenChange(false)
      });
    }
  };

  const getSampleVariables = () => {
    const variables: Record<string, string> = {
      handler_name: "John Smith",
      dog_name: "Max",
      dog_breed: "German Shepherd",
      branch_name: "McKaynine Randburg",
      branch_email: "info@mckaynine.co.za",
      branch_phone: "011 123 4567",
    };
    
    // Add configurable fields with sample values
    configurableFields.forEach(field => {
      variables[field.key] = field.defaultValue || field.placeholder || `[${field.label}]`;
    });
    
    return variables;
  };

  const previewHtml = renderTemplate(htmlContent, getSampleVariables());

  const handleWordConversion = (convertedHtml: string, suggestedName: string) => {
    setHtmlContent(convertedHtml);
    if (!name) {
      setName(suggestedName);
    }
    if (!subject) {
      setSubject(`${suggestedName} - {{branch_name}}`);
    }
  };

  if (isLoading && templateId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[90vh]">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {templateId ? "Edit Template" : "Create New Template"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="fields">Configurable Fields</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="flex-1 overflow-auto mt-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left: Settings */}
              <div className="space-y-4">
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
                    <Label htmlFor="code">Code (optional)</Label>
                    <Input
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Auto-generated from name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of when this template is used"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Class Type</Label>
                    <Select value={classType} onValueChange={setClassType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classTypeNames.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="active"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                    <Label htmlFor="active">Active</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Your {{class_type}} Class Registration"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{{variable}}"} syntax for dynamic content
                  </p>
                </div>
              </div>

              {/* Right: Content Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Content</Label>
                    <p className="text-xs text-muted-foreground">
                      Write your email or import from a Word document.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWordUpload(true)}
                  >
                    <FileUp className="h-4 w-4 mr-2" />
                    Import from Word
                  </Button>
                </div>
                <RichTextEditor
                  content={htmlContent}
                  onChange={setHtmlContent}
                  configurableFields={configurableFields}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fields" className="flex-1 overflow-auto mt-4">
            <ConfigurableFieldsManager
              fields={configurableFields}
              onChange={setConfigurableFields}
            />
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-3 border-b">
                <p className="text-sm">
                  <strong>Subject:</strong> {renderTemplate(subject, getSampleVariables())}
                </p>
              </div>
              <div 
                className="p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!name || !subject || createTemplate.isPending || updateTemplate.isPending}
          >
            {(createTemplate.isPending || updateTemplate.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </div>

        <WordUploadModal
          open={showWordUpload}
          onOpenChange={setShowWordUpload}
          onConversionComplete={handleWordConversion}
        />
      </DialogContent>
    </Dialog>
  );
}

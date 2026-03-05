import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PrebuiltTemplate } from "@/lib/email/templates";
import { useTemplateConfigurations, TemplateConfiguration } from "@/hooks/useTemplateConfigurations";
import { renderTemplate, TemplateVariables, getSampleVariables } from "@/lib/email/template-renderer";
import { Save, Eye, Settings } from "lucide-react";
import { useBranch } from "@/context/BranchContext";

interface TemplateConfigureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: PrebuiltTemplate | null;
  existingConfig?: TemplateConfiguration | null;
}

export function TemplateConfigureModal({ 
  open, 
  onOpenChange, 
  template,
  existingConfig 
}: TemplateConfigureModalProps) {
  const { saveConfiguration } = useTemplateConfigurations();
  const { currentBranch } = useBranch();
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isActive, setIsActive] = useState(true);
  const [activeTab, setActiveTab] = useState("configure");

  // Initialize form when modal opens
  useEffect(() => {
    if (open && template) {
      // Load existing config or defaults
      if (existingConfig) {
        setVariables(existingConfig.variables || {});
        setIsActive(existingConfig.is_active);
      } else {
        // Use default values from template
        const defaults: Record<string, string> = {};
        template.fields.forEach(field => {
          defaults[field.key] = field.defaultValue || '';
        });
        setVariables(defaults);
        setIsActive(true);
      }
      setActiveTab("configure");
    }
  }, [open, template, existingConfig]);

  if (!template) return null;

  const handleFieldChange = (key: string, value: string) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await saveConfiguration.mutateAsync({
      templateCode: template.code,
      variables,
      isActive,
    });
    onOpenChange(false);
  };

  // Generate preview HTML
  const getPreviewHtml = () => {
    const sampleVars = getSampleVariables(currentBranch?.name);
    // Merge configured variables with sample data
    const mergedVars: TemplateVariables = {
      ...sampleVars,
      ...variables,
    };
    
    // Get raw HTML from template
    const rawHtml = template.getHtml(variables);
    // Render with sample handler data
    return renderTemplate(rawHtml, mergedVars);
  };

  const getPreviewSubject = () => {
    const sampleVars = getSampleVariables(currentBranch?.name);
    const mergedVars = { ...sampleVars, ...variables };
    return renderTemplate(template.subject, mergedVars);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure: {template.name}
            <Badge variant="secondary">{template.classType}</Badge>
          </DialogTitle>
          <DialogDescription>
            Fill in the details below. These will be used when sending this template to handlers.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configure" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configure
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="flex-1 overflow-auto mt-4">
            <div className="space-y-6">
              {/* Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-base font-medium">Template Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Active templates can be selected when sending emails
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              {/* Template Fields */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Class Details</h3>
                
                {template.fields.map(field => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.key}
                        value={variables[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={field.key}
                        type="text"
                        value={variables[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                    {field.helpText && (
                      <p className="text-xs text-muted-foreground">{field.helpText}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-3 border-b space-y-1">
                <div>
                  <strong>To:</strong> john@example.com
                </div>
                <div>
                  <strong>Subject:</strong> {getPreviewSubject()}
                </div>
              </div>
              <iframe
                srcDoc={getPreviewHtml()}
                className="w-full min-h-[500px] bg-white"
                title="Email Preview"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Handler-specific fields (name, dog name) are auto-filled when sending
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveConfiguration.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {saveConfiguration.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

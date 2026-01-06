import { useState } from "react";
import { Helmet } from "react-helmet";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useTemplateConfigurations } from "@/hooks/useTemplateConfigurations";
import { Settings, Eye, Mail, Check, Clock } from "lucide-react";
import { TemplateConfigureModal } from "@/components/email-templates/TemplateConfigureModal";
import { TemplatePreviewModal } from "@/components/email-templates/TemplatePreviewModal";
import { PrebuiltTemplate } from "@/lib/email/templates";
import { TemplateConfiguration } from "@/hooks/useTemplateConfigurations";
import { renderTemplate, getSampleVariables } from "@/lib/email/template-renderer";

export default function EmailTemplates() {
  const { templatesWithStatus, isLoading, toggleActive } = useTemplateConfigurations();
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PrebuiltTemplate | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<TemplateConfiguration | null>(null);

  const handleConfigure = (template: PrebuiltTemplate, config: TemplateConfiguration | null) => {
    setSelectedTemplate(template);
    setSelectedConfig(config);
    setIsConfigureOpen(true);
  };

  const handlePreview = (template: PrebuiltTemplate, config: TemplateConfiguration | null) => {
    setSelectedTemplate(template);
    setSelectedConfig(config);
    setIsPreviewOpen(true);
  };

  const handleToggleActive = async (config: TemplateConfiguration) => {
    await toggleActive.mutateAsync({ id: config.id, isActive: !config.is_active });
  };

  // Create a preview-compatible template object for the preview modal
  const getPreviewTemplate = () => {
    if (!selectedTemplate) return null;
    
    const variables = selectedConfig?.variables || {};
    const sampleVars = getSampleVariables();
    const mergedVars = { ...sampleVars, ...variables };
    
    const rawHtml = selectedTemplate.getHtml(variables);
    const renderedHtml = renderTemplate(rawHtml, mergedVars);
    const renderedSubject = renderTemplate(selectedTemplate.subject, mergedVars);
    
    return {
      id: selectedConfig?.id || 'preview',
      branch_id: '',
      name: selectedTemplate.name,
      type: 'info_pack',
      subject: renderedSubject,
      content: renderedHtml,
      class_type: selectedTemplate.classType,
      variables: [],
      is_active: selectedConfig?.is_active ?? false,
      created_at: '',
      updated_at: '',
    };
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Email Templates | McKaynine</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Email Templates</h1>
            <p className="text-muted-foreground">
              Configure class info pack templates. Fill in class details and they'll be ready to send.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templatesWithStatus.map((item) => (
              <Card 
                key={item.code} 
                className={`relative transition-all ${
                  item.isConfigured && item.isActive 
                    ? 'border-primary/50 shadow-md' 
                    : 'opacity-80'
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {item.isConfigured ? (
                    item.isActive ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        <Check className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Not Configured
                    </Badge>
                  )}
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 pr-16">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {item.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{item.classType}</Badge>
                    {item.isConfigured && item.configuration && (
                      <span className="text-xs text-muted-foreground">
                        Last updated: {new Date(item.configuration.updated_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {item.isConfigured && item.configuration?.variables && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                      {item.configuration.variables.class_day_time && (
                        <p><strong>When:</strong> {item.configuration.variables.class_day_time}</p>
                      )}
                      {item.configuration.variables.class_dates && (
                        <p><strong>Dates:</strong> {item.configuration.variables.class_dates}</p>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex justify-between items-center pt-3 border-t">
                  {item.isConfigured && item.configuration ? (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={() => handleToggleActive(item.configuration!)}
                        disabled={toggleActive.isPending}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Configure to enable
                    </span>
                  )}
                  
                  <div className="flex gap-2">
                    {item.isConfigured && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(item, item.configuration)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant={item.isConfigured ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleConfigure(item, item.configuration)}
                    >
                      <Settings className="mr-1 h-4 w-4" />
                      {item.isConfigured ? "Edit" : "Configure"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">How it works</h3>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  <li>• Click "Configure" to set up class dates, times, and pricing for each template</li>
                  <li>• Handler details (name, dog name) are automatically filled when you send</li>
                  <li>• Use the preview to see exactly how the email will look</li>
                  <li>• Active templates appear in the "Send Info Pack" dropdown on tasks</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <TemplateConfigureModal
        open={isConfigureOpen}
        onOpenChange={setIsConfigureOpen}
        template={selectedTemplate}
        existingConfig={selectedConfig}
      />

      <TemplatePreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        template={getPreviewTemplate()}
      />
    </DashboardLayout>
  );
}
